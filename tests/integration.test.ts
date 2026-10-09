// Runs the real server on a random port and plays through real sockets.
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ClientToServerEvents, GameState, JoinRequest, JoinResponse, ServerToClientEvents } from "../shared/types";
import { createGameServer, rateLimiter, type GameServer } from "../server/app";
import { DEFAULT_TIMINGS, HostHistory } from "../server/game";
import { createStats } from "../server/stats";

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let server: GameServer;
let url = "";
const sockets: ClientSocket[] = [];

beforeAll(async () => {
  const stats = createStats();
  server = createGameServer({
    deps: {
      generateQuestions: async () => [],
      aiEnabled: false,
      tracker: stats,
      timings: { ...DEFAULT_TIMINGS, revealMs: 50 },
      now: Date.now,
      log: () => {},
      questionHistory: new HostHistory()
    },
    stats,
    clientDir: "does-not-exist",
    statsKey: "secret"
  });
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  url = `http://localhost:${(server.httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  for (const s of sockets) s.disconnect();
  await server.close();
});

interface Bot {
  socket: ClientSocket;
  state: GameState | null;
  join(req: JoinRequest): Promise<JoinResponse>;
  waitFor(pred: (s: GameState) => boolean): Promise<GameState>;
}

function bot(): Bot {
  const socket: ClientSocket = connect(url, { transports: ["websocket"], forceNew: true });
  sockets.push(socket);
  const b: Bot = {
    socket,
    state: null,
    join: (req) => new Promise((resolve) => socket.emit("join", req, resolve)),
    waitFor: (pred) =>
      new Promise((resolve, reject) => {
        if (b.state && pred(b.state)) return resolve(b.state);
        const timer = setTimeout(() => reject(new Error(`timed out; last phase ${b.state?.phase}`)), 5000);
        const check = (s: GameState) => {
          if (!pred(s)) return;
          clearTimeout(timer);
          socket.off("state", check);
          resolve(s);
        };
        socket.on("state", check);
      })
  };
  socket.on("state", (s) => (b.state = s));
  return b;
}

describe("game server over sockets", () => {
  it("plays a full round with three players", async () => {
    const [host, p2, p3] = [bot(), bot(), bot()];
    const created = await host.join({ name: "Host", create: true });
    if (!created.ok) throw new Error(created.error);

    expect(await bot().join({ name: "Nobody", code: "ZZZZ" })).toMatchObject({ ok: false });
    expect(await p2.join({ name: "host", code: created.code })).toMatchObject({ ok: false });
    expect(await p2.join({ name: "Two", code: created.code.toLowerCase() })).toMatchObject({ ok: true });
    expect(await p3.join({ name: "Three", code: created.code })).toMatchObject({ ok: true });

    await host.waitFor((s) => s.players.length === 3);
    host.socket.emit("start");

    for (let i = 0; i < 10; i++) {
      const s = await host.waitFor((x) => x.phase === "question" && x.question?.index === i);
      const target = s.question!.options[1].id;
      for (const b of [host, p2, p3]) b.socket.emit("vote", { targetId: target });
      await host.waitFor((x) => x.phase === "reveal" || x.phase === "final");
    }

    const final = await host.waitFor((s) => s.phase === "final");
    expect(final.final!.leaderboard.map((p) => p.score)).toEqual(expect.arrayContaining([expect.any(Number)]));
    expect(final.final!.leaderboard[0].score).toBeGreaterThan(0);
    expect(final.final!.highlights.length).toBeGreaterThan(0);
  });

  it("puts a refreshed player back into their game with their token", async () => {
    const host = bot();
    const created = await host.join({ name: "Refresher", create: true });
    if (!created.ok) throw new Error(created.error);
    host.socket.disconnect();

    const again = bot();
    const res = await again.join({ code: created.code, token: created.token });
    expect(res).toMatchObject({ ok: true, code: created.code });
    const s = await again.waitFor((x) => x.players.length === 1);
    expect(s.players[0]).toMatchObject({ name: "Refresher", connected: true });
    expect(s.hostId).toBe(s.youId);
  });

  it("serves health and protects the stats page", async () => {
    expect(await (await fetch(`${url}/health`)).text()).toBe("ok");
    expect((await fetch(`${url}/stats?key=wrong`)).status).toBe(404);
    const page = await fetch(`${url}/stats?key=secret`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Players joined");
  });
});

describe("rateLimiter", () => {
  it("allows up to the limit per window, then refuses until the window passes", () => {
    let now = 0;
    const allow = rateLimiter(2, 1000, () => now);
    expect([allow("k"), allow("k"), allow("k")]).toEqual([true, true, false]);
    expect(allow("other")).toBe(true);
    now = 1001;
    expect(allow("k")).toBe(true);
  });
});
