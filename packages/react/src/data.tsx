// Server-component safe: no state, no context.
import { cx, type Tone } from './internal/util.js';
import { Close } from './internal/icons.js';

/* ------------------------------------------------------------------ Table */

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: 'compact' | 'default' | 'comfortable';
  /** Sticky header row. */
  stickyHeader?: boolean;
  caption?: React.ReactNode;
  /** Body rows lift on hover and on keyboard focus within, for tables whose rows open something. */
  interactive?: boolean;
}

export function Table({ density, stickyHeader = false, caption, interactive = false, className, children, ...rest }: TableProps) {
  return (
    <div className="ns-table-wrap">
      <table {...rest} className={cx('ns-table', stickyHeader && 'ns-table--sticky', interactive && 'ns-table--interactive', className)} data-density={density}>
        {caption && <caption className="ns-table__caption">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export const TableHead = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...p} />;
export const TableBody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...p} />;
export function TableRow({ selected, className, ...rest }: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return <tr aria-selected={selected} {...rest} className={cx('ns-table__row', className)} />;
}

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
  /** Makes the header a sort button. */
  sort?: SortDirection;
  onSort?: () => void;
}

export function TableHeaderCell({ numeric, sort, onSort, className, children, scope = 'col', ...rest }: TableHeaderCellProps) {
  return (
    <th scope={scope} aria-sort={sort} {...rest} className={cx('ns-table__th', numeric && 'ns-numeric', className)}>
      {onSort ? (
        <button type="button" className="ns-table__sort" onClick={onSort}>
          {children}
          <span aria-hidden="true" className="ns-table__sort-mark">
            {sort === 'ascending' ? '↑' : sort === 'descending' ? '↓' : '↕'}
          </span>
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TableCell({ numeric, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return <td {...rest} className={cx('ns-table__td', numeric && 'ns-numeric', className)} />;
}

/* ------------------------------------------------------------------- List */

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  divided?: boolean;
  ordered?: boolean;
}

export function List({ divided = true, ordered = false, className, ...rest }: ListProps) {
  const Tag = ordered ? 'ol' : 'ul';
  return <Tag {...rest} className={cx('ns-list', divided && 'ns-list--divided', className)} />;
}

export interface ListItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  start?: React.ReactNode;
  end?: React.ReactNode;
}

export function ListItem({ title, description, start, end, className, children, ...rest }: ListItemProps) {
  return (
    <li {...rest} className={cx('ns-list__item', className)}>
      {start && <span className="ns-list__start">{start}</span>}
      <span className="ns-list__text">
        {title && <span className="ns-list__title">{title}</span>}
        {description && <span className="ns-list__description">{description}</span>}
        {children}
      </span>
      {end && <span className="ns-list__end">{end}</span>}
    </li>
  );
}

/* ------------------------------------------------------------- Tag, Badge */

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Shows a remove button with this accessible label. */
  onRemove?: () => void;
  removeLabel?: string;
}

export function Tag({ tone = 'neutral', onRemove, removeLabel, className, children, ...rest }: TagProps) {
  return (
    <span {...rest} className={cx('ns-tag', tone === 'signal' && 'ns-tone-signal', className)}>
      {children}
      {onRemove && (
        <button type="button" className="ns-tag__remove" aria-label={removeLabel ?? `Remove ${typeof children === 'string' ? children : ''}`.trim()} onClick={onRemove}>
          <Close />
        </button>
      )}
    </span>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  variant?: 'solid' | 'outline';
}

/** A short count or status word. */
export function Badge({ tone = 'neutral', variant = 'outline', className, ...rest }: BadgeProps) {
  return <span {...rest} className={cx('ns-badge', `ns-badge--${variant}`, tone === 'signal' && 'ns-tone-signal', className)} />;
}

/* ----------------------------------------------------------------- Avatar */

export function initials(name: string): string {
  const parts = name.trim().split(/[\s\-_.@]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? '') : '';
  return ((first[0] ?? '') + (last[0] ?? first[1] ?? '')).toUpperCase();
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** A workspace person. Rendered as initials; stars are reserved for agents. */
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, size = 'md', className, ...rest }: AvatarProps) {
  return (
    <span role="img" aria-label={name} title={name} {...rest} className={cx('ns-avatar', `ns-avatar--${size}`, className)}>
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  );
}

/* -------------------------------------------------------------------- Kbd */

export function Kbd({ className, ...rest }: React.HTMLAttributes<HTMLElement>) {
  return <kbd {...rest} className={cx('ns-kbd', className)} />;
}

/* ------------------------------------------------------------- EmptyState */

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action, className, ...rest }: EmptyStateProps) {
  return (
    <div {...rest} className={cx('ns-empty', className)}>
      {icon && (
        <div className="ns-empty__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="ns-empty__title">{title}</p>
      {description && <p className="ns-empty__description">{description}</p>}
      {action && <div className="ns-empty__action">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Skeleton */

export interface SkeletonProps extends React.HTMLAttributes<HTMLSpanElement> {
  width?: number | string;
  height?: number | string;
  shape?: 'line' | 'block' | 'circle';
}

/** Loading placeholder. Hidden from assistive tech; pair it with a busy region. */
export function Skeleton({ width, height, shape = 'line', className, style, ...rest }: SkeletonProps) {
  return <span aria-hidden="true" {...rest} className={cx('ns-skeleton', `ns-skeleton--${shape}`, className)} style={{ width, height, ...style }} />;
}

/* ------------------------------------------------------------------ Stale */

export interface StaleProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible label. Default "Stale". */
  label?: React.ReactNode;
  /** Optional detail, e.g. when the data was last refreshed. */
  detail?: React.ReactNode;
}

/** Marks out-of-date content with a label and a dashed edge — never opacity alone. */
export function Stale({ label = 'Stale', detail, className, children, ...rest }: StaleProps) {
  return (
    <div {...rest} className={cx('ns-stale', className)} data-stale="">
      <span className="ns-stale__label">
        {label}
        {detail && <span className="ns-stale__detail"> · {detail}</span>}
      </span>
      {children}
    </div>
  );
}
