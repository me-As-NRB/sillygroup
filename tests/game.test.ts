import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUESTIONS_PER_ROUND } from "../shared/rules";
import { DEFAULT_TIMINGS, Room, RoomManager, type GameDeps } from "../server/game";
import type { Tracker } from "../server/stats";

function makeDeps(overrides: Partial<GameDeps> = {}): GameDeps & { tracker: Tracker & { calls: string[] } } {
  const calls: string[] = [];
  const tracker = {
    calls,
    track: (name: string, by = 1) => calls.push(by === 1 ? name : `${name}:${by}`),
    trackGenres: (g: readonly string[]) => calls.push(`genres:${g.join(",")}`),
    trackTone: (t: string) => calls.push(`tone:${t}`)
  };
  return {
    generateQuestions: async () => [],
    aiEnabled: false,
    timings: DEFAULT_TIMINGS,
    now: () => Date.now(),
    ...overrides,
    tracker
  };
}

/** A room with `n` connected players; the first one is the host. */
function setup(n = 3, deps = makeDeps()) {
  const onChange = vi.fn();
  const onEmpty = vi.fn();
  const room = new Room("TEST", deps, onChange, onEmpty);
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const res = room.addPlayer(`Player ${i + 1}`);
    if (!res.ok) throw new Error(res.error);
    room.connect(res.player.id);
    ids.push(res.player.id);
  }
  return { room, ids, deps, onChange, onEmpty };
}

/** Lets the async AI call resolve so the first question appears. */
async function startAndWait(room: Room, hostId: string) {
  expect(room.start(hostId)).toBe(true);
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("joining", () => {
  it("makes the first player host and rejects duplicate names case-insensitively", () => {
    const { room, ids } = setup(1);
    expect(room.hostId).toBe(ids[0]);
    expect(room.addPlayer("player 1")).toMatchObject({ ok: false });
    expect(room.addPlayer("   ")).toMatchObject({ ok: false, error: "Please enter your name." });
  });

  it("refuses the 21st player", () => {
    const { room } = setup(20);
    expect(room.addPlayer("One Too Many")).toMatchObject({ ok: false, error: "This room is full." });
  });

  it("finds a returning player by their token", () => {
    const { room, ids } = setup(1);
    const player = room.players.get(ids[0])!;
    expect(room.findByToken(player.token)?.id).toBe(ids[0]);
    expect(room.findByToken("nope")).toBeUndefined();
  });
});

describe("host settings", () => {
  it("only lets the host change settings, and validates them", () => {
    const { room, ids } = setup(3);
    room.updateSettings(ids[1], { tone: "savage" });
    expect(room.settings.tone).toBe("blunt");

    room.updateSettings(ids[0], {
      tone: "savage",
      timer: 30,
      genres: ["trek", "bogus", "party", "office", "movies"],
      context: `  ${"x".repeat(400)}  `
    });
    expect(room.settings).toMatchObject({ tone: "savage", timer: 30, genres: ["trek", "party", "office"] });
    expect(room.settings.context).toHaveLength(300);

    room.updateSettings(ids[0], { timer: 99, tone: "evil" as never });
    expect(room.settings).toMatchObject({ timer: 30, tone: "savage" });
  });

  it("needs at least three connected players and the host to start", () => {
    const two = setup(2);
    expect(two.room.start(two.ids[0])).toBe(false);
    const three = setup(3);
    expect(three.room.start(three.ids[1])).toBe(false);
    expect(three.room.start(three.ids[0])).toBe(true);
  });
});

describe("a full round", () => {
  it("scores the majority pick by speed and finishes after 10 questions", async () => {
    const { room, ids, deps } = setup(3);
    const [a, b, c] = ids;
    await startAndWait(room, a);
    const seen = new Set<string>();

    for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
      const q = room.stateFor(a).question!;
      expect(room.phase).toBe("question");
      expect(q.options).toHaveLength(3);
      seen.add(q.text);

      room.vote(a, b);
      room.vote(a, c); // second vote is ignored
      vi.advanceTimersByTime(1500);
      room.vote(c, b);
      vi.advanceTimersByTime(1000);
      room.vote(b, c); // everyone has voted: ends early

      const reveal = room.stateFor(a).reveal!;
      expect(room.phase).toBe("reveal");
      expect(reveal.winners.map((w) => w.id)).toEqual([b]);
      expect(reveal.awards.map((x) => [x.id, x.points, x.seconds])).toEqual([
        [a, 1000, 0],
        [c, 850, 1.5]
      ]);
      expect(reveal.tally[0].voters.map((v) => v.id)).toEqual([a, c]);
      vi.advanceTimersByTime(DEFAULT_TIMINGS.revealMs);
    }

    expect(seen.size).toBe(QUESTIONS_PER_ROUND);
    expect(room.phase).toBe("final");
    const final = room.stateFor(a).final!;
    expect(final.leaderboard.map((p) => p.score)).toEqual([10_000, 8_500, 0]);
    expect(final.highlights).toHaveLength(2);
    expect(final.highlights[0]).toMatchObject({ winners: ["Player 2"], topVotes: 2, totalVotes: 3 });
    expect(deps.tracker.calls).toEqual(
      expect.arrayContaining(["rounds_started", "rounds_backup", "rounds_finished", "players_in_finished_rounds:3"])
    );
  });

  it("ends a question when the timer runs out and shows who didn't vote", async () => {
    const { room, ids } = setup(3);
    await startAndWait(room, ids[0]);
    room.vote(ids[0], ids[1]);
    vi.advanceTimersByTime(20_000 + 300);
    const reveal = room.stateFor(ids[0]).reveal!;
    expect(reveal.noVote.map((p) => p.id).sort()).toEqual([ids[1], ids[2]].sort());
    expect(reveal.awards).toHaveLength(1);
  });

  it("never repeats a question in the next round and resets scores", async () => {
    const { room, ids } = setup(3);
    const first: string[] = [];
    await startAndWait(room, ids[0]);
    for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
      first.push(room.stateFor(ids[0]).question!.text);
      for (const id of ids) room.vote(id, ids[0]);
      vi.advanceTimersByTime(DEFAULT_TIMINGS.revealMs);
    }
    expect(room.phase).toBe("final");

    await startAndWait(room, ids[0]);
    expect(first).not.toContain(room.stateFor(ids[0]).question!.text);
    expect([...room.players.values()].every((p) => p.score === 0)).toBe(true);
  });

  it("uses AI questions and tops up from the bank when the AI returns too few", async () => {
    const generateQuestions = vi.fn(async () => ["Who would win a staring contest?", "Who hums all day?"]);
    const { room, ids } = setup(3, makeDeps({ generateQuestions }));
    room.updateSettings(ids[0], { genres: ["trek"], tone: "friendly", context: "Manali" });
    await startAndWait(room, ids[0]);

    expect(generateQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ count: 10, genres: ["Trek & Hiking"], tone: "friendly", context: "Manali", playerCount: 3 })
    );
    expect(room.stateFor(ids[0]).question!.text).toBe("Who would win a staring contest?");
    expect(room.stateFor(ids[0]).question!.total).toBe(10);
  });
});

