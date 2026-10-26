import type { HTMLAttributes } from 'react';
import { formatNumber } from './format.js';
import { starPath } from './marks.js';
import { v } from './tokens.js';

export type RunProgressState = 'running' | 'complete' | 'partial' | 'failed';

export interface RunProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Items (or respondents) finished. */
  done: number;
  total: number;
  state?: RunProgressState;
  /** Unit label for the count, e.g. "items". */
  unit?: string;
  width?: number;
  locale?: string;
}

const WORD: Record<RunProgressState, string> = { running: 'Running', complete: 'Complete', partial: 'Partial', failed: 'Failed' };

/**
 * Run progress: a row of stars, lit as items finish, with a word for the state. Static (nothing loops),
 * so it is the same under reduced motion. State is told by the word and the shape, not by colour alone.
 */
export function RunProgress({ done, total, state = 'running', unit = 'items', width = 240, locale = 'en', style, ...rest }: RunProgressProps) {
  const t = Math.max(0, Math.floor(total));
  const d = Math.max(0, Math.min(t, Math.floor(done)));
  const slots = Math.min(t, 24);
  const lit = t ? Math.round((d / t) * slots) : 0;
  const step = slots > 1 ? (width - 8) / (slots - 1) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={t}
      aria-valuenow={d}
      aria-valuetext={`${WORD[state]}: ${formatNumber(d, { locale })} of ${formatNumber(t, { locale })} ${unit}`}
      data-part="run-progress"
      data-state={state}
      style={{ display: 'grid', gap: 6, fontFamily: v.sans, ...style }}
      {...rest}
    >
      <svg width={width} height={12} viewBox={`0 0 ${width} 12`} aria-hidden="true">
        {Array.from({ length: slots }, (_, i) => {
          const on = i < lit;
          const failedHere = state === 'failed' && i === lit;
          return failedHere ? (
            <path key={i} d={`M${4 + i * step - 3} 3L${4 + i * step + 3} 9M${4 + i * step + 3} 3L${4 + i * step - 3} 9`} stroke={v.text2} strokeWidth={1.5} data-mark="failed" />
          ) : (
            <path key={i} d={starPath(4 + i * step, 6, on ? 4 : 2.5)} fill={on ? v.signal : v.line2} data-mark={on ? 'done' : 'pending'} />
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: v.text2 }}>
        <span data-part="state">{WORD[state]}</span>
        <span style={{ fontFamily: v.mono, fontVariantNumeric: 'tabular-nums' }}>
          {formatNumber(d, { locale })} / {formatNumber(t, { locale })} {unit}
        </span>
      </div>
    </div>
  );
}
