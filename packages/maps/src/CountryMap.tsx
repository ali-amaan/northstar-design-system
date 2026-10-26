'use client';
import { useEffect, useState, type SVGProps } from 'react';
import { COUNTRY_LOADERS, MARK_LOADERS } from './generated/loaders.js';
import { countryName, featureMeta } from './status.js';
import type { ColorRole, CountryMapData } from './types.js';
import { C } from './color.js';

const COLOR: Record<ColorRole, string> = {
  text1: C.text1,
  text2: C.text2,
  text3: C.text3,
  signal: C.signal,
};

/** Load one country's map data. Each country is its own chunk. */
export async function loadCountryMap(code: string): Promise<CountryMapData | null> {
  const key = featureMeta(code)?.key;
  const load = key ? COUNTRY_LOADERS[key] : undefined;
  return load ? (await load()).default : null;
}

/** Load one country's outline mark path (48 × 48 box). */
export async function loadCountryMark(code: string): Promise<{ d: string; viewBox: string } | null> {
  const key = featureMeta(code)?.key;
  const load = key ? MARK_LOADERS[key] : undefined;
  if (!load) return null;
  const m = await load();
  return { d: m.default, viewBox: m.viewBox };
}

function useLoaded<T>(code: string, given: T | undefined, load: (c: string) => Promise<T | null>): T | null {
  const [state, setState] = useState<{ code: string; data: T | null } | null>(null);
  useEffect(() => {
    if (given !== undefined) return;
    let live = true;
    load(code).then(
      (data) => { if (live) setState({ code, data }); },
      () => { if (live) setState({ code, data: null }); },
    );
    return () => { live = false; };
  }, [code, given, load]);
  if (given !== undefined) return given;
  return state && state.code === code ? state.data : null;
}

export const COUNTRY_MAP_SIZE = { thumb: 96, card: 256, full: 512 } as const;

export interface CountryMapProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Feature key: ISO alpha-2, XK, or a Natural Earth slug. */
  code: string;
  size?: keyof typeof COUNTRY_MAP_SIZE | number;
  /** Preloaded data (from loadCountryMap) to render without a client fetch, e.g. on the server. */
  data?: CountryMapData;
}

/** One country as a star field on Lambert azimuthal equal-area, with its status mark. Loads its data lazily. */
export function CountryMap({ code, size = 'card', data, ...rest }: CountryMapProps) {
  const px = typeof size === 'number' ? size : COUNTRY_MAP_SIZE[size];
  const map = useLoaded(code, data, loadCountryMap);
  const name = countryName(code);
  if (!map) {
    return <svg width={px} height={px} viewBox="0 0 512 512" role="img" aria-label={name} aria-busy="true" data-part="country-map" data-key={code} {...rest} />;
  }
  return (
    <svg width={px} height={px} viewBox={map.viewBox} role="img" aria-label={map.label} data-part="country-map" data-key={map.key} overflow="hidden" {...rest}>
      <title>{name}</title>
      {map.layers.map((l, i) =>
        l.kind === 'stroke' ? (
          <path key={i} d={l.d} fill="none" stroke={COLOR[l.role]} strokeOpacity={l.opacity} strokeWidth={l.width ?? 1} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ) : (
          <path key={i} d={l.d} fill={COLOR[l.role]} fillOpacity={l.opacity} fillRule="evenodd" />
        ),
      )}
    </svg>
  );
}

export interface CountryMarkProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  code: string;
  size?: number;
  /** Preloaded mark (from loadCountryMark). */
  data?: { d: string; viewBox: string };
}

/** A country's outline as an icon-weight mark, drawn in currentColor. Loads lazily. */
export function CountryMark({ code, size = 24, data, ...rest }: CountryMarkProps) {
  const mark = useLoaded(code, data, loadCountryMark);
  const name = countryName(code);
  return (
    <svg
      width={size}
      height={size}
      viewBox={mark?.viewBox ?? '0 0 48 48'}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      role="img"
      aria-label={name}
      data-part="country-mark"
      data-key={code}
      {...(mark ? {} : { 'aria-busy': true })}
      {...rest}
    >
      {mark && <path d={mark.d} fillRule="evenodd" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
