import type { SVGProps } from 'react';
import { v } from './tokens.js';

/** Four-point star path centred on (cx, cy) with outer radius r. */
export function starPath(cx: number, cy: number, r: number): string {
  const i = r * 0.32;
  const p = (x: number, y: number) => `${+(cx + x).toFixed(2)} ${+(cy + y).toFixed(2)}`;
  return `M${p(0, -r)}L${p(i, -i)}L${p(r, 0)}L${p(i, i)}L${p(0, r)}L${p(-i, i)}L${p(-r, 0)}L${p(-i, -i)}Z`;
}

export type AgentStarProps = { cx: number; cy: number; r?: number } & Omit<SVGProps<SVGPathElement>, 'd'>;

/** An agent: a small four-point star. */
export function AgentStar({ cx, cy, r = 3, ...rest }: AgentStarProps) {
  return <path d={starPath(cx, cy, r)} fill={v.text1} data-mark="agent" {...rest} />;
}

export type MeasuredNodeProps = { cx: number; cy: number; size?: number } & SVGProps<SVGRectElement>;

/** A measured value: a filled square node in the signal colour. */
export function MeasuredNode({ cx, cy, size = 7, ...rest }: MeasuredNodeProps) {
  return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} fill={v.signal} data-mark="node" {...rest} />;
}
