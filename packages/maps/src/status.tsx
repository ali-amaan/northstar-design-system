import type { HTMLAttributes, SVGProps } from 'react';
import { marketStatus, type MarketStatus as MarketStatusValue } from '@northstar-js/contracts';
import { FEATURES } from './generated/meta.js';
import type { MapFeatureMeta } from './types.js';
import { C } from './color.js';

export const STATUS_LABEL: Record<MarketStatusValue, string> = {
  'roster-ready': 'Roster-ready',
  covered: 'Covered by a roster',
  registered: 'Registered · not calibrated',
  none: 'Not available',
};

const BY_KEY = new Map<string, MapFeatureMeta>(FEATURES.map((f) => [f.key.toUpperCase(), f]));

/** Map metadata for a feature key (ISO alpha-2, XK, or a Natural Earth slug), case-insensitive. */
export function featureMeta(code: string): MapFeatureMeta | undefined {
  return BY_KEY.get(code.trim().toUpperCase());
}

/** English name of a feature, or the code itself when unknown. */
export function countryName(code: string): string {
  return featureMeta(code)?.name ?? code.toUpperCase();
}

/** Status label for a code, from contracts' marketStatus. */
export function statusLabel(code: string): string {
  const e = marketStatus(code);
  return e.status === 'covered' && e.coveredBy ? `Covered by ${e.coveredBy} roster` : STATUS_LABEL[e.status];
}

/** North star (filled, four points) and ring (hollow) paths in a 16 × 16 box. */
export const STAR_PATH = 'M8 0.5L9.6 6.4L15.5 8L9.6 9.6L8 15.5L6.4 9.6L0.5 8L6.4 6.4Z';

export type StatusGlyphProps = { status: MarketStatusValue; size?: number } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>;

/**
 * The shape-coded status mark: filled north star for roster-ready (and covered), a hollow ring for registered,
 * nothing for not available. Shape tells the status apart; the signal colour is not the only cue.
 */
export function StatusGlyph({ status, size = 16, ...rest }: StatusGlyphProps) {
  if (status === 'none') return null;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" data-mark={status === 'registered' ? 'ring' : 'star'} {...rest}>
      {status === 'registered' ? (
        <circle cx={8} cy={8} r={5.5} fill="none" stroke={C.text2} strokeWidth={1.5} />
      ) : (
        <path d={STAR_PATH} fill={C.signal} />
      )}
    </svg>
  );
}

export interface MarketStatusProps extends HTMLAttributes<HTMLSpanElement> {
  /** Market code, e.g. 'FI'. */
  code: string;
  /** mark: the glyph alone · row: glyph, name and label · label: the words only. Default 'row'. */
  variant?: 'mark' | 'row' | 'label';
  size?: number;
}

/** Market status for a code, read from @northstar-js/contracts. */
export function MarketStatus({ code, variant = 'row', size = 16, style, ...rest }: MarketStatusProps) {
  const entry = marketStatus(code);
  const name = countryName(entry.code);
  const label = statusLabel(entry.code);
  const common = { 'data-part': 'market-status', 'data-status': entry.status, 'data-variant': variant, ...rest };
  if (variant === 'mark') {
    return (
      <span role="img" aria-label={`${name}: ${label}`} {...common} style={{ display: 'inline-flex', width: size, height: size, ...style }}>
        <StatusGlyph status={entry.status} size={size} />
      </span>
    );
  }
  if (variant === 'label') {
    return (
      <span {...common} style={{ color: C.text2, fontSize: 12, ...style }}>
        {label}
      </span>
    );
  }
  return (
    <span
      {...common}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text1, fontFamily: 'var(--ns-font-sans, Inter, system-ui, sans-serif)', ...style }}
    >
      <span style={{ display: 'inline-flex', width: size, height: size }}>
        <StatusGlyph status={entry.status} size={size} />
      </span>
      <span data-part="name">{name}</span>
      <span data-part="label" style={{ color: C.text2, fontSize: 12 }}>
        {label}
      </span>
    </span>
  );
}
