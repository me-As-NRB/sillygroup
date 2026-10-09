// Game statistics. Saved to Upstash Redis when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set (free plan is plenty); otherwise kept in
// memory, which resets whenever the server restarts or sleeps.
const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const statsPersistent = Boolean(URL_ && TOKEN);

const memory = { counters: new Map(), hashes: new Map() };
let queue = [];
let flushTimer = null;

export const COUNTERS = {
  rooms_created: "Rooms created",
  players_joined: "Players joined",
  rounds_started: "Rounds started",
  rounds_finished: "Rounds finished",
  players_in_finished_rounds: "Players in finished rounds",
  rooms_replayed: "Rooms that played a 2nd round",
  creators_who_joined_before: "Room creators who first joined someone else's room",
  rounds_ai: "Rounds with AI questions",
  rounds_backup: "Rounds with built-in questions"
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function redis(commands) {
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  return (await res.json()).map((r) => r.result);
}

// Writes are batched and sent every few seconds so gameplay never waits on them.
function flush() {
  flushTimer = null;
  const batch = queue;
  queue = [];
  if (batch.length) redis(batch).catch((err) => console.error("Stats save failed:", err.message));
}

function hincr(hash, field, by = 1) {
  if (statsPersistent) {
    queue.push(["HINCRBY", hash, field, by]);
    flushTimer ??= setTimeout(flush, 3000);
  } else {
    const h = memory.hashes.get(hash) ?? new Map();
    h.set(field, (h.get(field) ?? 0) + by);
    memory.hashes.set(hash, h);
  }
}

// Bumps an all-time total and today's count.
export function track(name, by = 1) {
  if (!(name in COUNTERS)) return;
  hincr("stats:total", name, by);
  hincr(`stats:day:${today()}`, name, by);
}

export function trackGenres(genreIds) {
  for (const g of genreIds.length ? genreIds : ["none"]) hincr("stats:genres", g);
}

export function trackTone(tone) {
  hincr("stats:tones", tone);
}

function toObj(raw) {
  // Upstash returns HGETALL as a flat [field, value, ...] list.
  if (Array.isArray(raw)) {
    const o = {};
    for (let i = 0; i < raw.length; i += 2) o[raw[i]] = Number(raw[i + 1]);
    return o;
  }
  return Object.fromEntries([...(raw ?? new Map())].map(([k, v]) => [k, Number(v)]));
}

export async function readStats(days = 14) {
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10)
  );
  const keys = ["stats:total", "stats:genres", "stats:tones", ...dates.map((d) => `stats:day:${d}`)];
  let rows;
  if (statsPersistent) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flush();
    }
    rows = (await redis(keys.map((k) => ["HGETALL", k]))).map(toObj);
  } else {
    rows = keys.map((k) => toObj(memory.hashes.get(k)));
  }
  const [total, genres, tones, ...daily] = rows;
  return { total, genres, tones, daily: dates.map((date, i) => ({ date, ...daily[i] })) };
}
