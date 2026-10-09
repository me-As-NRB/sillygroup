import { useState } from "react";
import { useGameApi } from "../context";
import { isMuted, play, setMuted } from "../lib/sound";

export function TopBar({ code }: { code: string }) {
  const { leave, state } = useGameApi();
  const couple = state?.settings.mode === "couple";
  const [muted, setMutedState] = useState(isMuted);

  const toggleSound = () => {
    setMuted(!muted);
    setMutedState(!muted);
    if (muted) play("vote");
  };

  return (
    <header className="topbar">
      <div className="row" style={{ gap: 10 }}>
        <span className="pill code" title="Room code">
          <span className="sr-only">Room code </span>
          {code}
        </span>
        {couple && <span className="couple-badge">♥ Couple mode</span>}
      </div>
      <div className="row" style={{ gap: 6 }}>
        <button className="icon-btn" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}>
          <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm("Leave this room?")) leave();
          }}
        >
          Leave
        </button>
      </div>
    </header>
  );
}
