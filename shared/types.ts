// Types shared by the server and the browser. The server is the only source of
// truth; clients receive a GameState snapshot after every change.

export type Phase = "lobby" | "loading" | "question" | "reveal" | "final";
export type ToneId = "blunt" | "savage";
export type LanguageId = "hinglish" | "en";
export type ModeId = "friends" | "couple";

export interface Settings {
  timer: number;
  /** The chosen theme; at most one id. */
  genres: string[];
  context: string;
  tone: ToneId;
  language: LanguageId;
  /** "couple" is for two partners playing together. */
  mode: ModeId;
}

export interface PlayerRef {
  id: string;
  name: string;
}

export interface PlayerView extends PlayerRef {
  score: number;
  connected: boolean;
  voted: boolean;
}

export interface QuestionView {
  index: number;
  total: number;
  text: string;
  options: PlayerRef[];
  /** Milliseconds left when the snapshot was sent; avoids relying on client clocks. */
  remainingMs: number;
  durationMs: number;
  myVote: string | null;
}

export interface TallyEntry extends PlayerRef {
  votes: number;
  /** Who voted for this player, fastest first. */
  voters: PlayerRef[];
}

export interface Award extends PlayerRef {
  points: number;
  seconds: number;
}

export interface RevealView {
  /** Empty when nobody voted or when every vote went to a different person (no agreement). */
  winners: PlayerRef[];
  tally: TallyEntry[];
  noVote: PlayerRef[];
  totalVotes: number;
  awards: Award[];
}

export interface Highlight {
  text: string;
  winners: string[];
  topVotes: number;
  totalVotes: number;
}

export interface LeaderboardEntry extends PlayerRef {
  score: number;
}

export interface FinalView {
  leaderboard: LeaderboardEntry[];
  highlights: Highlight[];
  genres: string[];
  mode: ModeId;
  /** Questions where everyone who voted picked the same person. */
  matches: number;
  totalQuestions: number;
}

export interface GameState {
  code: string;
  phase: Phase;
  youId: string;
  hostId: string | null;
  aiEnabled: boolean;
  settings: Settings;
  minPlayers: number;
  /** Whether the host could start right now (player count fits the mode). */
  canStart: boolean;
  players: PlayerView[];
  question: QuestionView | null;
  reveal: RevealView | null;
  final: FinalView | null;
}

export interface JoinRequest {
  name?: string;
  code?: string;
  create?: boolean;
  /** Reconnect token from an earlier join, e.g. after a page refresh. */
  token?: string;
  /** True when this browser joined someone else's room before (growth metric). */
  joinedBefore?: boolean;
}

export type JoinResponse = { ok: true; code: string; token: string } | { ok: false; error: string };

export interface ClientToServerEvents {
  join: (req: JoinRequest, reply: (res: JoinResponse) => void) => void;
  settings: (patch: Partial<Settings>) => void;
  start: () => void;
  toLobby: () => void;
  vote: (data: { targetId: string }) => void;
  leave: () => void;
}

export interface ServerToClientEvents {
  state: (state: GameState) => void;
}
