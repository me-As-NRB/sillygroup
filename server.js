import express from "express";
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { generateQuestions, aiEnabled, aiProvider } from "./ai.js";
import { pickFromBank } from "./questions.js";

const PORT = process.env.PORT || 3000;
const QUESTIONS_PER_ROUND = 10;
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const REVEAL_MS = 8000;
const TIMER_CHOICES = [15, 20, 30];
const HOST_GRACE_MS = 10_000; // time a refreshing host keeps the crown
const LOBBY_DROP_MS = 30_000; // disconnected players leave the lobby after this
const GAME_DROP_MS = 5 * 60_000; // ...and leave a running game after this
const EMPTY_ROOM_MS = 10 * 60_000;

const app = express();
app.use(express.static("public"));
app.get("/health", (_req, res) => res.send("ok"));

const httpServer = createServer(app);
const io = new Server(httpServer);

/** @type {Map<string, any>} */
const rooms = new Map();

// ---------- helpers ----------

function newRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O, they look like 1 and 0
  let code;
  do {
    code = Array.from(randomBytes(4), (b) => letters[b % letters.length]).join("");
  } while (rooms.has(code));
  return code;
}

function cleanName(raw) {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, 20);
}

function connectedPlayers(room) {
  return [...room.players.values()].filter((p) => p.connected);
}

function pointsForRank(rank) {
  return Math.max(100, 1000 - rank * 150);
}

function clearTimer(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
}

function buildState(room, me) {
  const q = room.current;
  return {
    code: room.code,
    phase: room.phase,
    youId: me.id,
    hostId: room.hostId,
    aiEnabled,
    settings: room.settings,
    minPlayers: MIN_PLAYERS,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
      voted: Boolean(q && q.votes.has(p.id))
    })),
    question:
      q && (room.phase === "question" || room.phase === "reveal")
        ? {
            index: room.qIndex,
            total: room.questions.length,
            text: q.text,
            options: q.options,
            remainingMs: room.phase === "question" ? Math.max(0, q.endsAt - Date.now()) : 0,
            durationMs: room.settings.timer * 1000,
            myVote: q.votes.get(me.id)?.targetId ?? null
          }
        : null,
    reveal: room.phase === "reveal" ? room.reveal : null,
    final: room.phase === "final" ? room.final : null
  };
}

function broadcast(room) {
  for (const p of room.players.values()) {
    if (p.connected && p.socketId) io.to(p.socketId).emit("state", buildState(room, p));
  }
}

function ensureHost(room) {
  const host = room.players.get(room.hostId);
  if (host?.connected) return;
  const next = connectedPlayers(room)[0];
  if (next) room.hostId = next.id;
}

function removePlayer(room, playerId) {
  room.players.delete(playerId);
  room.current?.votes.delete(playerId);
  if (room.hostId === playerId) {
    room.hostId = null;
    ensureHost(room);
  }
  if (room.players.size === 0) {
    clearTimer(room);
    rooms.delete(room.code);
    return;
  }
  if (room.phase === "question") maybeEndQuestion(room);
  broadcast(room);
}

// ---------- game flow ----------

async function startRound(room) {
  clearTimer(room);
  room.phase = "loading";
  for (const p of room.players.values()) p.score = 0;
  broadcast(room);

  const roundId = (room.roundId = randomUUID());
  let questions = await generateQuestions({
    count: QUESTIONS_PER_ROUND,
    theme: room.settings.theme,
    playerCount: room.players.size,
    avoid: room.used
  });
  // Room may have changed (or emptied) while waiting on the AI.
  if (room.roundId !== roundId || !rooms.has(room.code)) return;

  if (questions.length < QUESTIONS_PER_ROUND) {
    const topUp = pickFromBank(QUESTIONS_PER_ROUND - questions.length, [...room.used, ...questions]);
    questions = [...questions, ...topUp];
  }
  room.questions = questions;
  room.used.push(...questions);
  room.qIndex = -1;
  nextQuestion(room);
}

function nextQuestion(room) {
  clearTimer(room);
  room.qIndex += 1;
  if (room.qIndex >= room.questions.length) return finishRound(room);

  const options = connectedPlayers(room).map((p) => ({ id: p.id, name: p.name }));
  room.current = {
    text: room.questions[room.qIndex],
    options,
    votes: new Map(), // voterId -> { targetId, at }
    startedAt: Date.now(),
    endsAt: Date.now() + room.settings.timer * 1000
  };
  room.phase = "question";
  room.reveal = null;
  room.timer = setTimeout(() => endQuestion(room), room.settings.timer * 1000 + 300);
  broadcast(room);
}

function maybeEndQuestion(room) {
  const online = connectedPlayers(room);
  if (online.length > 0 && online.every((p) => room.current.votes.has(p.id))) endQuestion(room);
}

function endQuestion(room) {
  if (room.phase !== "question") return;
  clearTimer(room);
  const q = room.current;

  const counts = new Map(q.options.map((o) => [o.id, 0]));
  for (const { targetId } of q.votes.values()) counts.set(targetId, (counts.get(targetId) || 0) + 1);
  const top = Math.max(0, ...counts.values());
  const winners = top > 0 ? [...counts].filter(([, c]) => c === top).map(([id]) => id) : [];

  // Correct voters ranked by speed: fastest earns most.
  const correct = [...q.votes]
    .filter(([, v]) => winners.includes(v.targetId))
    .sort((a, b) => a[1].at - b[1].at);
  const awards = correct.map(([voterId, v], rank) => {
    const player = room.players.get(voterId);
    const points = pointsForRank(rank);
    if (player) player.score += points;
    return {
      id: voterId,
      name: player?.name ?? "Someone",
      points,
      seconds: Math.round((v.at - q.startedAt) / 100) / 10
    };
  });

  const nameOf = (id) => q.options.find((o) => o.id === id)?.name ?? room.players.get(id)?.name ?? "?";
  room.reveal = {
    winners: winners.map((id) => ({ id, name: nameOf(id) })),
    tally: [...counts]
      .map(([id, votes]) => ({ id, name: nameOf(id), votes }))
      .sort((a, b) => b.votes - a.votes),
    totalVotes: q.votes.size,
    awards
  };
  room.phase = "reveal";
  room.timer = setTimeout(() => nextQuestion(room), REVEAL_MS);
  broadcast(room);
}

