import type { SVGProps } from 'react';
import type { ClaimClass } from '@northstar-js/contracts';
import { Axis } from './Axis.js';
import { CLAIM_LABEL } from './Figure.js';
import { formatBand, formatPercent } from './format.js';
import { MeasuredNode } from './marks.js';
import { v } from './tokens.js';

interface Base extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  width?: number;
  locale?: string;
}
export interface LevelInstrument extends Base {
  claim: 'level';
  /** Share 0-1. */
  value: number;
  /** Band in percentage points. Optional. */
  band?: number;
}
export interface DirectionInstrument extends Base {
  claim: 'direction';
  /** -1 left of the meridian, 0 on it, 1 right of it. */
  direction: -1 | 0 | 1;
}
export interface RankingInstrument extends Base {
  claim: 'ranking';
  /** 1-based rank. */
  rank: number;
  of: number;
}
export type ClaimInstrumentProps = LevelInstrument | DirectionInstrument | RankingInstrument;

/**
 * The claim instrument: one glyph per claim class. Level is a node with a capped band on a 0-100 axis,
 * direction a gauge needle on a detent (no number), ranking a position on a ladder (no value).
 */
export function ClaimInstrument(props: ClaimInstrumentProps) {
  const claim: ClaimClass = props.claim;
  if (props.claim === 'level') {
    const { value, band, width = 290, locale = 'en', claim: _c, ...rest } = props;
    const L = width - 20, x0 = 10, y = 22;
    const px = (pct: number) => x0 + (Math.max(0, Math.min(100, pct)) / 100) * L;
    const pct = value * 100;
    const aria = `${CLAIM_LABEL[claim]}: ${formatPercent(value, { locale })}${band !== undefined ? ` ${formatBand(band, { locale })}` : ''}`;
    return (
      <svg width={width} height={44} viewBox={`0 0 ${width} 44`} role="img" aria-label={aria} data-part="claim-instrument" data-claim={claim} {...rest}>
        <Axis length={L} x={x0} y={y} meridian={50} showLabels={false} />
        {band !== undefined && (
          <g data-part="band" stroke={v.signalEdge} strokeWidth={1.5}>
            <line x1={px(pct - band)} x2={px(pct + band)} y1={y} y2={y} />
            <line x1={px(pct - band)} x2={px(pct - band)} y1={y - 4} y2={y + 4} />
            <line x1={px(pct + band)} x2={px(pct + band)} y1={y - 4} y2={y + 4} />
          </g>
        )}
        <MeasuredNode cx={px(pct)} cy={y} />
      </svg>
    );
  }
  if (props.claim === 'direction') {
    const { direction, width = 96, claim: _c, locale: _l, ...rest } = props;
    const cx = width / 2, cy = 44, r = 36;
    const ang = (-90 + direction * 50) * (Math.PI / 180);
    const words = { '-1': 'left of the meridian', '0': 'on the meridian', '1': 'right of the meridian' } as const;
    return (
      <svg width={width} height={48} viewBox={`0 0 ${width} 48`} role="img" aria-label={`Direction: ${words[direction]}`} data-part="claim-instrument" data-claim={claim} data-direction={direction} {...rest}>
        <path d={`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={v.line2} />
        <line x1={cx} x2={cx} y1={cy - r - 3} y2={cy - r + 5} stroke={v.text3} data-part="meridian" />
        <line data-part="needle" x1={cx} y1={cy} x2={cx + Math.cos(ang) * (r - 6)} y2={cy + Math.sin(ang) * (r - 6)} stroke={v.signal} strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={2.5} fill={v.signal} />
      </svg>
    );
  }
  const { rank, of, width = 160, claim: _c, locale: _l, ...rest } = props;
  const n = Math.max(1, Math.floor(of)), k = Math.max(1, Math.min(n, Math.floor(rank)));
  const step = n > 1 ? (width - 16) / (n - 1) : 0;
  return (
    <svg width={width} height={20} viewBox={`0 0 ${width} 20`} role="img" aria-label={`Ranking: ${k} of ${n}`} data-part="claim-instrument" data-claim={claim} {...rest}>
      <line x1={8} x2={width - 8} y1={10} y2={10} stroke={v.line2} />
      {Array.from({ length: n }, (_, i) =>
        i + 1 === k ? <MeasuredNode key={i} cx={8 + i * step} cy={10} /> : <rect key={i} x={8 + i * step - 2} y={8} width={4} height={4} fill={v.text3} />,
      )}
    </svg>
  );
}
