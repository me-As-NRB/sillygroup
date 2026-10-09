import { useEffect, useRef, useState } from "react";
import { GENRES, LANGUAGES, MAX_GENRES, MODES, TONES, genreById } from "../../../shared/genres";
import { MAX_CONTEXT_LENGTH, QUESTIONS_PER_ROUND, TIMER_CHOICES } from "../../../shared/rules";
import type { GameState } from "../../../shared/types";
import { About } from "../components/About";
import { PlayerChip } from "../components/Players";
import { Segmented } from "../components/Segmented";
import { TopBar } from "../components/TopBar";
import { useGameApi, useToast } from "../context";
import { inviteLink } from "../lib/session";
import { play } from "../lib/sound";
import { themeLabel } from "../lib/theme";

export function Lobby({ state }: { state: GameState }) {
  const toast = useToast();
  const online = state.players.filter((p) => p.connected).length;
  const isHost = state.hostId === state.youId;

  // Chime when someone new arrives.
  const lastCount = useRef(state.players.length);
  useEffect(() => {
    if (state.players.length > lastCount.current) play("join");
    lastCount.current = state.players.length;
  }, [state.players.length]);

  const invite = async () => {
    const link = inviteLink(state.code);
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: "Who In The Room", text: `Join my game! Code ${state.code}`, url: link });
        return;
      } catch {
        /* cancelled: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast("Invite link copied!");
    } catch {
      prompt("Copy this link:", link);
    }
  };

  const host = state.players.find((p) => p.id === state.hostId);

  return (
    <main className="app">
      <TopBar code={state.code} />
      <section className="card stack room-hero" aria-labelledby="code-label">
        <div id="code-label" className="muted small">
          Share this code with your group
        </div>
        <div className="room-code grad-text">{state.code}</div>
        <button className="btn primary" onClick={invite}>
          Invite friends
        </button>
      </section>

      <section className="card stack" aria-labelledby="players-heading">
        <div className="row spread">
          <h2 id="players-heading" className="h3">
            Players
          </h2>
          <span className="muted small">{online} online</span>
        </div>
        <ul className="players">
          {state.players.map((p) => (
            <PlayerChip key={p.id} player={p} state={state} />
          ))}
        </ul>
      </section>

      {isHost ? (
        <HostSetup state={state} online={online} />
      ) : (
        <section className="card stack center" aria-live="polite">
          <h2 className="h3">Waiting for {host?.name ?? "the host"} to start…</h2>
          <p className="muted" style={{ margin: 0 }}>
            {themeLabel(state.settings)}
          </p>
          {online < state.minPlayers && (
            <p className="muted small" style={{ margin: 0 }}>
              Need at least {state.minPlayers} players.
            </p>
          )}
        </section>
      )}
      <About />
    </main>
  );
}

function HostSetup({ state, online }: { state: GameState; online: number }) {
  const { updateSettings, start } = useGameApi();
  const { settings } = state;
  const [search, setSearch] = useState("");
  const [context, setContext] = useState(settings.context);
  const contextFocused = useRef(false);

  // Follow the server's copy unless the host is typing.
  useEffect(() => {
    if (!contextFocused.current) setContext(settings.context);
  }, [settings.context]);

  // Debounce context updates so we don't send one per keystroke.
  useEffect(() => {
    if (context === settings.context) return;
    const t = setTimeout(() => updateSettings({ context }), 400);
    return () => clearTimeout(t);
  }, [context, settings.context, updateSettings]);

  const chosen = settings.genres;
  const q = search.trim().toLowerCase();
  const visible = [
    ...chosen.flatMap((id) => genreById.get(id) ?? []),
    ...GENRES.filter((g) => !chosen.includes(g.id) && (!q || g.label.toLowerCase().includes(q)))
  ];
  // Single choice: picking a theme replaces the previous one; picking it again clears it.
  const toggle = (id: string) => updateSettings({ genres: chosen.includes(id) ? [] : [id].slice(0, MAX_GENRES) });

  const couple = settings.mode === "couple";
  const missing = state.minPlayers - online;
  const startLabel = state.canStart
    ? `Start game (${QUESTIONS_PER_ROUND} questions)`
    : couple
      ? "Couple mode needs exactly 2 players"
      : `Need ${missing} more player${missing === 1 ? "" : "s"}`;

  return (
    <section className="card stack" aria-labelledby="setup-heading">
      <h2 id="setup-heading" className="h3">
        Game setup
      </h2>
      <div className="row spread">
        <span className="label" id="themes-label">
          Pick one theme
        </span>
        <span className="muted small" aria-live="polite">
          {chosen.length ? genreById.get(chosen[0])?.label : "None: random mix"}
        </span>
      </div>
      <input
        className="input"
        type="search"
        aria-label="Search themes"
        placeholder="Search 50 themes…"
        style={{ padding: "10px 14px", fontSize: ".95rem" }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="chips" role="group" aria-labelledby="themes-label">
        {visible.map((g) => {
          const on = chosen.includes(g.id);
          return (
            <button key={g.id} type="button" className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(g.id)}>
              {g.label}
            </button>
          );
        })}
      </div>

      <label htmlFor="context">Tell the AI about your group (optional)</label>
      <textarea
        id="context"
        className="input"
        maxLength={MAX_CONTEXT_LENGTH}
        placeholder="e.g. 6 college friends back from a Manali trek. Rohan always forgets things, Sneha plans everything."
        value={context}
        onChange={(e) => setContext(e.target.value)}
        onFocus={() => (contextFocused.current = true)}
        onBlur={() => {
          contextFocused.current = false;
          if (context !== settings.context) updateSettings({ context });
        }}
        aria-describedby="ai-note"
      />
      <p id="ai-note" className="muted small" style={{ margin: 0 }}>
        {state.aiEnabled
          ? `AI writes ${QUESTIONS_PER_ROUND} fresh questions from your theme, tone and description.`
          : "Using the built-in questions (AI not set up). Your theme, tone and language still pick matching ones."}
      </p>

      <Segmented
        label="Who is playing?"
        value={settings.mode}
        options={MODES.map((m) => ({ value: m.id, label: m.label, hint: m.hint }))}
        onChange={(mode) => updateSettings({ mode })}
      />
      <Segmented
        label="Language"
        value={settings.language}
        options={LANGUAGES.map((l) => ({ value: l.id, label: l.label, hint: l.hint }))}
        onChange={(language) => updateSettings({ language })}
      />
      <Segmented
        label="How blunt?"
        value={settings.tone}
        options={TONES.map((t) => ({ value: t.id, label: t.label, hint: t.hint }))}
        onChange={(tone) => updateSettings({ tone })}
      />
      <Segmented
        label="Time per question"
        value={settings.timer}
        options={TIMER_CHOICES.map((t) => ({ value: t, label: `${t}s` }))}
        onChange={(timer) => updateSettings({ timer })}
      />

      <button
        className="btn primary block"
        disabled={!state.canStart}
        onClick={() => {
          if (context !== settings.context) updateSettings({ context });
          start();
        }}
      >
        {startLabel}
      </button>
    </section>
  );
}
