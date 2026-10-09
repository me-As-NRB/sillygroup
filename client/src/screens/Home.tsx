import { useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_NAME_LENGTH } from "../../../shared/rules";
import { About } from "../components/About";
import { useGameApi, useToast } from "../context";
import { hasJoinedOthers, rememberName, roomFromUrl, savedName } from "../lib/session";

export function Home() {
  const { join } = useGameApi();
  const toast = useToast();
  const linkCode = roomFromUrl();
  const [name, setName] = useState(savedName);
  const [code, setCode] = useState(linkCode);
  const [busy, setBusy] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const requireName = (): string | null => {
    const n = name.trim();
    if (!n) {
      toast("Enter your name first.");
      nameRef.current?.focus();
      return null;
    }
    rememberName(n);
    return n;
  };

  const run = async (req: Parameters<typeof join>[0]) => {
    setBusy(true);
    const res = await join(req);
    setBusy(false);
    if (!res.ok) toast(res.error);
  };

  const create = () => {
    const n = requireName();
    if (n) void run({ name: n, create: true, joinedBefore: hasJoinedOthers() });
  };

  const joinRoom = () => {
    const n = requireName();
    if (!n) return;
    const c = code.trim().toUpperCase();
    if (c.length !== 4) return toast("Room codes have 4 letters.");
    void run({ name: n, code: c });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (linkCode) joinRoom();
    else create();
  };

  const joinBlock = (
    <div className="stack">
      <label htmlFor="code">Room code</label>
      <div className="row">
        <input
          id="code"
          className="input code"
          maxLength={4}
          placeholder="CODE"
          autoCapitalize="characters"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              joinRoom();
            }
          }}
        />
        <button type="button" className={linkCode ? "btn primary" : "btn"} onClick={joinRoom} disabled={busy}>
          Join
        </button>
      </div>
    </div>
  );

  return (
    <main className="app home">
      <section className="hero-copy">
        <h1>
          Who In The <span className="grad-text">Room</span>
        </h1>
        <p className="lede">
          AI writes cheeky questions about <em>your</em> group. Everyone secretly votes for who fits best. Match the
          majority, fastest, to win.
        </p>
      </section>

      <form className="card stack join-card" onSubmit={onSubmit}>
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          ref={nameRef}
          className="input"
          maxLength={MAX_NAME_LENGTH}
          autoComplete="name"
          placeholder="e.g. Priya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-describedby="name-hint"
        />
        <p id="name-hint" className="muted small" style={{ margin: 0 }}>
          Use your real name so friends can vote for you.
        </p>
        {linkCode ? (
          <>
            {joinBlock}
            <div className="divider">or</div>
            <button type="button" className="btn block" onClick={create} disabled={busy}>
              Create a new room
            </button>
          </>
        ) : (
          <>
            <button type="submit" className="btn primary block" disabled={busy}>
              Create a room
            </button>
            <div className="divider">or join friends</div>
            {joinBlock}
          </>
        )}
      </form>

      <ol className="steps" aria-label="How it works">
        <li>
          <b>Create a room</b>
          <span>Share the link or 4-letter code on WhatsApp.</span>
        </li>
        <li>
          <b>Vote in secret</b>
          <span>"Who's most likely to…?" Pick one of your friends.</span>
        </li>
        <li>
          <b>See who picked whom</b>
          <span>Fastest right guess scores the most. 12 questions a round.</span>
        </li>
      </ol>
      <About />
    </main>
  );
}
