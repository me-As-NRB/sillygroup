import { randomBytes, randomUUID } from "node:crypto";
import { MAX_GENRES, genreById, isToneId } from "../shared/genres";
import {
  MAX_CONTEXT_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  QUESTIONS_PER_ROUND,
  TIMER_CHOICES,
  cleanName,
  pickHighlights,
  pointsForRank,
  tallyVotes,
  type VoteRecord
} from "../shared/rules";
import type {
  FinalView,
  GameState,
  Highlight,
  Phase,
  PlayerRef,
  RevealView,
  Settings
} from "../shared/types";
import type { GenerateOptions } from "./ai";
import { pickFromBank } from "./questions";
import type { Tracker } from "./stats";

export interface Timings {
  /** How long the vote breakdown stays on screen. */
  revealMs: number;
  /** A refreshing host keeps the crown for this long. */
  hostGraceMs: number;
  /** Disconnected players leave the lobby after this… */
  lobbyDropMs: number;
  /** …and leave a running game after this. */
  gameDropMs: number;
  /** Rooms with nobody connected are deleted after this. */
  emptyRoomMs: number;
}

export const DEFAULT_TIMINGS: Timings = {
  revealMs: 10_000,
  hostGraceMs: 10_000,
  lobbyDropMs: 30_000,
  gameDropMs: 5 * 60_000,
  emptyRoomMs: 10 * 60_000
};

export interface GameDeps {
  generateQuestions: (opts: GenerateOptions) => Promise<string[]>;
  aiEnabled: boolean;
  tracker: Tracker;
  timings: Timings;
  now: () => number;
}

interface Player {
  id: string;
  token: string;
  name: string;
  score: number;
  connected: boolean;
  dropTimer?: ReturnType<typeof setTimeout>;
}

interface CurrentQuestion {
  text: string;
  options: PlayerRef[];
  votes: Map<string, VoteRecord>;
  startedAt: number;
  endsAt: number;
}

export type AddPlayerResult = { ok: true; player: Player } | { ok: false; error: string };

/**
 * One game room. Holds all state and rules; knows nothing about sockets.
 * Calls `onChange` whenever every client should get a fresh snapshot, and
 * `onEmpty` when the last player has left.
 */
export class Room {
  readonly players = new Map<string, Player>();
  hostId: string | null = null;
  phase: Phase = "lobby";
  settings: Settings = { timer: 20, genres: [], context: "", tone: "blunt" };
  emptySince: number | null = null;

