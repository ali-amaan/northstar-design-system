import type { HTMLAttributes } from 'react';
import { v } from './tokens.js';

export interface LegendItem {
  label: string;
  color: string;
  /** Swatch shape. Default 'square'. */
  shape?: 'square' | 'star' | 'line';
}

export interface LegendProps extends HTMLAttributes<HTMLUListElement> {
  items: LegendItem[];
}

export function Legend({ items, style, ...rest }: LegendProps) {
  return (
    <ul
      data-part="legend"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 12, listStyle: 'none', margin: 0, padding: 0, fontSize: 12, color: v.text2, fontFamily: v.sans, ...style }}
      {...rest}
    >
      {items.map((it) => (
        <li key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width={10} height={10} viewBox="0 0 10 10" aria-hidden="true">
            {it.shape === 'line' ? (
              <line x1={0} x2={10} y1={5} y2={5} stroke={it.color} strokeWidth={2} />
            ) : it.shape === 'star' ? (
              <path d="M5 0L6.6 3.4L10 5L6.6 6.6L5 10L3.4 6.6L0 5L3.4 3.4Z" fill={it.color} />
            ) : (
              <rect width={10} height={10} fill={it.color} />
            )}
          </svg>
          {it.label}
        </li>
      ))}
    </ul>
  );
}
