import { cx } from './hooks.js';
import { PRIMES, clamp, lissajousPath, r2, starPath, vogel } from './math.js';

export interface LoaderProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Pixel size of the square mark. */
  size?: number;
  /** Announced to screen readers, and shown beside the still mark under reduced motion. Default "Loading". */
  label?: string;
}

function Loader({ kind, size, label, className, style, children, ...rest }: LoaderProps & { kind: string; children: React.ReactNode }) {
  return (
    <span {...rest} role="status" className={cx('ns-fx-loader', `ns-fx-loader--${kind}`, className)} style={{ ...style, '--ns-fx-size': `${size}px` } as React.CSSProperties}>
      {children}
      <span className="ns-fx-loader__label">{label}</span>
    </span>
  );
}

/* ---------------------------------------------------------- OrbitSpinner */

/**
 * A north star with two planets on circular orbits. Their periods follow
 * Kepler's third law (T ∝ a^1.5), so the inner planet laps the outer one and
 * the pair never repeats the same picture on a short cycle.
 */
export function OrbitSpinner({ size = 32, label = 'Loading', ...rest }: LoaderProps) {
  const inner = 1.2;
  const outer = r2(inner * Math.pow(12 / 7, 1.5));
  return (
    <Loader kind="orbit" size={size} label={label} {...rest}>
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle className="ns-fx-orbit__ring" cx="16" cy="16" r="7" />
        <circle className="ns-fx-orbit__ring" cx="16" cy="16" r="12" />
        <path className="ns-fx-orbit__star" d={starPath(16, 16, 4, 0.9)} />
        <g className="ns-fx-orbit__arm" style={{ '--ns-fx-t': `${inner}s` } as React.CSSProperties}>
          <circle className="ns-fx-orbit__planet" cx="16" cy="9" r="1.9" />
        </g>
        <g className="ns-fx-orbit__arm" style={{ '--ns-fx-t': `${outer}s` } as React.CSSProperties}>
          <circle className="ns-fx-orbit__planet ns-fx-orbit__planet--far" cx="16" cy="4" r="1.5" />
        </g>
      </svg>
    </Loader>
  );
}

/* ------------------------------------------------------- FibonacciLoader */

export interface FibonacciLoaderProps extends LoaderProps {
  /** Number of seeds in the head. A Fibonacci number reads best. Default 21. */
  seeds?: number;
}

/**
 * A sunflower head of seeds placed at the golden angle (Vogel's model). Each
 * seed's pulse is offset by its index times 1/φ, so the brightness travels
 * outward along the spiral arms (the parastichies).
 */
export function FibonacciLoader({ size = 32, label = 'Loading', seeds = 21, ...rest }: FibonacciLoaderProps) {
  const n = Math.max(5, Math.min(89, Math.round(seeds)));
  return (
    <Loader kind="fibonacci" size={size} label={label} {...rest}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        {Array.from({ length: n }, (_, i) => {
          const p = vogel(i, n);
          return (
            <circle
              key={i}
              className="ns-fx-seed"
              cx={r2(20 + p.x * 17)}
              cy={r2(20 + p.y * 17)}
              r={r2(0.9 + p.r * 1.3)}
              style={{ '--ns-fx-k': r2((i * 0.618034) % 1) } as React.CSSProperties}
            />
          );
        })}
      </svg>
    </Loader>
  );
}

/* ------------------------------------------------------- LissajousLoader */

export interface LissajousLoaderProps extends LoaderProps {
  /** Frequency ratio a:b. Default [3, 2]. */
  ratio?: [number, number];
  /** Seconds for one full figure. Default 3.6. */
  period?: number;
}

/**
 * A point tracing x = cos(a·t), y = sin(b·t) over its own faint figure. Two
 * nested translations with sine easing give the exact curve using transforms
 * only: half a cosine is precisely the ease-in-out-sine curve.
 */
export function LissajousLoader({ size = 32, label = 'Loading', ratio = [3, 2], period = 3.6, ...rest }: LissajousLoaderProps) {
  const [a, b] = ratio;
  const px = r2(period / (2 * a));
  const py = r2(period / (2 * b));
  return (
    <Loader kind="lissajous" size={size} label={label} {...rest}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <path className="ns-fx-liss__track" d={lissajousPath(a, b, 32)} transform="translate(4 4)" />
        {[0, 1, 2, 3].map((k) => (
          <g
            key={k}
            className="ns-fx-liss__x"
            style={{ '--ns-fx-d': `${px}s`, '--ns-fx-lag': `${-r2(period - k * period * 0.018)}s` } as React.CSSProperties}
          >
            <g className="ns-fx-liss__y" style={{ '--ns-fx-d': `${py}s`, '--ns-fx-lag': `${-r2(period + py / 2 - k * period * 0.018)}s` } as React.CSSProperties}>
              <circle className="ns-fx-liss__dot" cx="20" cy="20" r={r2(2 - k * 0.35)} style={{ opacity: r2(1 - k * 0.24) }} />
            </g>
          </g>
        ))}
      </svg>
    </Loader>
  );
}