  private questions: string[] = [];
  private used: string[] = [];
  private qIndex = -1;
  private current: CurrentQuestion | null = null;
  private reveal: RevealView | null = null;
  private final: FinalView | null = null;
  private history: Highlight[] = [];
  private rounds = 0;
  private roundSeq = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    readonly code: string,
    private readonly deps: GameDeps,
    private readonly onChange: (room: Room) => void,
    private readonly onEmpty: (room: Room) => void
  ) {}

  // ---------- players ----------

  connectedPlayers(): Player[] {
    return [...this.players.values()].filter((p) => p.connected);
  }

  findByToken(token: string | undefined): Player | undefined {
    if (!token) return undefined;
    return [...this.players.values()].find((p) => p.token === token);
  }

  addPlayer(rawName: unknown): AddPlayerResult {
    const name = cleanName(rawName);
    if (!name) return { ok: false, error: "Please enter your name." };
    const taken = [...this.players.values()].some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (taken) return { ok: false, error: "That name is taken in this room. Add your surname or initial." };
    if (this.players.size >= MAX_PLAYERS) return { ok: false, error: "This room is full." };

    const player: Player = { id: randomUUID(), token: randomUUID(), name, score: 0, connected: false };
    this.players.set(player.id, player);
    this.deps.tracker.track("players_joined");
    return { ok: true, player };
  }

  /** Marks a player online (first join or reconnect) and fixes up the host. */
  connect(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    clearTimeout(player.dropTimer);
    player.connected = true;
    this.emptySince = null;
    this.hostId ??= player.id;
    this.ensureHost();
    this.onChange(this);
  }

  disconnect(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    player.connected = false;

    const { lobbyDropMs, gameDropMs, hostGraceMs } = this.deps.timings;
    player.dropTimer = setTimeout(
      () => {
        if (!player.connected && this.players.has(player.id)) this.removePlayer(player.id);
      },
      this.phase === "lobby" ? lobbyDropMs : gameDropMs
    );
    if (this.hostId === player.id) {
      setTimeout(() => {
        if (!player.connected) {
          this.ensureHost();
          this.onChange(this);
        }
      }, hostGraceMs);
    }
    if (this.connectedPlayers().length === 0) this.emptySince = this.deps.now();
    if (this.phase === "question") this.maybeEndQuestion();
    this.onChange(this);
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;
    clearTimeout(player.dropTimer);
    this.players.delete(playerId);
    this.current?.votes.delete(playerId);
    if (this.hostId === playerId) {
      this.hostId = null;
      this.ensureHost();
    }
    if (this.players.size === 0) {
      this.dispose();
      this.onEmpty(this);
      return;
    }
    if (this.phase === "question") this.maybeEndQuestion();
    this.onChange(this);
  }

  private ensureHost(): void {
    if (this.hostId && this.players.get(this.hostId)?.connected) return;
    const next = this.connectedPlayers()[0];
    if (next) this.hostId = next.id;
  }

  // ---------- host actions ----------

  updateSettings(byPlayerId: string, patch: Partial<Settings>): void {
    if (byPlayerId !== this.hostId || this.phase !== "lobby") return;
    const timer = Number(patch.timer);
    if ((TIMER_CHOICES as readonly number[]).includes(timer)) this.settings.timer = timer;
    if (Array.isArray(patch.genres)) {
      this.settings.genres = [...new Set(patch.genres)].filter((g) => genreById.has(g)).slice(0, MAX_GENRES);
    }
    if (typeof patch.context === "string") this.settings.context = patch.context.trim().slice(0, MAX_CONTEXT_LENGTH);
    if (isToneId(patch.tone)) this.settings.tone = patch.tone;
    this.onChange(this);
  }

  /** Returns false when the request is not allowed right now. */
  start(byPlayerId: string): boolean {
    if (byPlayerId !== this.hostId || !["lobby", "final"].includes(this.phase)) return false;
    if (this.connectedPlayers().length < MIN_PLAYERS) return false;
    void this.startRound();
    return true;
  }

  toLobby(byPlayerId: string): void {
    if (byPlayerId !== this.hostId || this.phase !== "final") return;
    this.phase = "lobby";
    this.onChange(this);
  }

  // ---------- player actions ----------

  vote(voterId: string, targetId: unknown): void {
    if (this.phase !== "question" || !this.current || !this.players.has(voterId)) return;
    const q = this.current;
    if (q.votes.has(voterId)) return;
    if (!q.options.some((o) => o.id === targetId)) return;
    q.votes.set(voterId, { targetId: targetId as string, at: this.deps.now() });
    this.onChange(this);
    this.maybeEndQuestion();
  }

  // ---------- round flow ----------

  private async startRound(): Promise<void> {
    this.clearTimer();
    this.phase = "loading";
    this.history = [];
    for (const p of this.players.values()) p.score = 0;
    this.onChange(this);

    const { tracker } = this.deps;
    this.rounds += 1;
    tracker.track("rounds_started");
    if (this.rounds === 2) tracker.track("rooms_replayed");
    tracker.trackGenres(this.settings.genres);
    tracker.trackTone(this.settings.tone);

    const seq = ++this.roundSeq;
    const { genres, context, tone } = this.settings;
    let questions = await this.deps.generateQuestions({
      count: QUESTIONS_PER_ROUND,
      genres: genres.map((id) => genreById.get(id)?.label ?? id),
      context,
      tone,
      playerCount: this.players.size,
      avoid: this.used
    });
    // The room may have restarted or emptied while we waited on the AI.
    if (seq !== this.roundSeq || this.players.size === 0) return;

    tracker.track(questions.length >= QUESTIONS_PER_ROUND / 2 ? "rounds_ai" : "rounds_backup");
    if (questions.length < QUESTIONS_PER_ROUND) {
      questions = [...questions, ...pickFromBank(QUESTIONS_PER_ROUND - questions.length, [...this.used, ...questions], genres)];
    }
    this.questions = questions;
    this.used.push(...questions);
    this.qIndex = -1;
    this.nextQuestion();
  }

  private nextQuestion(): void {
    this.clearTimer();
    this.qIndex += 1;
    if (this.qIndex >= this.questions.length) return this.finishRound();

    const now = this.deps.now();
    const durationMs = this.settings.timer * 1000;
    this.current = {
      text: this.questions[this.qIndex],
      options: this.connectedPlayers().map((p) => ({ id: p.id, name: p.name })),
      votes: new Map(),
      startedAt: now,
      endsAt: now + durationMs
    };
    this.phase = "question";
    this.reveal = null;
    // Small grace so a vote sent at 0.0s on a slow phone still counts.
    this.timer = setTimeout(() => this.endQuestion(), durationMs + 300);
    this.onChange(this);
  }

  private maybeEndQuestion(): void {
    const online = this.connectedPlayers();
    if (online.length > 0 && this.current && online.every((p) => this.current!.votes.has(p.id))) this.endQuestion();
  }

  private endQuestion(): void {
    if (this.phase !== "question" || !this.current) return;
    this.clearTimer();
    const q = this.current;
    const nameOf = (id: string) => q.options.find((o) => o.id === id)?.name ?? this.players.get(id)?.name ?? "?";
    const tally = tallyVotes(q.options, q.votes, nameOf);

    const awards = tally.correctVoters.map(({ voterId, at }, rank) => {
      const points = pointsForRank(rank);
      const player = this.players.get(voterId);
      if (player) player.score += points;
      return { id: voterId, name: nameOf(voterId), points, seconds: Math.round((at - q.startedAt) / 100) / 10 };
    });

    this.reveal = {
      winners: tally.winners.map((id) => ({ id, name: nameOf(id) })),
      tally: tally.entries,
      noVote: this.connectedPlayers()
        .filter((p) => !q.votes.has(p.id))
        .map((p) => ({ id: p.id, name: p.name })),
      totalVotes: q.votes.size,
      awards
    };
    this.history.push({
      text: q.text,
      winners: tally.winners.map(nameOf),
      topVotes: tally.topVotes,
      totalVotes: q.votes.size
    });
    this.phase = "reveal";
    this.timer = setTimeout(() => this.nextQuestion(), this.deps.timings.revealMs);
    this.onChange(this);
  }

  private finishRound(): void {
    this.clearTimer();
    this.current = null;
    this.phase = "final";
    this.final = {
      leaderboard: [...this.players.values()]
        .map((p) => ({ id: p.id, name: p.name, score: p.score }))
        .sort((a, b) => b.score - a.score),
      highlights: pickHighlights(this.history),
      genres: [...this.settings.genres]
    };
    this.deps.tracker.track("rounds_finished");
    this.deps.tracker.track("players_in_finished_rounds", this.players.size);
    this.onChange(this);
  }

  // ---------- views ----------

  stateFor(playerId: string): GameState {
    const q = this.current;
    const showQuestion = q && (this.phase === "question" || this.phase === "reveal");
    return {
      code: this.code,
      phase: this.phase,
      youId: playerId,
      hostId: this.hostId,
      aiEnabled: this.deps.aiEnabled,
      settings: { ...this.settings, genres: [...this.settings.genres] },
      minPlayers: MIN_PLAYERS,
      players: [...this.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        connected: p.connected,
        voted: Boolean(q?.votes.has(p.id))
      })),
      question: showQuestion
        ? {
            index: this.qIndex,
            total: this.questions.length,
            text: q.text,
            options: q.options,
            remainingMs: this.phase === "question" ? Math.max(0, q.endsAt - this.deps.now()) : 0,
            durationMs: this.settings.timer * 1000,
            myVote: q.votes.get(playerId)?.targetId ?? null
          }
        : null,
      reveal: this.phase === "reveal" ? this.reveal : null,
      final: this.phase === "final" ? this.final : null
    };
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Stops every pending timer; call before throwing the room away. */
  dispose(): void {
    this.clearTimer();
    this.roundSeq++;
    for (const p of this.players.values()) clearTimeout(p.dropTimer);
  }
}

