// The one icon-first expand primitive. A control that carries `ns-expand-host`
// shows its icon; its ExpandLabel is collapsed to zero width and eases open
// (grid-template-columns 0fr -> 1fr, so the text is measured by layout, never
// clipped with an ellipsis) on hover, on keyboard focus (:focus-visible, or a
// focused child), when selected or expanded, and always on touch screens.
// The label stays in the accessibility tree the whole time, so it names the
// control. `data-expand="always"` keeps it open.
import { cx } from './util.js';

export type Expand = boolean | 'always';

export interface ExpandLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The label sits after the icon (`start`, default) or before it (`end`): the gap opens on that side. */
  side?: 'start' | 'end';
}

export function ExpandLabel({ side = 'start', className, children, ...rest }: ExpandLabelProps) {
  return (
    <span {...rest} className={cx('ns-reveal-label', 'ns-expand', side === 'end' && 'ns-expand--end', className)}>
      <span className="ns-reveal-label__inner ns-expand__inner">{children}</span>
    </span>
  );
}

/** Props a control spreads to become an expand host. Nothing when `expand` is false. */
export function expandHost(expand: Expand | undefined): { className?: string; 'data-expand'?: 'hover' | 'always' } {
  if (!expand) return {};
  return { className: 'ns-expand-host', 'data-expand': expand === 'always' ? 'always' : 'hover' };
}

/** The icon slot of an expand host. */
export function ExpandIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('ns-expand-icon', className)} aria-hidden="true">
      {children}
    </span>
  );
}
