import type { SVGProps } from 'react';
import { MeasuredNode } from './marks.js';
import { v } from './tokens.js';

export interface RankingProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Option labels in ranked order, first is top. */
  items: string[];
  width?: number;
  /** Index to emphasise with the signal colour. Default 0. */
  highlight?: number | null;
  title?: string;
}

/** A ranking ladder: options on a spine, evenly spaced, no values. */
export function Ranking({ items, width = 320, highlight = 0, title = 'Ranked options', ...rest }: RankingProps) {
  const row = 28, H = items.length * row + 8, spineX = 28;
  const aria = `${title}: ${items.map((it, i) => `${i + 1}. ${it}`).join(', ')}`;
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img" aria-label={aria} data-part="ranking" {...rest}>
      {items.length > 1 && <line x1={spineX} x2={spineX} y1={row / 2 + 4} y2={(items.length - 0.5) * row + 4} stroke={v.line2} data-part="spine" />}
      {items.map((it, i) => {
        const y = i * row + row / 2 + 4;
        const on = highlight === i;
        return (
          <g key={`${i}-${it}`} data-part="rank" data-rank={i + 1}>
            <text x={0} y={y + 4} fontSize={11} fill={v.text3} fontFamily={v.mono}>{i + 1}</text>
            {on ? <MeasuredNode cx={spineX} cy={y} /> : <rect x={spineX - 3} y={y - 3} width={6} height={6} fill={v.text2} />}
            <text x={spineX + 14} y={y + 4} fontSize={13} fill={on ? v.text1 : v.text2} fontFamily={v.sans}>{it}</text>
          </g>
        );
      })}
    </svg>
  );
}