function finishRound(room) {
  clearTimer(room);
  room.current = null;
  room.phase = "final";
  room.final = {
    leaderboard: [...room.players.values()]
      .map((p) => ({ id: p.id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score)
  };
  broadcast(room);
}

// ---------- sockets ----------

io.on("connection", (socket) => {
  let room = null;
  let player = null;

  socket.on("join", (data, reply) => {
    if (typeof reply !== "function") return;
    if (room) return reply({ ok: false, error: "Already in a room." });

    const wantCode = String(data?.code ?? "").toUpperCase().replace(/[^A-Z]/g, "");
    const token = typeof data?.token === "string" ? data.token : null;

    if (data?.create) {
      room = {
        code: newRoomCode(),
        hostId: null,
        players: new Map(),
        phase: "lobby",
        settings: { timer: 20, theme: "" },
        questions: [],
        used: [],
        qIndex: -1,
        current: null,
        reveal: null,
        final: null,
        timer: null,
        emptySince: null
      };
      rooms.set(room.code, room);
    } else {
      room = rooms.get(wantCode) ?? null;
      if (!room) return reply({ ok: false, error: "Room not found. Check the code." });
    }

    // Reconnect with a saved token (e.g. after a page refresh).
    const existing = token && [...room.players.values()].find((p) => p.token === token);
    if (existing) {
      player = existing;
    } else {
      const name = cleanName(data?.name);
      if (!name) {
        room = null;
        return reply({ ok: false, error: "Please enter your name." });
      }
      const taken = [...room.players.values()].some((p) => p.name.toLowerCase() === name.toLowerCase());
      if (taken) {
        room = null;
        return reply({ ok: false, error: "That name is taken in this room. Add your surname or initial." });
      }
      if (room.players.size >= MAX_PLAYERS) {
        room = null;
        return reply({ ok: false, error: "This room is full." });
      }
      player = { id: randomUUID(), token: randomUUID(), name, score: 0 };
      room.players.set(player.id, player);
    }

    clearTimeout(player.dropTimer);
    player.connected = true;
    player.socketId = socket.id;
    room.emptySince = null;
    if (!room.hostId) room.hostId = player.id;
    ensureHost(room);

    reply({ ok: true, code: room.code, token: player.token });
    broadcast(room);
  });

  const isHost = () => room && player && room.hostId === player.id;

  socket.on("settings", (data) => {
    if (!isHost() || room.phase !== "lobby") return;
    const timer = Number(data?.timer);
    if (TIMER_CHOICES.includes(timer)) room.settings.timer = timer;
    if (typeof data?.theme === "string") room.settings.theme = data.theme.trim().slice(0, 80);
    broadcast(room);
  });

  socket.on("start", () => {
    if (!isHost() || !["lobby", "final"].includes(room.phase)) return;
    if (connectedPlayers(room).length < MIN_PLAYERS) return;
    startRound(room);
  });

  socket.on("toLobby", () => {
    if (!isHost() || room.phase !== "final") return;
    room.phase = "lobby";
    broadcast(room);
  });

  socket.on("vote", (data) => {
    if (!room || !player || room.phase !== "question") return;
    const q = room.current;
    if (q.votes.has(player.id)) return;
    if (!q.options.some((o) => o.id === data?.targetId)) return;
    q.votes.set(player.id, { targetId: data.targetId, at: Date.now() });
    broadcast(room);
    maybeEndQuestion(room);
  });

  socket.on("leave", () => {
    if (!room || !player) return;
    const r = room;
    const p = player;
    room = player = null;
    removePlayer(r, p.id);
  });

  socket.on("disconnect", () => {
    if (!room || !player || player.socketId !== socket.id) return;
    const r = room;
    const p = player;
    p.connected = false;
    p.socketId = null;

    const dropAfter = r.phase === "lobby" ? LOBBY_DROP_MS : GAME_DROP_MS;
    p.dropTimer = setTimeout(() => {
      if (!p.connected && r.players.has(p.id)) removePlayer(r, p.id);
    }, dropAfter);

    if (r.hostId === p.id) {
      setTimeout(() => {
        if (!p.connected) {
          ensureHost(r);
          broadcast(r);
        }
      }, HOST_GRACE_MS);
    }
    if (connectedPlayers(r).length === 0) r.emptySince = Date.now();
    if (r.phase === "question") maybeEndQuestion(r);
    broadcast(r);
  });
});

// Sweep rooms nobody has been connected to for a while.
setInterval(() => {
  for (const r of rooms.values()) {
    if (r.emptySince && Date.now() - r.emptySince > EMPTY_ROOM_MS) {
      clearTimer(r);
      for (const p of r.players.values()) clearTimeout(p.dropTimer);
      rooms.delete(r.code);
    }
  }
}, 60_000);

httpServer.listen(PORT, () => {
  console.log(`Game running on http://localhost:${PORT} (AI questions: ${aiProvider ?? "off, using built-in list"})`);
});
