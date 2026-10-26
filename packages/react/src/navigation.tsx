'use client';
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef } from 'react';
import type { Material } from './provider.js';
import { useNorthstar } from './provider.js';
import { rovingKeyDown } from './internal/layers.js';
import { withViewTransition } from './motion.js';
import { cx, useControllable } from './internal/util.js';
import { ChevronLeft, ChevronRight } from './internal/icons.js';

/* ------------------------------------------------------------------- Tabs */

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
  orientation: 'horizontal' | 'vertical';
  indicator: TabsIndicator;
}
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** `line` (default): a glacier underline that slides between tabs. `glass` / `solid`: a sliding pill behind the label. */
export type TabsIndicator = 'line' | Material;
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
  /** How the selected tab is marked. Default `line`. */
  indicator?: TabsIndicator;
  /** Cross-fade panels with the View Transitions API where supported. Default false. */
  transition?: boolean;
}

function TabsRoot({ value, defaultValue, onValueChange, orientation = 'horizontal', indicator = 'line', transition = false, className, ...rest }: TabsRootProps) {
  const [v, setRaw] = useControllable(value, defaultValue ?? '', onValueChange);
  const root = useRef<HTMLDivElement>(null);
  const setV = (next: string) => {
    if (next === v) return;
    if (transition) withViewTransition(() => setRaw(next), root.current?.querySelector<HTMLElement>(':scope > .ns-tabs__content, :scope .ns-tabs__content'));
    else setRaw(next);
  };
  const baseId = `ns-tabs-${useId().replace(/:/g, '')}`;
  return (
    <TabsContext.Provider value={{ value: v, setValue: setV, baseId, orientation, indicator }}>
      <div {...rest} ref={root} className={cx('ns-tabs', `ns-tabs--${orientation}`, transition && 'ns-tabs--vt', indicator !== 'line' && 'ns-tabs--pill', indicator === 'glass' && 'ns-tabs--glass', className)} />
    </TabsContext.Provider>
  );
}

/**
 * Measures the selected tab and moves the indicator with a transform written
 * straight to the element: no re-render, and a spring transition in CSS. Until
 * it has measured (server HTML, no layout) each selected tab draws its own mark.
 */
function useIndicator(list: React.RefObject<HTMLDivElement | null>, mark: React.RefObject<HTMLSpanElement | null>, value: string) {
  useIsoLayoutEffect(() => {
    const el = list.current;
    const ind = mark.current;
    if (!el || !ind) return;
    let frame = 0;
    const place = () => {
      const tab = el.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!tab || tab.offsetWidth === 0) {
        el.removeAttribute('data-indicator');
        return;
      }
      ind.style.width = `${tab.offsetWidth}px`;
      ind.style.height = `${tab.offsetHeight}px`;
      ind.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
      // The first placement jumps into position; later ones slide.
      if (!el.hasAttribute('data-indicator')) {
        el.setAttribute('data-indicator', 'placed');
        frame = requestAnimationFrame(() => el.setAttribute('data-indicator', 'ready'));
      }
    };
    place();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(place);
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
}

function TabsList({ className, onKeyDown, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
  const ctx = useTabs('Tabs.List');
  const { label, ...props } = rest;
  const list = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  useIndicator(list, mark, ctx.value);
  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={ctx.orientation}
      {...props}
      ref={list}
      className={cx('ns-tabs__list', className)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        const t = rovingKeyDown(e, '[role="tab"]', ctx.orientation);
        const v = t?.getAttribute('data-value');
        if (v) ctx.setValue(v);
      }}
    >
      <span ref={mark} className="ns-tabs__indicator" aria-hidden="true" />
      {children}
    </div>
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
  /** Icon rail: items show their icon and the rail eases open to full labels on hover and focus. */
  collapsed?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Sidebar({ label, collapsed = false, header, footer, className, children, ...rest }: SidebarProps) {
  const { messages } = useNorthstar();
  return (
    <nav aria-label={label ?? messages.sidebar} {...rest} className={cx('ns-sidebar', collapsed && 'ns-sidebar--collapsed', className)}>
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
        <span className="ns-sidebar__text ns-reveal-label">
          <span className="ns-reveal-label__inner">{children}</span>
        </span>
        {meta !== undefined && <span className="ns-sidebar__meta">{meta}</span>}
      </a>
    </li>
  );
}
