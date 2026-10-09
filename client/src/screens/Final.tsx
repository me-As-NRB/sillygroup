import { useEffect, useMemo, useState } from "react";
import type { FinalView, GameState, LeaderboardEntry } from "../../../shared/types";
import { Avatar } from "../components/Avatar";
import { Scoreboard } from "../components/Players";
import { TopBar } from "../components/TopBar";
import { useGameApi, useToast } from "../context";
import { confetti } from "../lib/confetti";
import { makeShareCard } from "../lib/shareCard";
import { play } from "../lib/sound";

export function Final({ state, final }: { state: GameState; final: FinalView }) {
  const { start, toLobby } = useGameApi();
  const board = final.leaderboard;
  const isHost = state.hostId === state.youId;
  const top = board[0];
  const tied = board.filter((p) => top && p.score === top.score && top.score > 0);

  useEffect(() => {
    play("final");
    confetti(90);
  }, []);

  return (
    <main className="app">
      <TopBar code={state.code} />
      <section className="card stack center" aria-labelledby="winner-heading">
        <div className="muted" style={{ fontWeight: 600 }}>
          {tied.length > 1 ? "Joint winners" : "Winner of the round"}
        </div>
        <h1 id="winner-heading" className="display grad-text" style={{ fontSize: "clamp(2rem,9vw,2.8rem)" }}>
          {tied.length ? tied.map((p) => p.name).join(" & ") : "No one scored!"}
        </h1>
        <div className="podium" aria-label="Top three">
          <Spot entry={board[1]} place={2} youId={state.youId} />
          <Spot entry={board[0]} place={1} youId={state.youId} />
          <Spot entry={board[2]} place={3} youId={state.youId} />
        </div>
      </section>

      {board.length > 3 && (
        <section className="card stack" aria-labelledby="rest-heading">
          <h2 id="rest-heading" className="h3">
            Everyone else
          </h2>
          <Scoreboard entries={board.slice(3)} youId={state.youId} startRank={4} />
        </section>
      )}

      <ShareCard final={final} youId={state.youId} />

      {isHost ? (
        <div className="stack">
          <button className="btn primary block" onClick={start}>
            Play another round
          </button>
          <button className="btn block" onClick={toLobby}>
            Change theme in the lobby
          </button>
        </div>
      ) : (
        <p className="muted center">Waiting for the host to start another round…</p>
      )}
    </main>
  );
}

function Spot({ entry, place, youId }: { entry?: LeaderboardEntry; place: 1 | 2 | 3; youId: string }) {
  if (!entry) return <div />;
  return (
    <div className={`spot p${place}`}>
      <Avatar player={entry} size={place === 1 ? "lg" : "md"} />
      <span className="name" title={entry.name}>
        {entry.id === youId ? "You" : entry.name}
      </span>
      <span className="pts">{entry.score} pts</span>
      <div className="block" aria-label={`Place ${place}`}>
        {place}
      </div>
    </div>
  );
}

/** Result image players can post to Instagram stories or WhatsApp. */
function ShareCard({ final, youId }: { final: FinalView; youId: string }) {
  const toast = useToast();
  const blobPromise = useMemo(() => makeShareCard({ ...final, youId }), [final, youId]);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    void blobPromise.then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blobPromise]);

  const save = async () => {
    const blob = await blobPromise;
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "who-in-the-room.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const share = async () => {
    const blob = await blobPromise;
    if (!blob) return;
    const file = new File([blob], "who-in-the-room.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `Our Who In The Room results 😂 Play: ${location.origin}` });
      } catch {
        /* user cancelled */
      }
    } else {
      await save();
      toast("Image saved — post it to your story or group!");
    }
  };

  return (
    <section className="card stack center" aria-labelledby="share-heading">
      <h2 id="share-heading" className="h3">
        Share the results
      </h2>
      {url ? (
        <img className="share-preview" src={url} alt="Result card with the winner, top three and the group's favourite verdicts" />
      ) : (
        <div className="share-preview" aria-hidden="true" />
      )}
      <div className="share-actions">
        <button className="btn primary" onClick={share}>
          Share result card
        </button>
        <button className="btn" onClick={save}>
          Save image
        </button>
      </div>
    </section>
  );
}
