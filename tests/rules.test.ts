import { describe, expect, it } from "vitest";
import { cleanName, pickHighlights, pointsForRank, tallyVotes, type VoteRecord } from "../shared/rules";

const players = [
  { id: "a", name: "Aarav" },
  { id: "b", name: "Bhavna" },
  { id: "c", name: "Chirag" },
  { id: "d", name: "Divya" }
];
const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
const votes = (entries: [voter: string, target: string, at: number][]) =>
  new Map<string, VoteRecord>(entries.map(([v, t, at]) => [v, { targetId: t, at }]));

describe("pointsForRank", () => {
  it("gives 1000 to the fastest and 150 less to each next player", () => {
    expect([0, 1, 2, 3].map(pointsForRank)).toEqual([1000, 850, 700, 550]);
  });

  it("never goes below 100", () => {
    expect(pointsForRank(6)).toBe(100);
    expect(pointsForRank(50)).toBe(100);
  });
});

describe("cleanName", () => {
  it("trims, collapses spaces and caps the length", () => {
    expect(cleanName("  Priya    Sharma  ")).toBe("Priya Sharma");
    expect(cleanName("x".repeat(40))).toHaveLength(20);
  });

  it("handles junk input", () => {
    expect(cleanName(undefined)).toBe("");
    expect(cleanName(42)).toBe("42");
  });
});

describe("tallyVotes", () => {
  it("picks the most-voted player and ranks correct voters by speed", () => {
    const t = tallyVotes(players, votes([["c", "b", 300], ["a", "b", 100], ["b", "c", 200], ["d", "b", 500]]), nameOf);
    expect(t.winners).toEqual(["b"]);
    expect(t.topVotes).toBe(3);
    expect(t.correctVoters.map((v) => v.voterId)).toEqual(["a", "c", "d"]);
    expect(t.entries[0]).toMatchObject({ id: "b", votes: 3 });
    expect(t.entries[0].voters.map((v) => v.name)).toEqual(["Aarav", "Chirag", "Divya"]);
  });

  it("treats every player tied on the top count as a winner", () => {
    const t = tallyVotes(players, votes([["a", "b", 1], ["b", "c", 2], ["c", "b", 3], ["d", "c", 4]]), nameOf);
    expect(t.winners.sort()).toEqual(["b", "c"]);
    expect(t.correctVoters).toHaveLength(4);
  });

  it("has no winner when nobody voted", () => {
    const t = tallyVotes(players, new Map(), nameOf);
    expect(t.winners).toEqual([]);
    expect(t.topVotes).toBe(0);
    expect(t.entries.every((e) => e.votes === 0)).toBe(true);
  });
});

describe("pickHighlights", () => {
  it("prefers unanimous single-winner verdicts and skips ties and tiny votes", () => {
    const h = pickHighlights([
      { text: "tie", winners: ["A", "B"], topVotes: 2, totalVotes: 4 },
      { text: "split", winners: ["A"], topVotes: 2, totalVotes: 4 },
      { text: "unanimous", winners: ["B"], topVotes: 4, totalVotes: 4 },
      { text: "lonely", winners: ["C"], topVotes: 1, totalVotes: 1 },
      { text: "strong", winners: ["C"], topVotes: 3, totalVotes: 4 }
    ]);
    expect(h.map((x) => x.text)).toEqual(["unanimous", "strong"]);
  });
});
