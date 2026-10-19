import { NONE_ID } from "../../../shared/rules";
import type { PlayerRef } from "../../../shared/types";
import { usePlayerColor } from "../context";
import { initials } from "../lib/colors";

interface Props {
  player: PlayerRef;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ player, size = "md" }: Props) {
  const color = usePlayerColor(player.id);
  // "None of us" is not a person: a neutral dash instead of initials.
  const none = player.id === NONE_ID;
  return (
    <div className={`avatar ${size === "md" ? "" : size}${none ? " none" : ""}`} style={none ? undefined : { background: color }} aria-hidden="true">
      {none ? "–" : initials(player.name)}
    </div>
  );
}

/** Inline style that tints a card with the player's colour via the --pc custom property. */
export function usePlayerTint(id: string): React.CSSProperties {
  return { "--pc": usePlayerColor(id) } as React.CSSProperties;
}
