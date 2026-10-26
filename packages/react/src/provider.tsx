'use client';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './internal/util.js';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type ThemeSetting = 'night' | 'day' | 'system';
export type ResolvedTheme = 'night' | 'day';
export type Density = 'compact' | 'default' | 'comfortable';

/** Every user-visible string the basic components render. English is the default. */
export interface Messages {
  close: string;
  dismiss: string;
  loading: string;
  clear: string;
  search: string;
  increment: string;
  decrement: string;
  breadcrumbs: string;
  pagination: string;
  previousPage: string;
  nextPage: string;
  page: (n: number) => string;
  noResults: string;
  stale: string;
  notifications: string;
  remove: (label: string) => string;
  sidebar: string;
}

export const en: Messages = {
  close: 'Close',
  dismiss: 'Dismiss',
  loading: 'Loading',
  clear: 'Clear',
  search: 'Search',
  increment: 'Increase',
  decrement: 'Decrease',
  breadcrumbs: 'Breadcrumbs',
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: (n) => `Page ${n}`,
  noResults: 'No results',
  stale: 'Stale',
  notifications: 'Notifications',
  remove: (label) => `Remove ${label}`,
  sidebar: 'Sidebar',
};

export interface NorthstarContextValue {
  theme: ThemeSetting;
  resolvedTheme: ResolvedTheme;
  density: Density;
  messages: Messages;
  setTheme: (theme: ThemeSetting) => void;
}

const fallback: NorthstarContextValue = {
  theme: 'night',
  resolvedTheme: 'night',
  density: 'default',
  messages: en,
  setTheme: () => {},
};

const NorthstarContext = createContext<NorthstarContextValue>(fallback);

/** Theme, density and messages. Works without a provider (Night, default, English). */
export function useNorthstar(): NorthstarContextValue {
  return useContext(NorthstarContext);
}

export interface NorthstarProviderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  theme?: ThemeSetting;
  density?: Density;
  messages?: Partial<Messages>;
  /** Also write data-theme/data-density on <html> (for full-page apps). */
  applyToDocument?: boolean;
  onThemeChange?: (theme: ThemeSetting) => void;
  children?: React.ReactNode;
}

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'night';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night';
}

/**
 * Sets `data-theme` and `data-density` on its root element. For an explicit
 * theme the attribute is in the server HTML, so there is no flash. For
 * `system` the server omits it and tokens.css follows prefers-color-scheme.
 */
export function NorthstarProvider({
  theme: themeProp = 'system',
  density = 'default',
  messages,
  applyToDocument = false,
  onThemeChange,
  className,
  children,
  ...rest
}: NorthstarProviderProps) {
  const [theme, setThemeState] = useState<ThemeSetting>(themeProp);
  useEffect(() => setThemeState(themeProp), [themeProp]);
  const [system, setSystem] = useState<ResolvedTheme | null>(null);

  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => setSystem(mq.matches ? 'day' : 'night');
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, [theme]);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (system ?? systemTheme()) : theme;
  const attrTheme = theme === 'system' ? (system ?? undefined) : theme;

  useEffect(() => {
    if (!applyToDocument) return;
    const html = document.documentElement;
    if (attrTheme) html.setAttribute('data-theme', attrTheme);
    else html.removeAttribute('data-theme');
    html.setAttribute('data-density', density);
  }, [applyToDocument, attrTheme, density]);

  const value = useMemo<NorthstarContextValue>(
    () => ({
      theme,
      resolvedTheme,
      density,
      messages: { ...en, ...messages },
      setTheme: (t) => {
        setThemeState(t);
        onThemeChange?.(t);
      },
    }),
    [theme, resolvedTheme, density, messages, onThemeChange],
  );

  return (
    <NorthstarContext.Provider value={value}>
      <div {...rest} className={cx('ns-root', className)} data-theme={attrTheme} data-density={density}>
        {children}
      </div>
    </NorthstarContext.Provider>
  );
}

/** Renders into document.body, carrying the provider's theme and density. */
export function Portal({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, density } = useNorthstar();
  // The host exists from the first client render and is attached in a layout
  // effect, so by the time any passive effect (focus trap, initial focus) runs
  // the content is in the document. On the server nothing is rendered.
  const [host] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.className = 'ns-root ns-portal';
    return el;
  });
  useIsoLayoutEffect(() => {
    if (!host) return;
    host.setAttribute('data-theme', theme === 'system' ? resolvedTheme : theme);
    host.setAttribute('data-density', density);
  }, [host, theme, resolvedTheme, density]);
  useIsoLayoutEffect(() => {
    if (!host) return;
    document.body.appendChild(host);
    return () => {
      host.remove();
    };
  }, [host]);
  return host ? createPortal(children, host) : null;
}
