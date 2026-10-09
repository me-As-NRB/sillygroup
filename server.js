import express from "express";
import { createServer } from "node:http";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { Server } from "socket.io";
import { generateQuestions, aiEnabled, aiProvider } from "./ai.js";
import { pickFromBank } from "./questions.js";
import { GENRES, TONES, MAX_GENRES } from "./public/genres.js";
import { track, trackGenres, trackTone, readStats, statsPersistent, COUNTERS } from "./stats.js";

const PORT = process.env.PORT || 3000;
const QUESTIONS_PER_ROUND = 10;
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const REVEAL_MS = 10000;
const GENRE_IDS = new Set(GENRES.map((g) => g.id));
const TONE_IDS = new Set(TONES.map((t) => t.id));
const TIMER_CHOICES = [15, 20, 30];
const HOST_GRACE_MS = 10_000; // time a refreshing host keeps the crown
const LOBBY_DROP_MS = 30_000; // disconnected players leave the lobby after this
const GAME_DROP_MS = 5 * 60_000; // ...and leave a running game after this
const EMPTY_ROOM_MS = 10 * 60_000;

const STATS_KEY = process.env.STATS_KEY || "";
const GOATCOUNTER_CODE = (process.env.GOATCOUNTER_CODE || "").replace(/[^a-z0-9-]/gi, "");

