import type { MarketStatus } from '@northstar-js/contracts';

export interface MapFeatureMeta {
  /** ISO 3166-1 alpha-2 code, XK for Kosovo, or a Natural Earth slug for features without a code. */
  key: string;
  a2: string | null;
  /** English short name (CLDR). */
  name: string;
  /** Status as baked into the map files at build time. */
  status: MarketStatus;
  statusLabel: string;
  tier: 'standard' | 'small' | 'micro';
  coveredBy?: string;
  /** Position of the largest part on the world map (WORLD_VIEWBOX units). */
  at: [number, number] | null;
}

export type ColorRole = 'text1' | 'text2' | 'text3' | 'signal';

export interface MapLayer {
  d: string;
  role: ColorRole;
  kind: 'stroke' | 'fill';
  opacity?: number;
  width?: number;
}

export interface CountryMapData {
  key: string;
  viewBox: string;
  /** Accessible description of the map, including its market status. */
  label: string;
  layers: MapLayer[];
}
