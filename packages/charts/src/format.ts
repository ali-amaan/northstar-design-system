/**
 * Number formatting for figures. Locale-aware through Intl; English ('en') is the default.
 * Shares are fractions (0.42); points and bands are percentage points (6 -> "6 pp").
 */
export interface FormatOptions {
  locale?: string;
  /** Fraction digits. Default 0. */
  digits?: number;
}

const cache = new Map<string, Intl.NumberFormat>();
function nf(locale: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, opts);
    cache.set(key, f);
  }
  return f;
}

const MINUS = '−';
const NBSP = ' ';

/** A share (0-1) as a percentage: 0.42 -> "42%". */
export function formatPercent(share: number, { locale = 'en', digits = 0 }: FormatOptions = {}): string {
  if (!Number.isFinite(share)) return '–';
  return nf(locale, { style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits })
    .format(share)
    .replace('-', MINUS);
}

/** Percentage points: 6 -> "6 pp"; with `sign`, 1.5 -> "+1.5 pp". */
export function formatPoints(
  pp: number,
  { locale = 'en', digits = 0, sign = false }: FormatOptions & { sign?: boolean } = {},
): string {
  if (!Number.isFinite(pp)) return '–';
  const s = nf(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: sign ? 'exceptZero' : 'auto',
  })
    .format(pp)
    .replace('-', MINUS);
  return `${s}${NBSP}pp`;
}

/** A band in percentage points: 6 -> "± 6 pp". */
export function formatBand(pp: number, opts: FormatOptions = {}): string {
  return `±${NBSP}${formatPoints(Math.abs(pp), opts)}`;
}

/** A plain count: 1200 -> "1,200". */
export function formatNumber(n: number, { locale = 'en', digits = 0 }: FormatOptions = {}): string {
  if (!Number.isFinite(n)) return '–';
  return nf(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n).replace('-', MINUS);
}
