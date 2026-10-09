import type { LanguageId, ModeId, ToneId } from "./types";

export interface Genre {
  id: string;
  emoji: string;
  label: string;
}

export interface Tone {
  id: ToneId;
  emoji: string;
  label: string;
  hint: string;
}

// Shared by the server (validation, AI prompt) and the browser (genre picker).
export const GENRES: readonly Genre[] = [
  { id: "trip", emoji: "✈️", label: "Trip & Travel" },
  { id: "trek", emoji: "🥾", label: "Trek & Hiking" },
  { id: "party", emoji: "🎉", label: "House Party" },
  { id: "nightout", emoji: "🪩", label: "Night Out" },
  { id: "birthday", emoji: "🎂", label: "Birthday" },
  { id: "wedding", emoji: "💍", label: "Wedding" },
  { id: "festivals", emoji: "🪔", label: "Festivals (Diwali, Holi…)" },
  { id: "office", emoji: "💼", label: "Office & Work" },
  { id: "college", emoji: "🎓", label: "College Life" },
  { id: "movies", emoji: "🎬", label: "Movies & OTT" },
  { id: "bollywood", emoji: "💃", label: "Bollywood" },
  { id: "cricket", emoji: "🏏", label: "Cricket & Sports" },
  { id: "gym", emoji: "🏋️", label: "Gym & Fitness" },
  { id: "food", emoji: "🍕", label: "Food & Foodies" },
  { id: "dating", emoji: "💘", label: "Dating & Crushes" },
  { id: "family", emoji: "👨‍👩‍👧", label: "Family & Relatives" },
  { id: "friendship", emoji: "🤝", label: "Friendship" },
  { id: "socialmedia", emoji: "📱", label: "Social Media" },
  { id: "gaming", emoji: "🎮", label: "Gaming" },
  { id: "secrets", emoji: "🤫", label: "Secrets & Confessions" }
];

export const TONES: readonly Tone[] = [
  { id: "blunt", emoji: "😏", label: "Blunt", hint: "Direct and specific" },
  { id: "savage", emoji: "🔥", label: "Savage", hint: "Personal, exposing, no mercy" }
];

export interface Language {
  id: LanguageId;
  emoji: string;
  label: string;
  hint: string;
}

export const LANGUAGES: readonly Language[] = [
  { id: "hinglish", emoji: "🇮🇳", label: "Hinglish", hint: "Desi mix, jaise hum baat karte hain" },
  { id: "en", emoji: "🔤", label: "English", hint: "English only" }
];

export interface Mode {
  id: ModeId;
  label: string;
  hint: string;
}

export const MODES: readonly Mode[] = [
  { id: "friends", label: "Friends", hint: "Any group, 2–20 players" },
  { id: "couple", label: "Couple", hint: "For 2 partners: do you agree?" }
];

/** One theme per game keeps the questions focused. */
export const MAX_GENRES = 1;

export const genreById = new Map(GENRES.map((g) => [g.id, g]));
export const toneById = new Map(TONES.map((t) => [t.id, t]));
export const languageById = new Map(LANGUAGES.map((l) => [l.id, l]));
export const modeById = new Map(MODES.map((m) => [m.id, m]));

export function isModeId(value: unknown): value is ModeId {
  return typeof value === "string" && modeById.has(value as ModeId);
}

export function isToneId(value: unknown): value is ToneId {
  return typeof value === "string" && toneById.has(value as ToneId);
}

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && languageById.has(value as LanguageId);
}