const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O, they look like 1 and 0

/** Owns every room on this server instance. */
export class RoomManager {
  private readonly rooms = new Map<string, Room>();

  constructor(
    private readonly deps: GameDeps,
    private readonly onChange: (room: Room) => void
  ) {}

  get size(): number {
    return this.rooms.size;
  }

  get(code: unknown): Room | undefined {
    return this.rooms.get(String(code ?? "").toUpperCase().replace(/[^A-Z]/g, ""));
  }

  create(): Room {
    let code: string;
    do {
      code = Array.from(randomBytes(4), (b) => CODE_LETTERS[b % CODE_LETTERS.length]).join("");
    } while (this.rooms.has(code));
    const room = new Room(code, this.deps, this.onChange, (r) => this.rooms.delete(r.code));
    this.rooms.set(code, room);
    this.deps.tracker.track("rooms_created");
    return room;
  }

  delete(code: string): void {
    this.rooms.get(code)?.dispose();
    this.rooms.delete(code);
  }

  /** Deletes rooms nobody has been connected to for a while. */
  sweep(): void {
    const now = this.deps.now();
    for (const room of this.rooms.values()) {
      if (room.emptySince !== null && now - room.emptySince > this.deps.timings.emptyRoomMs) {
        room.dispose();
        this.rooms.delete(room.code);
      }
    }
  }

  disposeAll(): void {
    for (const room of this.rooms.values()) room.dispose();
    this.rooms.clear();
  }
}
