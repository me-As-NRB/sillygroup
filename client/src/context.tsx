import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { GameApi } from "./hooks/useGame";
import { hashColor } from "./lib/colors";

export const GameContext = createContext<GameApi | null>(null);

export function useGameApi(): GameApi {
  const api = useContext(GameContext);
  if (!api) throw new Error("useGameApi must be used inside <GameContext.Provider>");
  return api;
}

export function usePlayerColor(id: string): string {
  const api = useContext(GameContext);
  return api?.colors.get(id) ?? hashColor(id);
}

// ---------- toast ----------

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast${visible ? " show" : ""}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
