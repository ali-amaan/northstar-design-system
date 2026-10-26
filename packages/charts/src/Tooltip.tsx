import type { HTMLAttributes, ReactNode } from 'react';
import { v } from './tokens.js';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the tooltip is shown. Controlled: charts hold no hover state. */
  open?: boolean;
  /** Position in px relative to the positioned chart container. */
  x?: number;
  y?: number;
  children?: ReactNode;
}

/** A chart tooltip. Stateless and server-safe; the caller decides when it is open and where. */
export function Tooltip({ open = false, x = 0, y = 0, children, style, ...rest }: TooltipProps) {
  if (!open) return null;
  return (
    <div
      role="tooltip"
      data-part="tooltip"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, calc(-100% - 8px))',
        pointerEvents: 'none',
        zIndex: 90,
        background: v.surface2,
        color: v.text1,
        border: `1px solid ${v.line2}`,
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 12,
        fontFamily: v.sans,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
