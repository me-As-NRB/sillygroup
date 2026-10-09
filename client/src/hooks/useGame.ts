import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState, JoinRequest, JoinResponse, Settings } from "../../../shared/types";
import { assignColors } from "../lib/colors";
import { loadSession, markJoinedOthers, roomFromUrl, saveSession } from "../lib/session";
import { socket as defaultSocket, type GameSocket } from "../socket";

export interface GameApi {
  state: GameState | null;
  /** Colour per player id, stable for the whole session. */
  colors: ReadonlyMap<string, string>;
  offline: boolean;
  /** True while we try to rejoin a saved session on first load. */
  resuming: boolean;
  join(req: JoinRequest): Promise<JoinResponse>;
  leave(): void;
  updateSettings(patch: Partial<Settings>): void;
  start(): void;
  toLobby(): void;
  vote(targetId: string): void;
}

/**
 * Owns the connection to the game server. The server pushes a full snapshot
 * after every change, so the client keeps no game logic of its own.
 */
export function useGame(socket: GameSocket = defaultSocket): GameApi {
  const [state, setState] = useState<GameState | null>(null);
  const [colors, setColors] = useState<ReadonlyMap<string, string>>(() => new Map());
  const [offline, setOffline] = useState(false);
  const [resuming, setResuming] = useState(() => {
    const saved = loadSession();
    const code = roomFromUrl();
    return Boolean(saved && (!code || code === saved.code));
  });
  const inRoom = useRef(false);
  const pending = useRef<Promise<JoinResponse> | null>(null);

  const join = useCallback(
    (req: JoinRequest): Promise<JoinResponse> => {
      // Ignore double taps while a join is in flight.
      if (pending.current) return pending.current;
      const p = new Promise<JoinResponse>((resolve) => {
        socket.emit("join", req, (res) => {
          pending.current = null;
          if (res.ok) {
            inRoom.current = true;
            saveSession({ code: res.code, token: res.token });
            if (!req.create && !req.token) markJoinedOthers();
            history.replaceState(null, "", `?room=${res.code}`);
          } else if (req.token) {
            // Saved session is no longer valid (room ended or server restarted).
            saveSession(null);
            inRoom.current = false;
            setState(null);
          }
          resolve(res);
        });
      });
      pending.current = p;
      return p;
    },
    [socket]
  );

  const resume = useCallback(async () => {
    const saved = loadSession();
    if (saved) await join({ code: saved.code, token: saved.token });
  }, [join]);

  useEffect(() => {
    const onState = (s: GameState) => {
      if (!inRoom.current) return; // late snapshot after leaving
      setColors((prev) => assignColors(prev, s.players.map((p) => p.id)));
      setState(s);
    };
    const onConnect = () => {
      setOffline(false);
      if (inRoom.current) void resume(); // reconnect after a network drop
    };
    const onDisconnect = () => {
      if (inRoom.current) setOffline(true);
    };
    socket.on("state", onState);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("state", onState);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, resume]);

  // Rejoin a saved session once on load (e.g. after a page refresh).
  useEffect(() => {
    if (!resuming) return;
    inRoom.current = true;
    resume().finally(() => setResuming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const leave = useCallback(() => {
    socket.emit("leave");
    inRoom.current = false;
    saveSession(null);
    history.replaceState(null, "", location.pathname);
    setState(null);
  }, [socket]);

  return {
    state,
    colors,
    offline,
    resuming,
    join,
    leave,
    updateSettings: useCallback((patch) => socket.emit("settings", patch), [socket]),
    start: useCallback(() => socket.emit("start"), [socket]),
    toLobby: useCallback(() => socket.emit("toLobby"), [socket]),
    vote: useCallback((targetId: string) => socket.emit("vote", { targetId }), [socket])
  };
}
