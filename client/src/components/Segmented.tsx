import { useId, type KeyboardEvent } from "react";

export interface SegmentOption<T> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange(value: T): void;
}

/** Accessible radio group styled as a segmented control (arrow keys move the choice). */
export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  const labelId = useId();
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = options.findIndex((o) => o.value === value);
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = options[(i + delta + options.length) % options.length];
    onChange(next.value);
    (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="label" id={labelId}>
        {label}
      </span>
      <div className="seg" role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              data-value={o.value}
              className={on ? "on" : ""}
              onClick={() => onChange(o.value)}
            >
              {o.label}
              {o.hint && <small>{o.hint}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
