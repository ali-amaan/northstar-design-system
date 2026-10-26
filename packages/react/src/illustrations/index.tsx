import { useId, type SVGProps } from 'react';
import { SPOTS, STATUS_MARKS } from './data.js';
import type { IllustrationLayers } from './types.js';

export type { IllustrationLayers } from './types.js';

const MUTED = 'var(--ns-color-text-3)';
const INK = 'var(--ns-color-text-1)';
const SIGNAL = 'var(--ns-color-signal)';

export interface IllustrationProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'ref'> {
  /** Accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

function Layers({ l, cx, cy }: { l: IllustrationLayers; cx: number; cy: number }) {
  const stroke = (d: string | undefined, color: string, w = 1, extra: SVGProps<SVGPathElement> = {}) =>
    d ? <path d={d} fill="none" stroke={color} strokeWidth={w} {...extra} /> : null;
  const fill = (d: string | undefined, color: string, extra: SVGProps<SVGPathElement> = {}) => (d ? <path d={d} fill={color} {...extra} /> : null);
  return (
    <>
      {stroke(l.faint, MUTED, 1, { strokeOpacity: 0.28 })}
      {fill(l.knock, 'var(--ns-color-ground)')}
      {stroke(l.grid, MUTED, 1, { strokeOpacity: 0.6 })}
      {fill(l.washM, MUTED, { fillOpacity: 0.14 })}
      {fill(l.wash, SIGNAL, { fillOpacity: 0.14 })}
      {stroke(l.hair, MUTED)}
      {stroke(l.dash, MUTED, 1, { strokeDasharray: '2 3' })}
      {stroke(l.inkHair, INK, 1, { strokeOpacity: 0.5 })}
      {stroke(l.ink1, INK)}
      {stroke(l.ink15, INK, 1.5)}
      {fill(l.dim, MUTED)}
      {l.rings?.map((r, i) => (
        <g
          key={i}
          className="ns-illustration__orbit"
          style={{ transformOrigin: `${cx}px ${cy}px`, animationDuration: `${r.s}s`, animationDirection: r.dir < 0 ? 'reverse' : 'normal' }}
        >
          <path d={r.d} fill={INK} />
        </g>
      ))}
      {fill(l.ink, INK)}
      {stroke(l.acc15, SIGNAL, 1.5)}
      {fill(l.acc, SIGNAL)}
      {l.labels?.map((t, i) => (
        <text key={i} x={t.x} y={t.y} textAnchor={t.a as 'start' | 'middle' | 'end'} fill={MUTED} fontSize={10} fontFamily="var(--ns-font-family-mono)">
          {t.t}
        </text>
      ))}
    </>
  );
}

function makeIllustration(layers: IllustrationLayers, w: number, h: number, cx: number, cy: number, display: string) {
  function Illustration({ title, className, ...rest }: IllustrationProps) {
    const id = useId();
    const a11y = title ? { role: 'img' as const, 'aria-labelledby': id } : { 'aria-hidden': true as const };
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        focusable="false"
        {...a11y}
        {...rest}
        className={['ns-illustration', className].filter(Boolean).join(' ')}
      >
        {title ? <title id={id}>{title}</title> : null}
        <Layers l={layers} cx={cx} cy={cy} />
      </svg>
    );
  }
  Illustration.displayName = display;
  return Illustration;
}

/* Spot illustrations: 240 x 160, horizon y 112, meridian x 120. */
export const EmptyBrief = makeIllustration(SPOTS.brief, 240, 160, 120, 56, 'EmptyBrief');
export const EmptyPopulation = makeIllustration(SPOTS.population, 240, 160, 120, 56, 'EmptyPopulation');
export const EmptyResearch = makeIllustration(SPOTS.research, 240, 160, 120, 56, 'EmptyResearch');
export const EmptyResponses = makeIllustration(SPOTS.responses, 240, 160, 120, 56, 'EmptyResponses');
export const EmptySearch = makeIllustration(SPOTS.search, 240, 160, 120, 56, 'EmptySearch');
export const ErrorOffline = makeIllustration(SPOTS.offline, 240, 160, 120, 56, 'ErrorOffline');
export const ErrorNotFound = makeIllustration(SPOTS.notFound, 240, 160, 120, 56, 'ErrorNotFound');

/* Run-status marks: 112 x 96; the four differ in shape, never in hue. */
export const StatusRunning = makeIllustration(STATUS_MARKS.running, 112, 96, 56, 52, 'StatusRunning');
export const StatusComplete = makeIllustration(STATUS_MARKS.complete, 112, 96, 56, 52, 'StatusComplete');
export const StatusCheckFailed = makeIllustration(STATUS_MARKS.checkFailed, 112, 96, 56, 52, 'StatusCheckFailed');
export const StatusSaved = makeIllustration(STATUS_MARKS.saved, 112, 96, 56, 52, 'StatusSaved');

export const spotIllustrations = {
  brief: EmptyBrief,
  population: EmptyPopulation,
  research: EmptyResearch,
  responses: EmptyResponses,
  search: EmptySearch,
  offline: ErrorOffline,
  notFound: ErrorNotFound,
} as const;
export type SpotName = keyof typeof spotIllustrations;

export const statusIllustrations = {
  running: StatusRunning,
  complete: StatusComplete,
  checkFailed: StatusCheckFailed,
  saved: StatusSaved,
} as const;

const NORTH = 'M10 2L11.48 8.52L18 10L11.48 11.48L10 18L8.52 11.48L2 10L8.52 8.52Z';

export interface NorthstarLockupProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number;
  /** Mark only, with the name kept for assistive technology. */
  markOnly?: boolean;
  /** Defaults to "Northstar". */
  label?: string;
}

/** The north mark in Glacier beside the Northstar wordmark. */
export function NorthstarLockup({ size = 24, markOnly = false, label = 'Northstar', className, style, ...rest }: NorthstarLockupProps) {
  return (
    <span
      {...rest}
      className={['ns-lockup', className].filter(Boolean).join(' ')}
      style={{ fontSize: size, ...style }}
      {...(markOnly ? { role: 'img', 'aria-label': label } : {})}
    >
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d={NORTH} fill={SIGNAL} />
      </svg>
      {markOnly ? null : <span className="ns-lockup__word">{label}</span>}
    </span>
  );
}
