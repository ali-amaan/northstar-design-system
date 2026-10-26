import { v } from './tokens.js';

export interface AxisProps {
  /** Pixel length of the axis. */
  length: number;
  min?: number;
  max?: number;
  /** Major tick step in domain units. Default (max - min) / 4. */
  step?: number;
  /** Domain value of the meridian (the midpoint line). Omit for none. */
  meridian?: number;
  x?: number;
  y?: number;
  format?: (n: number) => string;
  showLabels?: boolean;
}

/** A horizontal axis drawn inside an <svg>: horizon rule, major ticks, optional meridian. */
export function Axis({ length, min = 0, max = 100, step, meridian, x = 0, y = 0, format = String, showLabels = true }: AxisProps) {
  const s = step ?? (max - min) / 4;
  const ticks: number[] = [];
  if (s > 0) for (let t = min; t <= max + 1e-9; t += s) ticks.push(+t.toFixed(6));
  const px = (t: number) => x + ((t - min) / (max - min || 1)) * length;
  return (
    <g data-part="axis">
      <line x1={x} x2={x + length} y1={y} y2={y} stroke={v.line2} strokeWidth={1} data-part="horizon" />
      {ticks.map((t) => (
        <g key={t} data-part="tick">
          <line x1={px(t)} x2={px(t)} y1={y} y2={y + 4} stroke={v.text3} strokeWidth={1} />
          {showLabels && (
            <text x={px(t)} y={y + 15} textAnchor="middle" fontSize={11} fill={v.text3} fontFamily={v.mono}>
              {format(t)}
            </text>
          )}
        </g>
      ))}
      {meridian !== undefined && (
        <line x1={px(meridian)} x2={px(meridian)} y1={y - 12} y2={y + 4} stroke={v.text3} strokeDasharray="2 2" data-part="meridian" />
      )}
    </g>
  );
}
