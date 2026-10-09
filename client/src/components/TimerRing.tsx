import { useEffect, useEffectEvent, useRef, useState } from "react";

const R = 27;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface Props {
  /** Time left when the screen mounted; counted down locally from there. */
  remainingMs: number;
  durationMs: number;
  /** Called once per whole second with the seconds left. */
  onSecond?(secondsLeft: number): void;
}

/**
 * Circular countdown. The arc is animated directly on the DOM each frame to
 * avoid re-rendering React 60 times a second; only the number uses state.
 */
export function TimerRing({ remainingMs, durationMs, onSecond }: Props) {
  const arcRef = useRef<SVGCircleElement>(null);
  const [seconds, setSeconds] = useState(Math.ceil(remainingMs / 1000));
  // Always calls the latest onSecond without restarting the animation loop.
  const notifySecond = useEffectEvent((sec: number) => onSecond?.(sec));

  useEffect(() => {
    const deadline = performance.now() + remainingMs;
    let last = Math.ceil(remainingMs / 1000);
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, deadline - performance.now());
      arcRef.current?.setAttribute("stroke-dashoffset", String(CIRCUMFERENCE * (1 - left / durationMs)));
      const sec = Math.ceil(left / 1000);
      if (sec !== last) {
        last = sec;
        setSeconds(sec);
        notifySecond(sec);
      }
      if (left > 0) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [remainingMs, durationMs]);

  return (
    <div className={`ring${seconds <= 5 ? " low" : ""}`} role="timer" aria-label={`${seconds} seconds left`}>
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
        <circle className="track" cx="32" cy="32" r={R} fill="none" strokeWidth="6" />
        <circle
          ref={arcRef}
          className="arc"
          cx="32"
          cy="32"
          r={R}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={0}
        />
      </svg>
      <b aria-hidden="true">{seconds}</b>
    </div>
  );
}
