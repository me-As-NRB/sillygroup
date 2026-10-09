import { genreById, languageById, toneById } from "../../../shared/genres";
import type { Settings } from "../../../shared/types";

/** "🥾 Trek & Hiking · 🎉 House Party" or "🎲 Random Mix". */
export function genresLabel(genres: readonly string[]): string {
  const labels = genres.flatMap((id) => {
    const g = genreById.get(id);
    return g ? [`${g.emoji} ${g.label}`] : [];
  });
  return labels.length ? labels.join(" · ") : "🎲 Random Mix";
}

/** Theme, tone and language, e.g. "🥾 Trek & Hiking  |  🔥 Savage  |  🇮🇳 Hinglish". */
export function themeLabel(settings: Settings): string {
  const tone = toneById.get(settings.tone);
  const language = languageById.get(settings.language);
  return [genresLabel(settings.genres), tone && `${tone.emoji} ${tone.label}`, language && `${language.emoji} ${language.label}`]
    .filter(Boolean)
    .join("  |  ");
}
