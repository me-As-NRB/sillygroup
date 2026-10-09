import { genreById, toneById } from "../../../shared/genres";
import type { Settings } from "../../../shared/types";

/** "🥾 Trek & Hiking · 🎉 House Party" or "🎲 Random Mix". */
export function genresLabel(genres: readonly string[]): string {
  const labels = genres.flatMap((id) => {
    const g = genreById.get(id);
    return g ? [`${g.emoji} ${g.label}`] : [];
  });
  return labels.length ? labels.join(" · ") : "🎲 Random Mix";
}

/** Themes plus tone, e.g. "🥾 Trek & Hiking  |  😏 Blunt". */
export function themeLabel(settings: Settings): string {
  const tone = toneById.get(settings.tone);
  return [genresLabel(settings.genres), tone ? `${tone.emoji} ${tone.label}` : null].filter(Boolean).join("  |  ");
}
