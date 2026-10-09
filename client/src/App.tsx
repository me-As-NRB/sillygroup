import { Suspense, lazy, useEffect } from "react";
import type { GameState } from "../../shared/types";
import { GameContext, ToastProvider } from "./context";
import { useGame } from "./hooks/useGame";
import { unlockAudio } from "./lib/sound";
import { Home } from "./screens/Home";

// The home screen ships in the main bundle; everything after joining loads on
// demand (and is prefetched while the player types their name).
const loadGameScreens = () => import("./screens/game");
const Lobby = lazy(() => loadGameScreens().then((m) => ({ default: m.Lobby })));
const Loading = lazy(() => loadGameScreens().then((m) => ({ default: m.Loading })));
const Question = lazy(() => loadGameScreens().then((m) => ({ default: m.Question })));
const Reveal = lazy(() => loadGameScreens().then((m) => ({ default: m.Reveal })));
const Final = lazy(() => loadGameScreens().then((m) => ({ default: m.Final })));

export function App() {
  const game = useGame();

  // Warm the game-screen chunk once the page is idle.
  useEffect(() => {
    const id = setTimeout(() => void loadGameScreens(), 1500);
    return () => clearTimeout(id);
  }, []);

  // Browsers block audio until the first tap or key press.
  useEffect(() => {
    addEventListener("pointerdown", unlockAudio);
    addEventListener("keydown", unlockAudio);
    return () => {
      removeEventListener("pointerdown", unlockAudio);
      removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Scroll to the top whenever the screen changes.
  const screenKey = screenKeyOf(game.state);
  useEffect(() => {
    // Block body on purpose: newer browsers return a Promise from scrollTo,
    // and React treats an effect's return value as its cleanup function.
    window.scrollTo({ top: 0 });
  }, [screenKey]);

  return (
    <GameContext.Provider value={game}>
      <ToastProvider>
        {game.offline && (
          <div className="offline" role="alert">
            Reconnecting…
          </div>
        )}
        <Suspense fallback={<main className="app" aria-busy="true" />}>
          <Screen state={game.state} resuming={game.resuming} />
        </Suspense>
      </ToastProvider>
    </GameContext.Provider>
  );
}

function screenKeyOf(state: GameState | null): string {
  if (!state) return "home";
  return state.question ? `${state.phase}-${state.question.index}` : state.phase;
}

function Screen({ state, resuming }: { state: GameState | null; resuming: boolean }) {
  if (!state) return resuming ? <main className="app" aria-busy="true" /> : <Home />;
  switch (state.phase) {
    case "lobby":
      return <Lobby state={state} />;
    case "loading":
      return <Loading state={state} />;
    case "question":
      return state.question && <Question key={state.question.index} state={state} question={state.question} />;
    case "reveal":
      return (
        state.question &&
        state.reveal && <Reveal key={state.question.index} state={state} question={state.question} reveal={state.reveal} />
      );
    case "final":
      return state.final && <Final state={state} final={state.final} />;
  }
}
