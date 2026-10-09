import express from "express";
import { readFileSync, existsSync } from "node:fs";
import { createServer, type Server as HttpServer } from "node:http";
import { resolve } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../shared/types";
import { RoomManager, type GameDeps, type Room } from "./game";
import { renderIndex, renderStatsPage, escapeHtml } from "./pages";
import type { StatsStore } from "./stats";

export interface AppOptions {
  deps: GameDeps;
  stats: StatsStore;
  /** Folder with the built React app (index.html + assets). */
  clientDir?: string;
  statsKey?: string;
  goatcounterCode?: string;
}

export interface GameServer {
  httpServer: HttpServer;
  io: Server<ClientToServerEvents, ServerToClientEvents>;
  manager: RoomManager;
  close(): Promise<void>;
}

/** Simple sliding-window limiter: at most `limit` hits per `windowMs` per key. */
export function rateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const t = now();
    if (hits.size > 10_000) hits.clear(); // bound memory if many different keys show up
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(t);
    hits.set(key, recent);
    return true;
  };
}

export function createGameServer(opts: AppOptions): GameServer {
  const { deps, stats, statsKey = "", goatcounterCode } = opts;
  const clientDir = resolve(opts.clientDir ?? "dist/client");

  const app = express();
  app.set("trust proxy", true); // Render sits behind a proxy; needed for correct https URLs
  app.disable("x-powered-by");

  const indexPath = resolve(clientDir, "index.html");
  const template = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
  const sendIndex: express.RequestHandler = (req, res) => {
    if (!template) return res.status(503).send("Client not built. Run `npm run build`.");
    const origin = `${req.protocol}://${req.get("host")}`;
    res.type("html").send(renderIndex(template, { origin, roomCode: String(req.query.room ?? ""), goatcounterCode }));
  };
  app.get(["/", "/index.html"], sendIndex);
  // Vite puts a content hash in every file name under /assets, so those never change.
  app.use("/assets", express.static(resolve(clientDir, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(clientDir, { index: false, maxAge: "1d" }));
  app.get("/health", (_req, res) => res.send("ok"));

  const keyMatches = (given: unknown) => {
    const a = Buffer.from(String(given ?? ""));
    const b = Buffer.from(statsKey);
    return statsKey.length > 0 && a.length === b.length && timingSafeEqual(a, b);
  };
  // Private stats page: /stats?key=<STATS_KEY>
  app.get("/stats", async (req, res) => {
    if (!keyMatches(req.query.key)) return res.status(404).send("Not found");
    try {
      res.type("html").send(renderStatsPage(await stats.read(14), stats.persistent));
    } catch (err) {
      res.status(500).send(`Could not load stats: ${escapeHtml(err instanceof Error ? err.message : err)}`);
    }
  });

  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

  // Which socket each player is currently using, so we can push them their own snapshot.
  const socketOf = new Map<string, string>();
  const broadcast = (room: Room) => {
    for (const p of room.players.values()) {
      const sid = socketOf.get(p.id);
      if (p.connected && sid) io.to(sid).emit("state", room.stateFor(p.id));
    }
  };
  const manager = new RoomManager(deps, broadcast);
  const sweeper = setInterval(() => manager.sweep(), 60_000);
  sweeper.unref();

  const canCreateRoom = rateLimiter(10, 60_000); // per IP
  io.on("connection", (socket) => {
    let room: Room | null = null;
    let playerId: string | null = null;
    const allowEvent = rateLimiter(30, 1000); // per socket; real players send a few per second at most
    socket.use((_packet, next) => (allowEvent(socket.id) ? next() : next(new Error("Too many requests"))));
    socket.on("error", () => {}); // rate-limit rejections land here; nothing else to do

    socket.on("join", (req, reply) => {
      if (typeof reply !== "function") return;
      if (room) return reply({ ok: false, error: "Already in a room." });

      let target: Room | undefined;
      if (req?.create) {
        if (!canCreateRoom(socket.handshake.address)) {
          return reply({ ok: false, error: "Too many rooms created. Try again in a minute." });
        }
        target = manager.create();
        if (req.joinedBefore === true) deps.tracker.track("creators_who_joined_before");
      } else {
        target = manager.get(req?.code);
        if (!target) return reply({ ok: false, error: "Room not found. Check the code." });
      }

      let player = target.findByToken(req?.token);
      if (!player) {
        const added = target.addPlayer(req?.name);
        if (!added.ok) {
          // A just-created room that nobody could join should not linger.
          if (target.players.size === 0) manager.delete(target.code);
          return reply(added);
        }
        player = added.player;
      }

      room = target;
      playerId = player.id;
      socketOf.set(player.id, socket.id);
      reply({ ok: true, code: target.code, token: player.token });
      target.connect(player.id);
    });

    socket.on("settings", (patch) => {
      if (room && playerId) room.updateSettings(playerId, patch ?? {});
    });
    socket.on("start", () => {
      if (room && playerId) room.start(playerId);
    });
    socket.on("toLobby", () => {
      if (room && playerId) room.toLobby(playerId);
    });
    socket.on("vote", (data) => {
      if (room && playerId) room.vote(playerId, data?.targetId);
    });
    socket.on("leave", () => {
      if (!room || !playerId) return;
      const [r, id] = [room, playerId];
      room = playerId = null;
      socketOf.delete(id);
      r.removePlayer(id);
    });
    socket.on("disconnect", () => {
      // Ignore if the player has already reconnected on a newer socket.
      if (!room || !playerId || socketOf.get(playerId) !== socket.id) return;
      socketOf.delete(playerId);
      room.disconnect(playerId);
    });
  });

  return {
    httpServer,
    io,
    manager,
    async close() {
      clearInterval(sweeper);
      manager.disposeAll();
      await io.close();
    }
  };
}
