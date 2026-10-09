import type { GameState, LeaderboardEntry, PlayerView } from "../../../shared/types";
import { Avatar, usePlayerTint } from "./Avatar";

export function PlayerChip({ player, state }: { player: PlayerView; state: GameState }) {
  const tint = usePlayerTint(player.id);
  return (
    <li className={`player${player.connected ? "" : " off"}`} style={tint}>
      <Avatar player={player} />
      <div style={{ minWidth: 0 }}>
        <div className="name" title={player.name}>
          {player.name}
        </div>
        <div className="row" style={{ gap: 4 }}>
          {player.id === state.hostId && <span className="tag">👑 host</span>}
          {player.id === state.youId && <span className="tag good">you</span>}
          {!player.connected && <span className="muted small">offline</span>}
        </div>
      </div>
    </li>
  );
}

export function Scoreboard({ entries, youId, startRank = 1 }: { entries: LeaderboardEntry[]; youId: string; startRank?: number }) {
  return (
    <ol className="board" start={startRank}>
      {entries.map((p, i) => (
        <li key={p.id} className={`line${p.id === youId ? " me" : ""}`}>
          <span className="rank" aria-hidden="true">
            {startRank + i}
          </span>
          <Avatar player={p} />
          <span>
            {p.name}
            {p.id === youId && <span className="sr-only"> (you)</span>}
          </span>
          <span className="score">{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