/* --------------------------------------------------------- PrimeSkeleton */

export interface PrimeSkeletonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of placeholder lines. Default 3. */
  lines?: number;
  /** Line widths in percent; cycled. */
  widths?: number[];
  /** Line height in pixels. Default 12. */
  lineHeight?: number;
  /** Announced to screen readers. Default "Loading". */
  label?: string;
}

/**
 * Skeleton lines whose shimmers run on prime-numbered periods (3, 5, 7, 11 …
 * × 0.5 s). No two lines ever fall into step, so the block never pulses as
 * one. Under reduced motion the lines are still.
 */
export function PrimeSkeleton({ lines = 3, widths = [100, 88, 72, 94, 64], lineHeight = 12, label = 'Loading', className, style, ...rest }: PrimeSkeletonProps) {
  return (
    <div {...rest} role="status" className={cx('ns-fx-pskel', className)} style={{ ...style, '--ns-fx-h': `${lineHeight}px` } as React.CSSProperties}>
      {Array.from({ length: Math.max(1, lines) }, (_, i) => (
        <span
          key={i}
          className="ns-fx-pskel__line"
          aria-hidden="true"
          style={{ width: `${widths[i % widths.length]}%`, '--ns-fx-t': `${(PRIMES[(i % (PRIMES.length - 1)) + 1] ?? 3) * 0.5}s` } as React.CSSProperties}
        />
      ))}
      <span className="ns-fx-sr">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------- ProgressSextant */

export interface ProgressSextantProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  max?: number;
  /** Accessible name. Required unless `aria-labelledby` is given. */
  label?: string;
  /** Pixel width; height follows. Default 160. */
  width?: number;
  /** Formats the readout. Default whole percent. */
  format?: (value: number, max: number) => string;
}

const ARC_FROM = -150;
const ARC_SPAN = 120;
const TICKS = 25;

/**
 * Arc progress drawn like a sextant's limb: 24 graduations, a major one
 * every quarter, and an index arm that swings to the reading. Only the arm's
 * rotation and the ticks' opacity change.
 */
export function ProgressSextant({ value, max = 100, label, width = 160, format, className, style, ...rest }: ProgressSextantProps) {
  const f = max > 0 ? clamp(value / max, 0, 1) : 0;
  const text = format ? format(value, max) : `${Math.round(f * 100)}%`;
  const pt = (deg: number, rad: number) => {
    const t = (deg * Math.PI) / 180;
    return [r2(60 + rad * Math.cos(t)), r2(66 + rad * Math.sin(t))] as const;
  };
  return (
    <div
      {...rest}
      role="progressbar"
      aria-label={rest['aria-labelledby'] ? undefined : label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamp(value, 0, max)}
      aria-valuetext={text}
      className={cx('ns-fx-sextant', className)}
      style={{ ...style, width, '--ns-fx-rot': `${r2(ARC_SPAN * f - ARC_SPAN / 2)}deg` } as React.CSSProperties}
    >
      <svg viewBox="0 0 120 76" aria-hidden="true" focusable="false">
        {Array.from({ length: TICKS }, (_, i) => {
          const deg = ARC_FROM + (ARC_SPAN * i) / (TICKS - 1);
          const major = i % 6 === 0;
          const [x1, y1] = pt(deg, major ? 45 : 48);
          const [x2, y2] = pt(deg, 54);
          const on = i / (TICKS - 1) <= f + 1e-9 && f > 0;
          return (
            <g key={i}>
              <line className={cx('ns-fx-sextant__tick', major && 'ns-fx-sextant__tick--major')} x1={x1} y1={y1} x2={x2} y2={y2} />
              <line className="ns-fx-sextant__lit" data-on={on || undefined} x1={x1} y1={y1} x2={x2} y2={y2} style={{ '--ns-fx-i': i } as React.CSSProperties} />
            </g>
          );
        })}
        <g className="ns-fx-sextant__arm">
          <line x1="60" y1="66" x2="60" y2="14" />
          <path d={starPath(60, 12, 3.4, 0.8)} />
        </g>
        <circle className="ns-fx-sextant__pivot" cx="60" cy="66" r="2.5" />
      </svg>
      <span className="ns-fx-sextant__readout" aria-hidden="true">{text}</span>
    </div>
  );
}
