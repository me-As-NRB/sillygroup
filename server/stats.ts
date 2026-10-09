// Game statistics. Saved to Upstash Redis when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN are set (free plan is plenty); otherwise kept in
// memory, which resets whenever the server restarts or sleeps.

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
} as const;

export type CounterName = keyof typeof COUNTERS;
type Counts = Record<string, number>;

export interface StatsSnapshot {
  total: Counts;
  genres: Counts;
  tones: Counts;
  daily: { date: string; counts: Counts }[];
}

/** What the game needs from stats; lets tests pass a no-op or a spy. */
export interface Tracker {
  track(name: CounterName, by?: number): void;
  trackGenres(genreIds: readonly string[]): void;
  trackTone(tone: string): void;
}

export interface StatsStore extends Tracker {
  readonly persistent: boolean;
  read(days?: number): Promise<StatsSnapshot>;
}

type Command = (string | number)[];

const today = () => new Date().toISOString().slice(0, 10);

function toCounts(raw: unknown): Counts {
  // Upstash returns HGETALL as a flat [field, value, ...] list.
  if (Array.isArray(raw)) {
    const out: Counts = {};
    for (let i = 0; i < raw.length; i += 2) out[String(raw[i])] = Number(raw[i + 1]);
    return out;
  }
  return raw instanceof Map ? Object.fromEntries(raw) : {};
}

export function createStats(options: { url?: string; token?: string; flushMs?: number } = {}): StatsStore {
  const { url, token, flushMs = 3000 } = options;
  const persistent = Boolean(url && token);
  const memory = new Map<string, Map<string, number>>();
  let queue: Command[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  async function redis(commands: Command[]): Promise<unknown[]> {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    return ((await res.json()) as { result: unknown }[]).map((r) => r.result);
  }

  // Writes are batched so gameplay never waits on the network.
  async function flush(): Promise<void> {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
    const batch = queue;
    queue = [];
    if (!batch.length) return;
    try {
      await redis(batch);
    } catch (err) {
      console.error("Stats save failed:", err instanceof Error ? err.message : err);
    }
  }

  function hincr(hash: string, field: string, by = 1): void {
    if (persistent) {
      queue.push(["HINCRBY", hash, field, by]);
      flushTimer ??= setTimeout(() => void flush(), flushMs);
      flushTimer.unref?.();
      return;
    }
    const h = memory.get(hash) ?? new Map<string, number>();
    h.set(field, (h.get(field) ?? 0) + by);
    memory.set(hash, h);
  }

  return {
    persistent,
    track(name, by = 1) {
      if (!(name in COUNTERS)) return;
      hincr("stats:total", name, by);
      hincr(`stats:day:${today()}`, name, by);
    },
    trackGenres(genreIds) {
      for (const g of genreIds.length ? genreIds : ["none"]) hincr("stats:genres", g);
    },
    trackTone(tone) {
      hincr("stats:tones", tone);
    },
    async read(days = 14) {
      const dates = Array.from({ length: days }, (_, i) =>
        new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10)
      );
      const keys = ["stats:total", "stats:genres", "stats:tones", ...dates.map((d) => `stats:day:${d}`)];
      let rows: Counts[];
      if (persistent) {
        await flush(); // include anything still waiting to be written
        rows = (await redis(keys.map((k) => ["HGETALL", k]))).map(toCounts);
      } else {
        rows = keys.map((k) => toCounts(memory.get(k)));
      }
      const [total, genres, tones, ...daily] = rows;
      return { total, genres, tones, daily: dates.map((date, i) => ({ date, counts: daily[i] })) };
    }
  };
}

export const noopTracker: Tracker = { track() {}, trackGenres() {}, trackTone() {} };
