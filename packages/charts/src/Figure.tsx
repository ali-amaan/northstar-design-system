import type { HTMLAttributes, ReactNode } from 'react';
import type { ClaimClass, FigureValue } from '@northstar-js/contracts';
import { formatBand, formatPercent } from './format.js';
import { v } from './tokens.js';

export const CLAIM_LABEL: Record<ClaimClass, string> = { level: 'Level', direction: 'Direction', ranking: 'Ranking' };

export interface FigureProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** The share, 0-1. */
  value: number;
  /** Error band in percentage points. Optional. */
  band?: number;
  /** Claim class label. Optional. */
  claim?: ClaimClass;
  /** Qualifying sentence. Optional. */
  caption?: ReactNode;
  state?: FigureValue['state'];
  /** Short label above the number. */
  label?: ReactNode;
  locale?: string;
  digits?: number;
  size?: 'sm' | 'md' | 'lg';
  /** Overrides the formatted number. */
  format?: (value: number) => string;
}

const SIZE = { sm: 18, md: 32, lg: 48 } as const;

/** One displayed figure: the number, with its band, claim class and caption when given. */
export function Figure({
  value, band, claim, caption, state = 'ok', label, locale = 'en', digits = 0, size = 'md', format, style, ...rest
}: FigureProps) {
  const withheld = state === 'withheld';
  const stale = state === 'stale';
  const text = withheld ? 'Withheld' : format ? format(value) : formatPercent(value, { locale, digits });
  return (
    <figure
      data-part="figure"
      data-state={state}
      {...(claim ? { 'data-claim': claim } : {})}
      style={{
        margin: 0, display: 'grid', gap: 4, fontFamily: v.sans, color: v.text1,
        ...(stale ? { border: `1px dashed ${v.line2}`, padding: 8, borderRadius: 6 } : {}),
        ...style,
      }}
      {...rest}
    >
      {(label !== undefined || claim || stale) && (
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: v.text2 }}>
          {label !== undefined && <span data-part="label">{label}</span>}
          {claim && <span data-part="claim">{CLAIM_LABEL[claim]}</span>}
          {stale && <span data-part="stale">Stale</span>}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          data-part="value"
          style={{ fontFamily: v.mono, fontVariantNumeric: 'tabular-nums', fontSize: withheld ? 15 : SIZE[size], lineHeight: 1.1, color: withheld ? v.text3 : v.text1 }}
        >
          {text}
        </span>
        {band !== undefined && !withheld && (
          <span data-part="band" style={{ fontFamily: v.mono, fontSize: 13, color: v.text2 }}>
            {formatBand(band, { locale })}
          </span>
        )}
      </div>
      {caption !== undefined && (
        <figcaption data-part="caption" style={{ fontSize: 12, color: v.text2 }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