const app = express();
app.set("trust proxy", true); // Render sits behind a proxy; needed for correct https URLs

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// index.html gets link-preview tags (WhatsApp, Instagram, etc.) and optional
// GoatCounter visitor counting filled in per request.
const INDEX_HTML = readFileSync(new URL("./public/index.html", import.meta.url), "utf8");
function renderIndex(req, res) {
  const origin = `${req.protocol}://${req.get("host")}`;
  const code = String(req.query.room ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  const title = code ? `Join my game! Room ${code} · Who In The Room` : "Who In The Room — the party game about your group";
  const desc = code
    ? "Tap to join with just your name. Cheeky questions about the group: vote who fits, fastest right guess wins!"
    : "Cheeky AI questions about your group. Vote who fits, guess the majority, fastest right answer wins. Free, no app needed.";
  const url = code ? `${origin}/?room=${code}` : `${origin}/`;
  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Who In The Room">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(origin)}/og.jpg">`,
    `<meta property="og:image:type" content="image/jpeg">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    GOATCOUNTER_CODE
      ? `<script data-goatcounter="https://${GOATCOUNTER_CODE}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
      : ""
  ].join("\n  ");
  res.type("html").send(INDEX_HTML.replace("<!--HEAD-->", tags));
}
app.get(["/", "/index.html"], renderIndex);
app.use(express.static("public", { index: false }));
app.get("/health", (_req, res) => res.send("ok"));

function keyMatches(given) {
  const a = Buffer.from(String(given ?? ""));
  const b = Buffer.from(STATS_KEY);
  return STATS_KEY.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

// Private stats page: /stats?key=<STATS_KEY>
app.get("/stats", async (req, res) => {
  if (!keyMatches(req.query.key)) return res.status(404).send("Not found");
  try {
    res.type("html").send(renderStatsPage(await readStats(14)));
  } catch (err) {
    res.status(500).send(`Could not load stats: ${escapeHtml(err.message)}`);
  }
});

function renderStatsPage({ total, genres, tones, daily }) {
  const n = (k) => total[k] ?? 0;
  const avgPlayers = n("rounds_finished") ? (n("players_in_finished_rounds") / n("rounds_finished")).toFixed(1) : "–";
  const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : "–");
  const maxDay = Math.max(1, ...daily.map((d) => d.players_joined ?? 0));
  const genreRows = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([id, c]) => { const g = GENRES.find((x) => x.id === id); return `<tr><td>${g ? `${g.emoji} ${escapeHtml(g.label)}` : "🎲 None picked"}</td><td>${c}</td></tr>`; })
    .join("");
  const toneRows = Object.entries(tones).map(([id, c]) => `<tr><td>${escapeHtml(TONES.find((t) => t.id === id)?.label ?? id)}</td><td>${c}</td></tr>`).join("");
  const tiles = [
    ["Players joined", n("players_joined")],
    ["Rooms created", n("rooms_created")],
    ["Rounds finished", n("rounds_finished")],
    ["Avg players / round", avgPlayers],
    ["Rooms that played again", `${pct(n("rooms_replayed"), n("rooms_created"))}`],
    ["Rounds started that finished", `${pct(n("rounds_finished"), n("rounds_started"))}`]
  ].map(([l, v]) => `<div class="tile"><b>${v}</b><span>${l}</span></div>`).join("");
  const bars = daily.map((d) => {
    const v = d.players_joined ?? 0;
    return `<div class="day" title="${d.date}: ${v} players, ${d.rounds_finished ?? 0} rounds"><i style="height:${(v / maxDay) * 100}%"></i><small>${d.date.slice(8)}</small><em>${v || ""}</em></div>`;
  }).join("");
  const allRows = Object.entries(COUNTERS).map(([k, l]) => `<tr><td>${l}</td><td>${n(k)}</td></tr>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Game Stats</title><meta name="robots" content="noindex"><style>
:root{--bg:#f6f4ff;--card:#fff;--text:#1f1537;--muted:#6e6489;--line:#e6e0fa;--brand:#6d4aff}
@media (prefers-color-scheme:dark){:root{--bg:#0f0b1f;--card:#1e1838;--text:#f5f2ff;--muted:#a9a2c8;--line:#322a57;--brand:#8d70ff}}
body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:20px 16px;display:grid;gap:16px}
h1{margin:0;font-size:1.6rem}.muted{color:var(--muted)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.tile,.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.tile b{display:block;font-size:1.8rem;color:var(--brand)}.tile span{color:var(--muted);font-size:.85rem}
.chart{display:flex;align-items:flex-end;gap:6px;height:160px;padding-top:18px}
.day{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;position:relative}
.day i{width:100%;background:var(--brand);border-radius:6px 6px 2px 2px;min-height:2px}
.day small{color:var(--muted);font-size:.7rem;margin-top:4px}.day em{position:absolute;top:0;font-style:normal;font-size:.7rem}
table{width:100%;border-collapse:collapse}td{padding:7px 4px;border-bottom:1px solid var(--line)}td:last-child{text-align:right;font-weight:600}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}h2{margin:0 0 8px;font-size:1.05rem}
</style></head><body><main>
<div><h1>👀 Who In The Room — stats</h1><p class="muted">${statsPersistent ? "Saved permanently (Upstash)." : "⚠️ Not saved: numbers reset whenever the server restarts. Add Upstash keys to keep them."}</p></div>
<div class="tiles">${tiles}</div>
<div class="card"><h2>Players joined per day (last 14 days)</h2><div class="chart">${bars}</div></div>
<div class="cols"><div class="card"><h2>Most picked themes</h2><table>${genreRows || "<tr><td class=muted>No rounds yet</td></tr>"}</table></div>
<div class="card"><h2>Tone</h2><table>${toneRows || "<tr><td class=muted>No rounds yet</td></tr>"}</table><h2 style="margin-top:16px">All totals</h2><table>${allRows}</table></div></div>
</main></body></html>`;
}

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
  room.history = [];
  for (const p of room.players.values()) p.score = 0;
  broadcast(room);

  room.rounds += 1;
  track("rounds_started");
  if (room.rounds === 2) track("rooms_replayed");
  trackGenres(room.settings.genres);
  trackTone(room.settings.tone);

  const roundId = (room.roundId = randomUUID());
  const { genres, context, tone } = room.settings;
  let questions = await generateQuestions({
    count: QUESTIONS_PER_ROUND,
    genres: genres.map((id) => GENRES.find((g) => g.id === id).label),
    context,
    tone,
    playerCount: room.players.size,
    avoid: room.used
  });
  // Room may have changed (or emptied) while waiting on the AI.
  if (room.roundId !== roundId || !rooms.has(room.code)) return;

  track(questions.length >= QUESTIONS_PER_ROUND / 2 ? "rounds_ai" : "rounds_backup");
  if (questions.length < QUESTIONS_PER_ROUND) {
    const topUp = pickFromBank(QUESTIONS_PER_ROUND - questions.length, [...room.used, ...questions], genres);
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
  const votersFor = (id) =>
    [...q.votes]
      .filter(([, v]) => v.targetId === id)
      .sort((a, b) => a[1].at - b[1].at)
      .map(([voterId]) => ({ id: voterId, name: nameOf(voterId) }));
  room.reveal = {
    winners: winners.map((id) => ({ id, name: nameOf(id) })),
    tally: [...counts]
      .map(([id, votes]) => ({ id, name: nameOf(id), votes, voters: votersFor(id) }))
      .sort((a, b) => b.votes - a.votes),
    noVote: connectedPlayers(room)
      .filter((p) => !q.votes.has(p.id))
      .map((p) => ({ id: p.id, name: p.name })),
    totalVotes: q.votes.size,
    awards
  };
  room.history.push({
    text: q.text,
    winners: room.reveal.winners.map((w) => w.name),
    topVotes: top,
    totalVotes: q.votes.size
  });
  room.phase = "reveal";
  room.timer = setTimeout(() => nextQuestion(room), REVEAL_MS);
  broadcast(room);
}

function finishRound(room) {
  clearTimer(room);
  room.current = null;
  room.phase = "final";
  // The most one-sided verdicts make the best moments for the share card.
  const highlights = room.history
    .filter((h) => h.winners.length === 1 && h.totalVotes >= 2)
    .sort((a, b) => b.topVotes / b.totalVotes - a.topVotes / a.totalVotes || b.topVotes - a.topVotes)
    .slice(0, 2);
  room.final = {
    leaderboard: [...room.players.values()]
      .map((p) => ({ id: p.id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score),
    highlights,
    genres: room.settings.genres
  };
  track("rounds_finished");
  track("players_in_finished_rounds", room.players.size);
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
        settings: { timer: 20, genres: [], context: "", tone: "blunt" },
        questions: [],
        used: [],
        qIndex: -1,
        current: null,
        reveal: null,
        final: null,
        timer: null,
        emptySince: null,
        history: [],
        rounds: 0
      };
      rooms.set(room.code, room);
      track("rooms_created");
      if (data.joinedBefore === true) track("creators_who_joined_before");
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
      track("players_joined");
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
    if (Array.isArray(data?.genres)) {
      room.settings.genres = [...new Set(data.genres)].filter((g) => GENRE_IDS.has(g)).slice(0, MAX_GENRES);
    }
    if (typeof data?.context === "string") room.settings.context = data.context.trim().slice(0, 300);
    if (TONE_IDS.has(data?.tone)) room.settings.tone = data.tone;
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
