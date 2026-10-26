import type { SVGProps } from 'react';
import { formatPercent } from './format.js';
import { v } from './tokens.js';

export interface CompositionRow {
  label: string;
  /** Published margin (target share, 0-1). */
  margin: number;
  /** The panel's share, 0-1. Omit before the panel is built. */
  panel?: number;
}

export interface CompositionProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  margins: CompositionRow[];
  width?: number;
  locale?: string;
  title?: string;
}

/** Margins versus panel: a bar per category for the panel, a tick for the published margin. */
export function Composition({ margins, width = 480, locale = 'en', title = 'Composition', ...rest }: CompositionProps) {
  const row = 24, labelW = Math.min(160, width * 0.35), valW = 48;
  const barW = Math.max(40, width - labelW - valW);
  const max = Math.max(0.0001, ...margins.flatMap((r) => [r.margin, r.panel ?? 0]));
  const sx = (s: number) => labelW + (s / max) * barW;
  const H = margins.length * row + 4;
  const aria = `${title}: ${margins
    .map((r) => `${r.label} margin ${formatPercent(r.margin, { locale })}${r.panel !== undefined ? `, panel ${formatPercent(r.panel, { locale })}` : ''}`)
    .join('; ')}`;
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={aria} data-part="composition" {...rest}>
      {margins.map((r, i) => {
        const y = i * row + 4;
        return (
          <g key={r.label} data-part="row">
            <text x={0} y={y + 12} fontSize={12} fill={v.text2} fontFamily={v.sans}>{r.label}</text>
            <line x1={labelW} x2={labelW + barW} y1={y + 16.5} y2={y + 16.5} stroke={v.line1} />
            {r.panel !== undefined && (
              <rect data-part="panel" x={labelW} y={y + 5} width={Math.max(0, sx(r.panel) - labelW)} height={10} fill={v.signal} />
            )}
            <line data-part="margin" x1={sx(r.margin)} x2={sx(r.margin)} y1={y + 1} y2={y + 19} stroke={v.text1} strokeWidth={1.5} />
            <text x={width} y={y + 13} textAnchor="end" fontSize={11} fill={v.text2} fontFamily={v.mono}>
              {formatPercent(r.panel ?? r.margin, { locale })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
