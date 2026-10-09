import type { Highlight, PlayerRef, TallyEntry } from "./types";

export const QUESTIONS_PER_ROUND = 12;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 20;
export const MAX_NAME_LENGTH = 20;
export const MAX_CONTEXT_LENGTH = 300;
export const TIMER_CHOICES = [15, 20, 30] as const;

/** Points for the n-th fastest correct guess (0-based): 1000, 850, 700 … floor of 100. */
export function pointsForRank(rank: number): number {
  return Math.max(100, 1000 - rank * 150);
}

export function cleanName(raw: unknown): string {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export interface VoteRecord {
  targetId: string;
  at: number;
}

export interface Tally {
  winners: string[];
  topVotes: number;
  entries: TallyEntry[];
  /** Voter ids whose pick matched a winner, fastest first. */
  correctVoters: { voterId: string; at: number }[];
}

/**
 * Counts votes for one question. Every player tied on the most votes is a
 * winner. Nobody wins when nobody voted, or when every vote went to a
 * different person: with two players that means "you didn't agree", so the
 * faster clicker can't score just by voting.
 */
export function tallyVotes(options: PlayerRef[], votes: Map<string, VoteRecord>, nameOf: (id: string) => string): Tally {
  const counts = new Map(options.map((o) => [o.id, 0]));
  for (const { targetId } of votes.values()) counts.set(targetId, (counts.get(targetId) ?? 0) + 1);

  const topVotes = Math.max(0, ...counts.values());
  const noAgreement = topVotes === 1 && votes.size > 1;
  const winners = topVotes > 0 && !noAgreement ? [...counts].filter(([, c]) => c === topVotes).map(([id]) => id) : [];
  const byTime = [...votes].sort((a, b) => a[1].at - b[1].at);

  const entries = [...counts]
    .map(([id, n]) => ({
      id,
      name: nameOf(id),
      votes: n,
      voters: byTime.filter(([, v]) => v.targetId === id).map(([voterId]) => ({ id: voterId, name: nameOf(voterId) }))
    }))
    .sort((a, b) => b.votes - a.votes);

  const correctVoters = byTime
    .filter(([, v]) => winners.includes(v.targetId))
    .map(([voterId, v]) => ({ voterId, at: v.at }));

  return { winners, topVotes, entries, correctVoters };
}

/** The most one-sided single-winner verdicts of a round, for the share card. */
export function pickHighlights(history: Highlight[], count = 2): Highlight[] {
  return history
    .filter((h) => h.winners.length === 1 && h.totalVotes >= 2)
    .sort((a, b) => b.topVotes / b.totalVotes - a.topVotes / a.totalVotes || b.topVotes - a.topVotes)
    .slice(0, count);
}
