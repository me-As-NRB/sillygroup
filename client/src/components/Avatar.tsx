import type { PlayerRef } from "../../../shared/types";
import { usePlayerColor } from "../context";
import { initials } from "../lib/colors";

interface Props {
  player: PlayerRef;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ player, size = "md" }: Props) {
  const color = usePlayerColor(player.id);
  return (
    <div className={`avatar ${size === "md" ? "" : size}`} style={{ background: color }} aria-hidden="true">
      {initials(player.name)}
    </div>
  );
}

/** Inline style that tints a card with the player's colour via the --pc custom property. */
export function usePlayerTint(id: string): React.CSSProperties {
  return { "--pc": usePlayerColor(id) } as React.CSSProperties;
}
