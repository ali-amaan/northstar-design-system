// Server-component safe: no state, no context.
import { cx } from './internal/util.js';

type Space = 0 | 2 | 4 | 6 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64;
const space = (n: Space | undefined) => (n === undefined ? undefined : n === 0 ? '0' : `var(--ns-space-${n})`);

/* ------------------------------------------------------------------ Stack */

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  direction?: 'row' | 'column';
  gap?: Space;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  as?: 'div' | 'section' | 'ul' | 'ol' | 'header' | 'footer' | 'nav' | 'main' | 'form';
}

const flex = { start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch', baseline: 'baseline', between: 'space-between' } as const;

export function Stack({ direction = 'column', gap = 8, align, justify, wrap = false, as: Tag = 'div', className, style, ...rest }: StackProps) {
  return (
    <Tag
      {...(rest as React.HTMLAttributes<HTMLElement>)}
      className={cx('ns-stack', className)}
      style={{
        flexDirection: direction,
        gap: space(gap),
        alignItems: align && flex[align],
        justifyContent: justify && flex[justify],
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
    />
  );
}

/* ------------------------------------------------------------------- Grid */

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A column count, or a minimum column width for an auto-fill grid. */
  columns?: number | { min: number };
  gap?: Space;
}

export function Grid({ columns = 2, gap = 16, className, style, ...rest }: GridProps) {
  const template = typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(${columns.min}px, 1fr))`;
  return <div {...rest} className={cx('ns-grid', className)} style={{ gridTemplateColumns: template, gap: space(gap), ...style }} />;
}

/* --------------------------------------------------------------- AppShell */

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
  topBar?: React.ReactNode;
  /** Id of <main>, the target for a skip link. */
  mainId?: string;
  skipLabel?: string;
}

/** Sidebar, top bar and a single <main> landmark, with a skip link. */
export function AppShell({ sidebar, topBar, mainId = 'ns-main', skipLabel = 'Skip to content', className, children, ...rest }: AppShellProps) {
  return (
    <div {...rest} className={cx('ns-app-shell', !sidebar && 'ns-app-shell--no-sidebar', className)}>
      <a className="ns-skip-link" href={`#${mainId}`}>
        {skipLabel}
      </a>
      {sidebar && <div className="ns-app-shell__sidebar">{sidebar}</div>}
      <div className="ns-app-shell__column">
        {topBar}
        <main id={mainId} className="ns-app-shell__main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export interface TopBarProps extends React.HTMLAttributes<HTMLElement> {
  start?: React.ReactNode;
  end?: React.ReactNode;
}

export function TopBar({ start, end, className, children, ...rest }: TopBarProps) {
  return (
    <header {...rest} className={cx('ns-top-bar', className)}>
      {start && <div className="ns-top-bar__start">{start}</div>}
      <div className="ns-top-bar__center">{children}</div>
      {end && <div className="ns-top-bar__end">{end}</div>}
    </header>
  );
}
