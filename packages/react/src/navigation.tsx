'use client';
import { createContext, useContext, useId } from 'react';
import { useNorthstar } from './provider.js';
import { rovingKeyDown } from './internal/layers.js';
import { cx, useControllable } from './internal/util.js';
import { ChevronLeft, ChevronRight } from './internal/icons.js';

/* ------------------------------------------------------------------- Tabs */

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
  orientation: 'horizontal' | 'vertical';
}
const TabsContext = createContext<TabsContextValue | null>(null);
function useTabs(name: string) {
  const v = useContext(TabsContext);
  if (!v) throw new Error(`<${name}> must be used inside <Tabs.Root>`);
  return v;
}

export interface TabsRootProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

function TabsRoot({ value, defaultValue, onValueChange, orientation = 'horizontal', className, ...rest }: TabsRootProps) {
  const [v, setV] = useControllable(value, defaultValue ?? '', onValueChange);
  const baseId = `ns-tabs-${useId().replace(/:/g, '')}`;
  return (
    <TabsContext.Provider value={{ value: v, setValue: setV, baseId, orientation }}>
      <div {...rest} className={cx('ns-tabs', `ns-tabs--${orientation}`, className)} />
    </TabsContext.Provider>
  );
}

function TabsList({ className, onKeyDown, ...rest }: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
  const ctx = useTabs('Tabs.List');
  const { label, ...props } = rest;
  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={ctx.orientation}
      {...props}
      className={cx('ns-tabs__list', className)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        const t = rovingKeyDown(e, '[role="tab"]', ctx.orientation);
        const v = t?.getAttribute('data-value');
        if (v) ctx.setValue(v);
      }}
    />
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function TabsTrigger({ value, className, onClick, ...rest }: TabsTriggerProps) {
  const ctx = useTabs('Tabs.Trigger');
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      {...rest}
      className={cx('ns-tabs__trigger', className)}
      onClick={(e) => {
        onClick?.(e);
        ctx.setValue(value);
      }}
    />
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Keep the panel mounted when hidden. */
  forceMount?: boolean;
}

function TabsContent({ value, forceMount = false, className, ...rest }: TabsContentProps) {
  const ctx = useTabs('Tabs.Content');
  const selected = ctx.value === value;
  if (!selected && !forceMount) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!selected}
      {...rest}
      className={cx('ns-tabs__content', className)}
    />
  );
}

/** Tabs with automatic activation: arrow keys move and select, Home/End jump. */
export const Tabs = { Root: TabsRoot, List: TabsList, Trigger: TabsTrigger, Content: TabsContent };

/* ------------------------------------------------------------ Breadcrumbs */

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items, className, ...rest }: BreadcrumbsProps) {
  const { messages } = useNorthstar();
  return (
    <nav aria-label={messages.breadcrumbs} {...rest} className={cx('ns-breadcrumbs', className)}>
      <ol>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {last || !item.href ? (
                <span aria-current={last ? 'page' : undefined}>{item.label}</span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
              {!last && (
                <span className="ns-breadcrumbs__sep" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------- Pagination */

export interface PaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  pageCount: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Pages shown either side of the current one. */
  siblings?: number;
}

function range(page: number, count: number, siblings: number): Array<number | 'gap'> {
  const out: Array<number | 'gap'> = [];
  const from = Math.max(2, page - siblings);
  const to = Math.min(count - 1, page + siblings);
  out.push(1);
  if (from > 2) out.push('gap');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < count - 1) out.push('gap');
  if (count > 1) out.push(count);
  return out;
}

export function Pagination({ pageCount, page, defaultPage, onPageChange, siblings = 1, className, ...rest }: PaginationProps) {
  const { messages } = useNorthstar();
  const [p, setP] = useControllable(page, defaultPage ?? 1, onPageChange);
  const go = (n: number) => setP(Math.min(pageCount, Math.max(1, n)));
  return (
    <nav aria-label={messages.pagination} {...rest} className={cx('ns-pagination', className)}>
      <button type="button" className="ns-button ns-button--ghost ns-size-sm ns-icon-button" aria-label={messages.previousPage} disabled={p <= 1} onClick={() => go(p - 1)}>
        <ChevronLeft />
      </button>
      <ul>
        {range(p, pageCount, siblings).map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} className="ns-pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className="ns-button ns-button--ghost ns-size-sm ns-pagination__page"
                aria-label={messages.page(n)}
                aria-current={n === p ? 'page' : undefined}
                onClick={() => go(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className="ns-button ns-button--ghost ns-size-sm ns-icon-button" aria-label={messages.nextPage} disabled={p >= pageCount} onClick={() => go(p + 1)}>
        <ChevronRight />
      </button>
    </nav>
  );
}

/* ---------------------------------------------------------------- Sidebar */

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  label?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidebar({ label, header, footer, className, children, ...rest }: SidebarProps) {
  const { messages } = useNorthstar();
  return (
    <nav aria-label={label ?? messages.sidebar} {...rest} className={cx('ns-sidebar', className)}>
      {header && <div className="ns-sidebar__header">{header}</div>}
      <div className="ns-sidebar__body">{children}</div>
      {footer && <div className="ns-sidebar__footer">{footer}</div>}
    </nav>
  );
}

export interface SidebarSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
}

export function SidebarSection({ title, className, children, ...rest }: SidebarSectionProps) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={title ? id : undefined} {...rest} className={cx('ns-sidebar__section', className)}>
      {title && (
        <div id={id} className="ns-sidebar__title">
          {title}
        </div>
      )}
      <ul>{children}</ul>
    </div>
  );
}

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  active?: boolean;
  /** Trailing count or badge. */
  meta?: React.ReactNode;
}

export function SidebarItem({ icon, active = false, meta, className, children, ...rest }: SidebarItemProps) {
  return (
    <li>
      <a aria-current={active ? 'page' : undefined} {...rest} className={cx('ns-sidebar__item', className)}>
        {icon && (
          <span className="ns-sidebar__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="ns-sidebar__text">{children}</span>
        {meta !== undefined && <span className="ns-sidebar__meta">{meta}</span>}
      </a>
    </li>
  );
}
