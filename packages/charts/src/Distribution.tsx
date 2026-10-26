import type { SVGProps } from 'react';
import { formatPercent } from './format.js';
import { likertRamp, v } from './tokens.js';

export interface DistributionProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Anchor labels, step 1 first (five for Likert). */
  anchors: string[];
  /** Shares 0-1, one per anchor. */
  shares: number[];
  width?: number;
  locale?: string;
  /** Accessible title. */
  title?: string;
}

/** A Likert distribution: one stacked bar on the horizon, ordinal ramp, share labels under each step. */
export function Distribution({ anchors, shares, width = 480, locale = 'en', title = 'Distribution', ...rest }: DistributionProps) {
  const total = shares.reduce((s, x) => s + (Number.isFinite(x) ? Math.max(0, x) : 0), 0) || 1;
  const H = 56, barY = 8, barH = 16;
  let x = 0;
  const segs = anchors.map((a, i) => {
    const share = Math.max(0, shares[i] ?? 0);
    const w = (share / total) * width;
    const seg = { a, share, x, w, color: likertRamp[Math.min(i, likertRamp.length - 1)] ?? v.text3 };
    x += w;
    return seg;
  });
  const label = `${title}: ${segs.map((s) => `${s.a} ${formatPercent(s.share, { locale })}`).join(', ')}`;
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={label} data-part="distribution" {...rest}>
      <line x1={0} x2={width} y1={barY + barH + 0.5} y2={barY + barH + 0.5} stroke={v.line2} data-part="horizon" />
      {segs.map((s, i) => (
        <g key={i} data-part="segment" data-anchor={s.a}>
          <rect x={s.x} y={barY} width={Math.max(0, s.w - 1)} height={barH} fill={s.color} />
          {s.w >= 24 && (
            <text x={s.x + s.w / 2} y={barY + barH + 16} textAnchor="middle" fontSize={11} fill={v.text2} fontFamily={v.mono}>
              {formatPercent(s.share, { locale })}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
