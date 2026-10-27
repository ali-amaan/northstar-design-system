'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cx, reducedMotionNow, useControllable, useTimers } from './hooks.js';
import { PRIMES, r2, seeded, starPath } from './math.js';

const STAR = starPath(6, 6, 5.5, 1.2);
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/* ---------------------------------------------------------- RollingNumber */

export interface RollingNumberProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number;
  /** BCP 47 locale for formatting. Default "en-US". */
  locale?: string;
  format?: Intl.NumberFormatOptions;
  /** Announce changes politely to screen readers. Default false. */
  live?: boolean;
}

/**
 * An odometer: each digit is a reel of 0–9 that rolls to its figure, the
 * units first and each higher place a beat later. Plex Mono, tabular. The
 * full value is in the text for assistive technology; the reels are hidden.
 */
export function RollingNumber({ value, locale = 'en-US', format, live = false, className, ...rest }: RollingNumberProps) {
  const text = useMemo(() => new Intl.NumberFormat(locale, format).format(value), [value, locale, format]);
  const chars = [...text];
  let place = 0;
  const cells = chars
    .map((ch, i) => ({ ch, i }))
    .reverse()
    .map(({ ch, i }) => {
      const d = DIGITS.indexOf(ch);
      const key = d >= 0 ? `d${place}` : `s${chars.length - i}`;
      const node =
        d >= 0 ? (
          <span key={key} className="ns-fx-roll__col">
            <span className="ns-fx-roll__reel" style={{ '--ns-fx-d': d, '--ns-fx-place': place } as React.CSSProperties}>
              {DIGITS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={key} className="ns-fx-roll__sym">
            {ch}
          </span>
        );
      if (d >= 0) place++;
      return node;
    })
    .reverse();
  return (
    <span {...rest} className={cx('ns-fx-roll', className)} aria-live={live ? 'polite' : undefined} aria-atomic={live || undefined}>
      <span className="ns-fx-roll__reels" aria-hidden="true">
        {cells}
      </span>
      <span className="ns-fx-sr">{text}</span>
    </span>
  );
}

export interface CountUpProps extends RollingNumberProps {
  /** Starting figure shown on first paint. Default 0. */
  from?: number;
}

/** A RollingNumber that starts at `from` and rolls up to `value` after mount (immediately under reduced motion). */
export function CountUp({ value, from = 0, ...rest }: CountUpProps) {
  const [shown, setShown] = useState(from);
  useEffect(() => {
    if (reducedMotionNow()) return setShown(value);
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <RollingNumber {...rest} value={shown} />;
}

/* ---------------------------------------------------------- HorizonDivider */

export interface HorizonDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text in the middle of the rule. */
  label?: React.ReactNode;
  /** Draws the rule out from the centre once, on mount. Default true. */
  rise?: boolean;
}

/** A hairline with a Glacier glow at its centre, the way the sky brightens at the horizon before sunrise, and a single star above the midpoint. */
export function HorizonDivider({ label, rise = true, className, ...rest }: HorizonDividerProps) {
  return (
    <div {...rest} role="separator" aria-orientation="horizontal" className={cx('ns-fx-horizon', rise && 'ns-fx-horizon--rise', label ? 'ns-fx-horizon--label' : null, className)}>
      <span className="ns-fx-horizon__line" aria-hidden="true" />
      {label ? (
        <span className="ns-fx-horizon__label">{label}</span>
      ) : (
        <svg className="ns-fx-horizon__star" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d={STAR} />
        </svg>
      )}
      <span className="ns-fx-horizon__line ns-fx-horizon__line--end" aria-hidden="true" />
    </div>
  );
}

/* ------------------------------------------------------ StarfieldEmptyState */

export interface StarfieldEmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Number of background stars. Default 64. */
  stars?: number;
  seed?: number;
  headingLevel?: 2 | 3 | 4;
}

const PHI_INV = 0.6180339887498949;

/**
 * An empty state set on a calm field of stars. The stars sit on a golden
 * (Fibonacci) lattice, so they spread evenly without clumping; three depth
 * layers drift on prime-length periods and a few stars twinkle. Seeded, so
 * every render is the same sky. Still under reduced motion.
 */
export function StarfieldEmptyState({ title, description, action, stars = 64, seed = 11, headingLevel = 3, className, ...rest }: StarfieldEmptyStateProps) {
  const field = useMemo(() => {
    const rnd = seeded(seed);
    return Array.from({ length: stars }, (_, i) => {
      const x = ((i * PHI_INV + rnd() * 0.04) % 1) * 400;
      const y = ((i + 0.5) / stars) * 220;
      const m = rnd();
      return { x: r2(x), y: r2(y), r: r2(m > 0.93 ? 1.5 : m > 0.7 ? 1 : 0.6), o: r2(0.35 + m * 0.6), layer: i % 3, twinkle: i % 7 === 3, t: PRIMES[(i % 5) + 2] ?? 5 };
    });
  }, [stars, seed]);
  // A small constellation in the upper-right corner, clear of the text: the five brightest stars there, joined in order of height.
  const bright = useMemo(
    () =>
      field
        .filter((s) => s.x > 290 && s.y < 150)
        .sort((a, b) => b.r - a.r || b.o - a.o)
        .slice(0, 5)
        .sort((a, b) => a.y - b.y),
    [field],
  );
  const H = `h${headingLevel}` as 'h3';
  const titleId = useId();
  return (
    <div {...rest} className={cx('ns-fx-starfield', className)} role="group" aria-labelledby={titleId}>
      <svg className="ns-fx-starfield__sky" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <polyline className="ns-fx-starfield__lines" points={bright.map((s) => `${s.x},${s.y}`).join(' ')} />
        {[0, 1, 2].map((layer) => (
          <g key={layer} className={`ns-fx-starfield__layer ns-fx-starfield__layer--${layer}`}>
            {field
              .filter((s) => s.layer === layer)
              .map((s, i) => (
                <circle
                  key={i}
                  className={cx('ns-fx-starfield__star', s.twinkle && 'ns-fx-starfield__star--twinkle')}
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  style={{ opacity: s.o, '--ns-fx-t': `${s.t}s` } as React.CSSProperties}
                />
              ))}
          </g>
        ))}
      </svg>
      <div className="ns-fx-starfield__body">
        <svg className="ns-fx-starfield__north" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d={STAR} />
        </svg>
        <H id={titleId} className="ns-fx-starfield__title">
          {title}
        </H>
        {description ? <p className="ns-fx-starfield__desc">{description}</p> : null}
        {action ? <div className="ns-fx-starfield__action">{action}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ OrbitAvatar */

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export interface OrbitAvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Full name; used for initials and the accessible name. */
  name: string;
  size?: 24 | 32 | 40 | 48;
}

/** An initials avatar with an orbit ring; on hover or focus of the avatar (or a parent with `.ns-fx-orbit-host`) a moon makes one turn. */
export function OrbitAvatar({ name, size = 32, className, style, ...rest }: OrbitAvatarProps) {
  return (
    <span {...rest} role="img" aria-label={name} className={cx('ns-fx-oavatar', className)} style={{ ...style, '--ns-fx-s': `${size}px` } as React.CSSProperties}>
      <span className="ns-fx-oavatar__face" aria-hidden="true">
        {initialsOf(name)}
      </span>
      <svg className="ns-fx-oavatar__orbit" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle className="ns-fx-oavatar__ring" cx="20" cy="20" r="19" />
        <g className="ns-fx-oavatar__arm">
          <circle className="ns-fx-oavatar__moon" cx="20" cy="1" r="1.8" />
        </g>
      </svg>
    </span>
  );
}

/* --------------------------------------------------------------- TagOrbit */

export interface TagOrbitProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  label: string;
  /** Called after the star has faded out (at once under reduced motion). Omit for a tag that cannot be removed. */
  onRemove?: () => void;
  removeLabel?: (label: string) => string;
}

/** A tag led by a small star; removing it lets the star fade out and the tag fold away before `onRemove` fires. */
export function TagOrbit({ label, onRemove, removeLabel = (l) => `Remove ${l}`, className, ...rest }: TagOrbitProps) {
  const [leaving, setLeaving] = useState(false);
  const after = useTimers();
  return (
    <span {...rest} className={cx('ns-fx-tag', className)} data-leaving={leaving || undefined}>
      <svg className="ns-fx-tag__star" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d={STAR} />
      </svg>
      <span className="ns-fx-tag__label">{label}</span>
      {onRemove ? (
        <button
          type="button"
          className="ns-fx-tag__remove"
          aria-label={removeLabel(label)}
          disabled={leaving}
          onClick={() => {
            if (reducedMotionNow()) return onRemove();
            setLeaving(true);
            after(onRemove, 360);
          }}
        >
          <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
            <path d="M3 3 9 9M9 3 3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------- SineDisclosure / Accordion */

export interface SineDisclosureProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  headingLevel?: 2 | 3 | 4 | 5;
  disabled?: boolean;
}

/**
 * A disclosure whose content arrives on a sine ease (the curve is exactly half
 * a cosine): each block fades and rises a few pixels, staggered by a quarter
 * period. The marker is a small meridian that turns a quarter as it opens.
 */
export function SineDisclosure({ title, open, defaultOpen = false, onOpenChange, headingLevel = 3, disabled, className, children, ...rest }: SineDisclosureProps) {
  const id = useId();
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const H = `h${headingLevel}` as 'h3';
  return (
    <div {...rest} className={cx('ns-fx-sine', className)} data-state={isOpen ? 'open' : 'closed'}>
      <H className="ns-fx-sine__heading">
        <button
          type="button"
          id={`${id}-h`}
          className="ns-fx-sine__trigger"
          aria-expanded={isOpen}
          aria-controls={`${id}-p`}
          disabled={disabled}
          onClick={() => setOpen(!isOpen)}
        >
          <span className="ns-fx-sine__title">{title}</span>
          <svg className="ns-fx-sine__mark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="6" />
            <ellipse className="ns-fx-sine__meridian" cx="8" cy="8" rx="2.6" ry="6" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
        </button>
      </H>
      <div id={`${id}-p`} role="region" aria-labelledby={`${id}-h`} className="ns-fx-sine__panel" hidden={!isOpen}>
        <div className="ns-fx-sine__inner">{children}</div>
      </div>
    </div>
  );
}

export interface SineAccordionItem {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface SineAccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  items: SineAccordionItem[];
  /** `single` keeps at most one item open. Default `single`. */
  type?: 'single' | 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  headingLevel?: 2 | 3 | 4 | 5;
}

/** A set of SineDisclosures. Up/Down, Home and End move between headers. */
export function SineAccordion({ items, type = 'single', value, defaultValue = [], onValueChange, headingLevel = 3, className, ...rest }: SineAccordionProps) {
  const [openSet, setOpenSet] = useControllable(value, defaultValue, onValueChange);
  const root = useRef<HTMLDivElement>(null);
  function onKeyDown(e: React.KeyboardEvent) {
    const triggers = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('.ns-fx-sine__trigger:not(:disabled)') ?? []);
    const i = triggers.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    let n = -1;
    if (e.key === 'ArrowDown') n = (i + 1) % triggers.length;
    else if (e.key === 'ArrowUp') n = (i - 1 + triggers.length) % triggers.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = triggers.length - 1;
    if (n < 0) return;
    e.preventDefault();
    triggers[n]?.focus();
  }
  return (
    <div {...rest} ref={root} className={cx('ns-fx-accordion', className)} onKeyDown={onKeyDown}>
      {items.map((item) => (
        <SineDisclosure
          key={item.value}
          title={item.title}
          headingLevel={headingLevel}
          {...(item.disabled ? { disabled: true } : null)}
          open={openSet.includes(item.value)}
          onOpenChange={(o) => {
            if (type === 'single') setOpenSet(o ? [item.value] : []);
            else setOpenSet(o ? [...openSet, item.value] : openSet.filter((v) => v !== item.value));
          }}
        >
          {item.content}
        </SineDisclosure>
      ))}
    </div>
  );
}
