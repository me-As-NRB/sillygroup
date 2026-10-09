import { useEffect, useState } from "react";
import type { GameState, PlayerRef, QuestionView } from "../../../shared/types";
import { Avatar, usePlayerTint } from "../components/Avatar";
import { TimerRing } from "../components/TimerRing";
import { TopBar } from "../components/TopBar";
import { useGameApi } from "../context";
import { play } from "../lib/sound";
import { genresLabel } from "../lib/theme";

/** Rendered with key={question.index}, so each question starts with fresh state. */
export function Question({ state, question }: { state: GameState; question: QuestionView }) {
  const { vote } = useGameApi();
  // Optimistic pick so the button reacts instantly; the server's copy wins once it arrives.
  const [picked, setPicked] = useState<string | null>(null);
  const myVote = question.myVote ?? picked;

  useEffect(() => {
    play("question");
  }, []);

  const choose = (id: string) => {
    if (myVote) return;
    setPicked(id);
    play("vote");
    vote(id);
  };

  const online = state.players.filter((p) => p.connected);
  const done = online.filter((p) => p.voted).length;

  return (
    <main className="app">
      <TopBar code={state.code} />
      <div className="qbar">
        <div className="info">
          <div className="row spread">
            <b>
              Question {question.index + 1}/{question.total}
            </b>
            <span className="muted small theme-mini">{genresLabel(state.settings.genres)}</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="Round progress"
            aria-valuemin={1}
            aria-valuemax={question.total}
            aria-valuenow={question.index + 1}
          >
            {Array.from({ length: question.total }, (_, i) => (
              <i key={i} className={i < question.index ? "done" : i === question.index ? "now" : ""} />
            ))}
          </div>
        </div>
        <TimerRing
          remainingMs={question.remainingMs}
          durationMs={question.durationMs}
          onSecond={(s) => {
            if (s > 0 && s <= 5 && !myVote) play("tick");
          }}
        />
      </div>

      <section className="card question-card">
        <h1 className="question-text">{question.text}</h1>
      </section>

      <div className="options" role="group" aria-label="Pick a player">
        {question.options.map((o) => (
          <OptionButton
            key={o.id}
            player={o}
            isYou={o.id === state.youId}
            picked={o.id === myVote}
            disabled={Boolean(myVote)}
            onPick={() => choose(o.id)}
          />
        ))}
      </div>

      <p className="muted center" style={{ margin: 0 }} aria-live="polite">
        {myVote
          ? `Locked in. Waiting for others… (${done}/${online.length})`
          : "Who will the group pick? Faster right answers score more!"}
      </p>
      <ul className="voted-strip" aria-label="Who has voted">
        {online.map((p) => (
          <li key={p.id} className={`dot${p.voted ? " done" : ""}`}>
            {p.voted ? "✓ " : ""}
            {p.name}
            <span className="sr-only">{p.voted ? " has voted" : " has not voted yet"}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

interface OptionProps {
  player: PlayerRef;
  isYou: boolean;
  picked: boolean;
  disabled: boolean;
  onPick(): void;
}

function OptionButton({ player, isYou, picked, disabled, onPick }: OptionProps) {
  const tint = usePlayerTint(player.id);
  return (
    <button className={`option${picked ? " picked" : ""}`} style={tint} disabled={disabled} aria-pressed={picked} onClick={onPick}>
      <Avatar player={player} />
      <span>{player.name}</span>
      {isYou && <span className="tag good">you</span>}
    </button>
  );
}
