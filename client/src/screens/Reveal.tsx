import { useEffect, useState } from "react";
import type { GameState, QuestionView, RevealView, TallyEntry } from "../../../shared/types";
import { Avatar, usePlayerTint } from "../components/Avatar";
import { Scoreboard } from "../components/Players";
import { TopBar } from "../components/TopBar";
import { play } from "../lib/sound";


export function Reveal({ state, question, reveal }: { state: GameState; question: QuestionView; reveal: RevealView }) {
  const myVote = question.myVote;
  const myAward = reveal.awards.find((a) => a.id === state.youId);
  const winnerIds = new Set(reveal.winners.map((w) => w.id));
  const max = Math.max(1, ...reveal.tally.map((t) => t.votes));
  const last = question.index + 1 >= question.total;

  useEffect(() => {
    play("reveal");
    const t = setTimeout(() => {
      if (myAward) play("correct");
      else if (myVote) play("wrong");
    }, 650);
    return () => clearTimeout(t);
    // Sounds play once when the reveal appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verdict = reveal.winners.length ? reveal.winners.map((w) => w.name).join(" & ") : "Nobody voted!";
  const leaderboard = [...state.players].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <main className="app">
      <TopBar code={state.code} />
      <div className="row spread">
        <b>
          Question {question.index + 1} of {question.total}
        </b>
        <span className="muted small">{last ? "Final results next" : "Next question soon…"}</span>
      </div>

      <section className="card stack" aria-live="polite">
        <p className="center muted" style={{ margin: 0, fontWeight: 500 }}>
          {question.text}
        </p>
        <div className="winner">
          <div className="label">{reveal.winners.length > 1 ? "It's a tie!" : "The group says"}</div>
          <div className="avatars">
            {reveal.winners.map((w) => (
              <Avatar key={w.id} player={w} size="lg" />
            ))}
          </div>
          <h1 className="who display grad-text">{verdict}</h1>
        </div>
        {myAward ? (
          <div className="result-banner good">You got it! +{myAward.points} points</div>
        ) : myVote ? (
          <div className="result-banner bad">Not this time. The group thought differently.</div>
        ) : (
          <div className="result-banner none">You didn't vote on this one.</div>
        )}
      </section>

      <section className="card stack" aria-labelledby="votes-heading">
        <h2 id="votes-heading" className="h3">
          Who voted for whom
        </h2>
        {reveal.totalVotes ? (
          <ul className="votes">
            {reveal.tally
              .filter((t) => t.votes > 0)
              .map((t) => (
                <VoteRow key={t.id} entry={t} max={max} won={winnerIds.has(t.id)} youId={state.youId} />
              ))}
          </ul>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No votes this time.
          </p>
        )}
        {reveal.noVote.length > 0 && (
          <p className="muted small" style={{ margin: 0 }}>
            Didn't vote: {reveal.noVote.map((p) => p.name).join(", ")}
          </p>
        )}
      </section>

      {reveal.awards.length > 0 && (
        <section className="card stack" aria-labelledby="awards-heading">
          <h2 id="awards-heading" className="h3">
            Fastest right guesses
          </h2>
          <ol className="awards">
            {reveal.awards.map((a, i) => (
              <li key={a.id} className="award">
                <span className="rank">{i + 1}</span>
                <span className="n">
                  {a.id === state.youId ? "You" : a.name} · {a.seconds}s
                </span>
                <span className="pts">+{a.points}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card stack" aria-labelledby="board-heading">
        <h2 id="board-heading" className="h3">
          Leaderboard
        </h2>
        <Scoreboard entries={leaderboard} youId={state.youId} />
      </section>
    </main>
  );
}

function VoteRow({ entry, max, won, youId }: { entry: TallyEntry; max: number; won: boolean; youId: string }) {
  const tint = usePlayerTint(entry.id);
  // Start at 0 and grow on the next frame so the bar animates in.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth((entry.votes / max) * 100));
    return () => cancelAnimationFrame(raf);
  }, [entry.votes, max]);

  return (
    <li className={`vote-row${won ? " win" : ""}`} style={tint}>
      <div className="head">
        <Avatar player={entry} size="sm" />
        <span className="n">{entry.name}</span>
        <span className="count">
          {entry.votes}
          <span className="sr-only"> votes</span>
        </span>
      </div>
      <div className="track" aria-hidden="true">
        <div className="fill" style={{ width: `${width}%` }} />
      </div>
      <div className="voters">
        <span className="muted small" style={{ alignSelf: "center" }}>
          picked by
        </span>
        {entry.voters.map((v) => (
          <span key={v.id} className={`voter${v.id === youId ? " me" : ""}`}>
            <Avatar player={v} size="sm" />
            {v.id === youId ? "You" : v.name}
          </span>
        ))}
      </div>
    </li>
  );
}
