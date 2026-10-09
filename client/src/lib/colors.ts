// Every colour keeps white initials at WCAG AA contrast (4.5:1 or better).
export const PLAYER_COLORS = [
  "#6d4aff", "#d6336c", "#0b7a50", "#b45309", "#1565c0", "#c0392b",
  "#7e3fbf", "#00796b", "#d81b60", "#556b00", "#b35500", "#3f51b5"
] as const;

/**
 * Gives each player a colour in join order. Existing players keep theirs;
 * newcomers get the first unused colour, so nobody shares one until all 12 are taken.
 * Returns the same map instance when nothing changed (cheap for React to compare).
 */
export function assignColors(prev: ReadonlyMap<string, string>, playerIds: readonly string[]): ReadonlyMap<string, string> {
  if (playerIds.every((id) => prev.has(id))) return prev;
  const next = new Map(prev);
  for (const id of playerIds) {
    if (next.has(id)) continue;
    const used = new Set(next.values());
    next.set(id, PLAYER_COLORS.find((c) => !used.has(c)) ?? PLAYER_COLORS[next.size % PLAYER_COLORS.length]);
  }
  return next;
}

/** Stable fallback for an id we have not seen in a snapshot yet. */
export function hashColor(id: string): string {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return PLAYER_COLORS[n % PLAYER_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
