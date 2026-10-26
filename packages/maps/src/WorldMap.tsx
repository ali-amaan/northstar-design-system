import type { SVGProps } from 'react';
import { MARKET_STATUS, type MarketStatus as MarketStatusValue, type MarketStatusEntry } from '@northstar-js/contracts';
import { FEATURES, WORLD_VIEWBOX } from './generated/meta.js';
import { WORLD_PATHS } from './generated/world.js';
import { STAR_PATH, STATUS_LABEL } from './status.js';
import { C } from './color.js';

export type WorldMarks = readonly MarketStatusEntry[] | Readonly<Record<string, MarketStatusValue>>;

export interface WorldMapProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Status marks to draw. Default: every non-'none' entry of contracts' MARKET_STATUS. */
  marks?: WorldMarks;
  /** Feature key to highlight, or null. */
  selected?: string | null;
  width?: number;
  title?: string;
}

const DEFAULT_MARKS: readonly MarketStatusEntry[] = Object.values(MARKET_STATUS);

function toEntries(marks: WorldMarks): MarketStatusEntry[] {
  if (Array.isArray(marks)) return [...(marks as readonly MarketStatusEntry[])];
  return Object.entries(marks as Record<string, MarketStatusValue>).map(([code, status]) => ({ code, status }));
}

/** The world on Equal Earth: every Natural Earth feature as an even-odd outline, status marks on top. */
export function WorldMap({ marks = DEFAULT_MARKS, selected = null, width = 960, title = 'World map', ...rest }: WorldMapProps) {
  const [, , vw = 1000, vh = 500] = WORLD_VIEWBOX.split(' ').map(Number);
  const height = Math.round((width * vh) / vw);
  const sel = selected?.toUpperCase() ?? null;
  const entries = toEntries(marks).filter((m) => m.status !== 'none');
  const byKey = new Map(FEATURES.map((f) => [f.key.toUpperCase(), f]));
  const r = 7 * (vw / width) * 1.4;
  const selName = sel ? byKey.get(sel)?.name : undefined;
  return (
    <svg
      width={width}
      height={height}
      viewBox={WORLD_VIEWBOX}
      role="img"
      aria-label={`${title}${selName ? `, ${selName} selected` : ''}. ${entries.map((m) => `${byKey.get(m.code.toUpperCase())?.name ?? m.code}: ${STATUS_LABEL[m.status]}`).join('; ')}`}
      data-part="world-map"
      {...rest}
    >
      <g data-part="land" fillRule="evenodd" strokeLinejoin="round">
        {FEATURES.map((f) => {
          const d = WORLD_PATHS[f.key];
          if (!d) return null;
          const on = f.key.toUpperCase() === sel;
          return (
            <path
              key={f.key}
              d={d}
              data-key={f.key}
              {...(on ? { 'data-selected': 'true' } : {})}
              fill={on ? C.signalWash : C.surface2}
              stroke={on ? C.signal : C.line2}
              strokeWidth={on ? 1.2 : 0.5}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </g>
      <g data-part="marks">
        {entries.map((m) => {
          const at = byKey.get(m.code.toUpperCase())?.at;
          if (!at) return null;
          const [x, y] = at;
          const s = r / 8;
          return m.status === 'registered' ? (
            <circle key={m.code} data-mark="ring" data-key={m.code} cx={x} cy={y} r={r * 0.65} fill="none" stroke={C.text2} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ) : (
            <path key={m.code} data-mark="star" data-key={m.code} d={STAR_PATH} transform={`translate(${x - 8 * s} ${y - 8 * s}) scale(${s})`} fill={C.signal} />
          );
        })}
      </g>
    </svg>
  );
}
