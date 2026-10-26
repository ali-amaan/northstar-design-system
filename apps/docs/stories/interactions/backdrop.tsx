// A busy, glacier-only backdrop so the glass material has something to refract.
// Stars are drawn as small four-point marks; one horizon rule crosses the field.
import type { CSSProperties, ReactNode } from 'react';

const STARS = [
  [8, 14, 6], [22, 62, 4], [37, 28, 8], [51, 78, 5], [63, 18, 4], [72, 54, 7], [86, 32, 5], [93, 72, 4], [15, 86, 5], [44, 50, 3],
];

function Star({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width={s * 2} height={s * 2} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, color: 'var(--ns-color-signal)', opacity: 0.55 }}>
      <path d="M8 0.5 9.3 6.7 15.5 8 9.3 9.3 8 15.5 6.7 9.3 0.5 8 6.7 6.7Z" fill="currentColor" />
    </svg>
  );
}

export function Backdrop({ children, style, minHeight = 420 }: { children: ReactNode; style?: CSSProperties; minHeight?: number }) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight,
        padding: 32,
        borderRadius: 16,
        border: '1px solid var(--ns-color-line-1)',
        background: [
          'radial-gradient(40% 55% at 18% 20%, var(--ns-color-data-band), transparent 70%)',
          'radial-gradient(35% 50% at 82% 75%, var(--ns-color-signal-wash), transparent 70%)',
          'repeating-linear-gradient(90deg, var(--ns-color-data-graticule) 0 1px, transparent 1px 48px)',
          'repeating-linear-gradient(0deg, var(--ns-color-data-graticule) 0 1px, transparent 1px 48px)',
          'var(--ns-color-ground)',
        ].join(', '),
        ...style,
      }}
    >
      {STARS.map(([x, y, s]) => (
        <Star key={`${x}-${y}`} x={x!} y={y!} s={s!} />
      ))}
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: '58%', height: 1, background: 'var(--ns-color-data-horizon)', opacity: 0.6 }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}
