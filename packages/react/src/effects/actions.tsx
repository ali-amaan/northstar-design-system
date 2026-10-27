'use client';
import { useEffect, useRef, useState } from 'react';
import { cx, reducedMotionNow, useTimers } from './hooks.js';
import { GOLDEN_ANGLE, r2, seeded, starPath } from './math.js';

const STAR_D = starPath(6, 6, 5.5, 1.15);

/* ------------------------------------------------------------- StarLink */

export interface StarLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** `signal` (default) uses the Glacier role; `neutral` keeps text colour and lets only the star carry the signal. */
  tone?: 'signal' | 'neutral';
  /** Opens in a new tab with `rel="noreferrer noopener"` and says so to screen readers. */
  external?: boolean;
  /** Text read after the link when `external`. Default "(opens in a new tab)". */
  externalLabel?: string;
  ref?: React.Ref<HTMLAnchorElement>;
}

/**
 * A link whose underline is traced like a meridian (a hairline drawn from the
 * left with a travelling point) while a north star twinkles into place beside
 * it on hover and keyboard focus.
 */
export function StarLink({ tone = 'signal', external, externalLabel = '(opens in a new tab)', className, children, ...rest }: StarLinkProps) {
  return (
    <a
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      {...rest}
      className={cx('ns-fx-starlink', tone === 'neutral' && 'ns-fx-starlink--neutral', className)}
    >
      <span className="ns-fx-starlink__text">
        {children}
        <span className="ns-fx-starlink__point" aria-hidden="true" />
      </span>
      <svg className="ns-fx-starlink__star" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
        <path d={STAR_D} fill="currentColor" />
      </svg>
      {external ? <span className="ns-fx-sr">{` ${externalLabel}`}</span> : null}
    </a>
  );
}

/* -------------------------------------------------- ConstellationButton */

interface Burst {
  id: number;
  x: number;
  y: number;
  pts: Array<{ x: number; y: number }>;
}

export interface ConstellationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  /** Default `pill` like every button; `rounded` opts out. */
  shape?: 'pill' | 'rounded';
  /** Seed for the star scatter. Each press advances it, so presses differ but every run repeats. */
  seed?: number;
  /** Number of stars per press (3–8). Default 5. */
  stars?: number;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * A button that, when pressed, lets a few star points out round the press
 * point, joins them with lines into a small constellation, then fades. The
 * scatter is golden-angle spaced and seeded. No burst under reduced motion.
 */
export function ConstellationButton({
  variant = 'secondary',
  size = 'md',
  shape = 'pill',
  seed = 7,
  stars = 5,
  className,
  children,
  onClick,
  type = 'button',
  ref,
  ...rest
}: ConstellationButtonProps) {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const count = useRef(0);
  const after = useTimers();
  const n = Math.min(8, Math.max(3, Math.round(stars)));

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(e);
    if (e.defaultPrevented || reducedMotionNow()) return;
    const el = e.currentTarget;
    const box = el.getBoundingClientRect();
    // Keyboard clicks report (0, 0): start from the centre instead.
    const fromPointer = e.detail > 0 && (e.clientX !== 0 || e.clientY !== 0);
    const x = fromPointer ? e.clientX - box.left : box.width / 2;
    const y = fromPointer ? e.clientY - box.top : box.height / 2;
    const rnd = seeded(seed * 7919 + count.current++);
    const turn = rnd() * 360;
    const pts = Array.from({ length: n }, (_, i) => {
      // Normalised to one turn so sorting by angle joins the stars round the press point without crossings.
      const a = (((turn + i * GOLDEN_ANGLE) % 360) * Math.PI) / 180;
      const d = 28 + rnd() * 26;
      return { a, x: r2(Math.cos(a) * d), y: r2(Math.sin(a) * d * 0.72) };
    }).sort((p, q) => p.a - q.a);
    const id = count.current;
    setBursts((b) => [...b.slice(-2), { id, x: r2(x), y: r2(y), pts }]);
    after(() => setBursts((b) => b.filter((k) => k.id !== id)), 1100);
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      onClick={handleClick}
      className={cx('ns-fx-cbutton', `ns-fx-cbutton--${variant}`, `ns-fx-size-${size}`, shape === 'rounded' && 'ns-fx-cbutton--rounded', className)}
    >
      <span className="ns-fx-cbutton__label">{children}</span>
      {bursts.map((b) => (
        <span key={b.id} className="ns-fx-burst" aria-hidden="true" style={{ '--ns-fx-x': `${b.x}px`, '--ns-fx-y': `${b.y}px` } as React.CSSProperties}>
          {b.pts.map((p, i) => {
            const q = b.pts[i + 1];
            return (
              <span key={i}>
                <i className="ns-fx-burst__pt" style={{ '--ns-fx-px': `${p.x}px`, '--ns-fx-py': `${p.y}px`, '--ns-fx-i': i } as React.CSSProperties} />
                {q ? (
                  <i
                    className="ns-fx-burst__ln"
                    style={
                      {
                        '--ns-fx-px': `${p.x}px`,
                        '--ns-fx-py': `${p.y}px`,
                        '--ns-fx-len': `${r2(Math.hypot(q.x - p.x, q.y - p.y))}px`,
                        '--ns-fx-ang': `${r2(Math.atan2(q.y - p.y, q.x - p.x))}rad`,
                        '--ns-fx-i': i,
                      } as React.CSSProperties
                    }
                  />
                ) : null}
              </span>
            );
          })}
        </span>
      ))}
    </button>
  );
}

/* ------------------------------------------------------------- KbdKeycap */

export interface KbdKeycapProps extends React.HTMLAttributes<HTMLElement> {
  /** Shows the key held down. */
  pressed?: boolean;
  /** A `KeyboardEvent.key` value (case-insensitive); the cap presses while that key is held anywhere on the page. */
  listen?: string;
  ref?: React.Ref<HTMLElement>;
}

/** A keycap with physical depth: it sits on a ledge and sinks when pressed. */
export function KbdKeycap({ pressed, listen, className, children, ...rest }: KbdKeycapProps) {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!listen) return;
    const key = listen.toLowerCase();
    const down = (e: KeyboardEvent) => e.key.toLowerCase() === key && setHeld(true);
    const up = (e: KeyboardEvent) => e.key.toLowerCase() === key && setHeld(false);
    const blur = () => setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [listen]);
  const on = pressed ?? held;
  return (
    <kbd {...rest} className={cx('ns-fx-keycap', className)} data-pressed={on || undefined}>
      <span className="ns-fx-keycap__top">{children}</span>
    </kbd>
  );
}
