'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cx, useControllable, useIsoLayoutEffect } from './hooks.js';
import { clamp, starPath } from './math.js';

const STAR = starPath(6, 6, 5.5, 1.2);

/* ----------------------------------------------------------- MeridianTabs */

export interface MeridianTab {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface MeridianTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  tabs: MeridianTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name of the tab list. */
  label: string;
}

/**
 * Tabs whose indicator is a star that travels to the chosen tab along a short
 * arc (a meridian seen edge-on), while the rule under the tab stretches to
 * fit. Arrow keys, Home and End move and select, as in the WAI-ARIA pattern.
 */
export function MeridianTabs({ tabs, value, defaultValue, onValueChange, label, className, ...rest }: MeridianTabsProps) {
  const base = useId();
  const [current, setCurrent] = useControllable(value, defaultValue ?? tabs[0]?.value ?? '', onValueChange);
  const list = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [hops, setHops] = useState(0);
  const last = useRef(current);
  useEffect(() => {
    if (last.current !== current) setHops((h) => h + 1);
    last.current = current;
  }, [current]);

  const measure = useCallback(() => {
    const el = buttons.current.get(current);
    if (el) setBox({ x: el.offsetLeft, w: el.offsetWidth });
  }, [current]);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    if (typeof ResizeObserver === 'undefined' || !list.current) return () => cancelAnimationFrame(id);
    const ro = new ResizeObserver(() => measure());
    ro.observe(list.current);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measure]);

  const enabled = tabs.filter((t) => !t.disabled);
  function onKeyDown(e: React.KeyboardEvent) {
    const i = enabled.findIndex((t) => t.value === current);
    let next: MeridianTab | undefined;
    if (e.key === 'ArrowRight') next = enabled[(i + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(i - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (!next) return;
    e.preventDefault();
    setCurrent(next.value);
    buttons.current.get(next.value)?.focus();
  }

  return (
    <div {...rest} className={cx('ns-fx-mtabs', className)} data-ready={ready || undefined}>
      <div ref={list} role="tablist" aria-label={label} className="ns-fx-mtabs__list" onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = t.value === current;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`${base}-tab-${t.value}`}
              aria-controls={`${base}-panel-${t.value}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              disabled={t.disabled}
              ref={(el) => {
                if (el) buttons.current.set(t.value, el);
                else buttons.current.delete(t.value);
              }}
              className="ns-fx-mtabs__tab"
              onClick={() => setCurrent(t.value)}
            >
              {t.label}
            </button>
          );
        })}
        {box ? (
          <span className="ns-fx-mtabs__track" aria-hidden="true" style={{ '--ns-fx-x': `${box.x}px`, '--ns-fx-w': box.w } as React.CSSProperties}>
            <span className="ns-fx-mtabs__bar" />
            <span className="ns-fx-mtabs__carrier">
              <span key={hops} className={cx('ns-fx-mtabs__hop', hops > 0 && 'ns-fx-mtabs__hop--go')}>
                <svg viewBox="0 0 12 12" width="10" height="10" focusable="false">
                  <path d={STAR} />
                </svg>
              </span>
            </span>
          </span>
        ) : null}
      </div>
      {tabs.map((t) => (
        <div
          key={t.value}
          role="tabpanel"
          id={`${base}-panel-${t.value}`}
          aria-labelledby={`${base}-tab-${t.value}`}
          hidden={t.value !== current}
          tabIndex={0}
          className="ns-fx-mtabs__panel"
        >
          {t.value === current ? t.content : null}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------- StarPagination */

export interface StarPaginationProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'> {
  count: number;
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** Accessible name. Default "Pagination". */
  label?: string;
  /** Dots shown at once when there are many pages. Default 7. */
  window?: number;
  pageLabel?: (n: number) => string;
  previousLabel?: string;
  nextLabel?: string;
}

/**
 * Pagination as a row of stars: the current page is a four-point star, the
 * others are points of light, and the dots at the edge of a long run dim and
 * shrink, the way a field thins toward the horizon.
 */
export function StarPagination({
  count,
  page,
  defaultPage = 1,
  onPageChange,
  label = 'Pagination',
  window: shown = 7,
  pageLabel = (n) => `Page ${n}`,
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  className,
  ...rest
}: StarPaginationProps) {
  const [p, setP] = useControllable(page, defaultPage, onPageChange);
  const cur = clamp(p, 1, Math.max(1, count));
  const size = Math.min(count, Math.max(3, shown));
  const start = clamp(cur - Math.floor(size / 2), 1, Math.max(1, count - size + 1));
  const pages = Array.from({ length: size }, (_, i) => start + i);
  const go = (n: number) => setP(clamp(n, 1, count));
  const arrow = (d: string) => (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <nav {...rest} aria-label={label} className={cx('ns-fx-spage', className)}>
      <button type="button" className="ns-fx-spage__step" aria-label={previousLabel} disabled={cur <= 1} onClick={() => go(cur - 1)}>
        {arrow('M10 3.5 5.5 8 10 12.5')}
      </button>
      <ul className="ns-fx-spage__dots">
        {pages.map((n) => {
          const edge = count > size && ((n === start && start > 1) || (n === start + size - 1 && n < count));
          return (
            <li key={n}>
              <button
                type="button"
                className={cx('ns-fx-spage__dot', edge && 'ns-fx-spage__dot--edge')}
                aria-label={pageLabel(n)}
                aria-current={n === cur ? 'page' : undefined}
                onClick={() => go(n)}
              >
                <i className="ns-fx-spage__point" />
                <svg className="ns-fx-spage__star" viewBox="0 0 12 12" focusable="false" aria-hidden="true">
                  <path d={STAR} />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="ns-fx-spage__step" aria-label={nextLabel} disabled={cur >= count} onClick={() => go(cur + 1)}>
        {arrow('M6 3.5 10.5 8 6 12.5')}
      </button>
      <span className="ns-fx-spage__readout" aria-hidden="true">
        {cur} / {count}
      </span>
    </nav>
  );
}

/* ------------------------------------------------ ConstellationBreadcrumb */

export interface ConstellationCrumb {
  label: React.ReactNode;
  href?: string;
}

export interface ConstellationBreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: ConstellationCrumb[];
  /** Accessible name. Default "Breadcrumbs". */
  label?: string;
}

/**
 * Breadcrumbs as a constellation path: each level is a star joined to the
 * next by a line, magnitudes brightening toward the current page. Hovering
 * or focusing a crumb lights its star.
 */
export function ConstellationBreadcrumb({ items, label = 'Breadcrumbs', className, ...rest }: ConstellationBreadcrumbProps) {
  return (
    <nav {...rest} aria-label={label} className={cx('ns-fx-crumbs', className)}>
      <ol className="ns-fx-crumbs__list">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const mag = items.length > 1 ? 0.55 + (0.45 * i) / (items.length - 1) : 1;
          return (
            <li key={i} className="ns-fx-crumbs__item" style={{ '--ns-fx-mag': mag.toFixed(2), '--ns-fx-i': i } as React.CSSProperties}>
              <svg className="ns-fx-crumbs__star" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                <path d={STAR} />
              </svg>
              {last || !item.href ? (
                <span className="ns-fx-crumbs__current" aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <a className="ns-fx-crumbs__link" href={item.href}>
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