describe("connections", () => {
  it("ends the question early when the last non-voter disconnects", async () => {
    const { room, ids } = setup(3);
    await startAndWait(room, ids[0]);
    room.vote(ids[0], ids[1]);
    room.vote(ids[1], ids[0]);
    room.disconnect(ids[2]);
    expect(room.phase).toBe("reveal");
  });

  it("hands the host role over after the grace period, not before", () => {
    const { room, ids } = setup(3);
    room.disconnect(ids[0]);
    vi.advanceTimersByTime(DEFAULT_TIMINGS.hostGraceMs - 1);
    expect(room.hostId).toBe(ids[0]);
    vi.advanceTimersByTime(1);
    expect(room.hostId).toBe(ids[1]);
  });

  it("keeps the host when they reconnect within the grace period", () => {
    const { room, ids } = setup(3);
    room.disconnect(ids[0]);
    vi.advanceTimersByTime(3000);
    room.connect(ids[0]);
    vi.advanceTimersByTime(DEFAULT_TIMINGS.hostGraceMs);
    expect(room.hostId).toBe(ids[0]);
  });

  it("drops disconnected lobby players after the timeout and reports an empty room", () => {
    const { room, ids, onEmpty } = setup(1);
    room.disconnect(ids[0]);
    vi.advanceTimersByTime(DEFAULT_TIMINGS.lobbyDropMs);
    expect(room.players.size).toBe(0);
    expect(onEmpty).toHaveBeenCalledWith(room);
  });
});

describe("RoomManager", () => {
  it("creates unique 4-letter codes without I or O and finds rooms case-insensitively", () => {
    const manager = new RoomManager(makeDeps(), () => {});
    const codes = new Set(Array.from({ length: 200 }, () => manager.create().code));
    expect(codes.size).toBe(200);
    for (const code of codes) expect(code).toMatch(/^[A-HJ-NP-Z]{4}$/);
    const [one] = codes;
    expect(manager.get(one.toLowerCase())?.code).toBe(one);
    manager.disposeAll();
  });

  it("sweeps rooms that have been empty for too long", () => {
    let now = 0;
    const manager = new RoomManager(makeDeps({ now: () => now }), () => {});
    const room = manager.create();
    const res = room.addPlayer("Solo");
    if (!res.ok) throw new Error(res.error);
    room.connect(res.player.id);
    room.disconnect(res.player.id);
    now = DEFAULT_TIMINGS.emptyRoomMs + 1;
    manager.sweep();
    expect(manager.size).toBe(0);
  });
});
