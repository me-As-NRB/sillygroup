// Small wrappers around browser storage. Storage can be blocked (private mode,
// strict settings), so every access is guarded and the game works without it.

export interface SavedSession {
  code: string;
  token: string;
}

const SESSION_KEY = "witr-session";

function read(store: () => Storage, key: string): string | null {
  try {
    return store().getItem(key);
  } catch {
    return null;
  }
}

function write(store: () => Storage, key: string, value: string | null): void {
  try {
    if (value === null) store().removeItem(key);
    else store().setItem(key, value);
  } catch {
    /* ignore */
  }
}

const session = () => sessionStorage;
const local = () => localStorage;

/** Per-tab, so testing with several tabs gives several players. */
export function loadSession(): SavedSession | null {
  try {
    const parsed = JSON.parse(read(session, SESSION_KEY) ?? "null") as SavedSession | null;
    return parsed?.code && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSession(s: SavedSession | null): void {
  write(session, SESSION_KEY, s ? JSON.stringify(s) : null);
}

export const savedName = (): string => read(local, "witr-name") ?? "";
export const rememberName = (name: string): void => write(local, "witr-name", name);

export const hasJoinedOthers = (): boolean => read(local, "witr-joined") === "1";
export const markJoinedOthers = (): void => write(local, "witr-joined", "1");

export function roomFromUrl(): string {
  const q = new URLSearchParams(location.search).get("room");
  return q ? q.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) : "";
}

export const inviteLink = (code: string): string => `${location.origin}${location.pathname}?room=${code}`;
