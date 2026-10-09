import { genreById, languageById, toneById } from "../../../shared/genres";
import type { Settings } from "../../../shared/types";

/** "Trek & Hiking", or "Random Mix" when no theme is picked. */
export function genresLabel(genres: readonly string[]): string {
  const labels = genres.flatMap((id) => {
    const g = genreById.get(id);
    return g ? [g.label] : [];
  });
  return labels.length ? labels.join(" · ") : "Random Mix";
}

/** Theme, tone and language, e.g. "Trek & Hiking · Savage · Hinglish" (plus "Couple mode"). */
export function themeLabel(settings: Settings): string {
  return [
    settings.mode === "couple" ? "Couple mode" : null,
    genresLabel(settings.genres),
    toneById.get(settings.tone)?.label,
    languageById.get(settings.language)?.label
  ]
    .filter(Boolean)
    .join(" · ");
}
