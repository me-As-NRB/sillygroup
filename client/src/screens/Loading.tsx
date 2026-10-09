import { useEffect } from "react";
import type { GameState } from "../../../shared/types";
import { play } from "../lib/sound";
import { themeLabel } from "../lib/theme";

export function Loading({ state }: { state: GameState }) {
  useEffect(() => {
    play("start");
  }, []);
  return (
    <main className="app">
      <section className="card stack center" style={{ marginTop: "18vh" }} aria-live="polite" aria-busy="true">
        <div className="spinner" aria-hidden="true" />
        <h1 className="h2">Cooking up questions…</h1>
        <p className="center" style={{ margin: 0, fontWeight: 600 }}>
          {themeLabel(state.settings)}
        </p>
        <p className="muted center" style={{ margin: 0 }}>
          {state.aiEnabled ? "The AI is writing questions just for your group." : "Shuffling the deck."}
        </p>
      </section>
    </main>
  );
}
