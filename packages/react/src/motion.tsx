'use client';
// Motion utilities without a motion library: a scroll-linked Reveal on
// IntersectionObserver, and a View Transitions wrapper for step and tab
// changes. Both do nothing visible under prefers-reduced-motion.
import { useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { cx, mergeRefs } from './internal/util.js';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/** True where the View Transitions API is available and motion is allowed. */
export function canViewTransition(): boolean {
  return typeof document !== 'undefined' && typeof (document as DocWithVT).startViewTransition === 'function' && !prefersReducedMotion();
}

/**
 * Runs a React state update inside `document.startViewTransition` where it is
 * supported (flushing synchronously so the new DOM is captured), and plainly
 * everywhere else. With `scope`, only that element is named for the
 * transition (as `name`, default `ns-step`) and only while it runs, so several
 * instances on one page never clash. Returns true when a view transition ran.
 */
export function withViewTransition(update: () => void, scope?: HTMLElement | null, name = 'ns-step'): boolean {
  if (!canViewTransition()) {
    update();
    return false;
  }
  if (scope) scope.style.setProperty('view-transition-name', name);
  try {
    const t = (document as DocWithVT).startViewTransition!(() => flushSync(update));
    const clear = () => scope?.style.removeProperty('view-transition-name');
    t.finished.then(clear, clear);
  } catch {
    scope?.style.removeProperty('view-transition-name');
    update();
    return false;
  }
  return true;
}

/** A stable callback version of `withViewTransition`. */
export function useViewTransition(): (update: () => void, scope?: HTMLElement | null, name?: string) => boolean {
  return useCallback((update: () => void, scope?: HTMLElement | null, name?: string) => withViewTransition(update, scope, name), []);
}

type RevealTag = 'div' | 'section' | 'article' | 'li' | 'ul' | 'ol' | 'span' | 'header' | 'footer';

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Stagger the direct children in sequence instead of revealing as one block. */
  stagger?: boolean;
  /** Extra delay before the reveal, in ms. */
  delay?: number;
  /** How the content arrives. Default `rise`. */
  effect?: 'rise' | 'fade' | 'scale';
  /** Reveal again each time it re-enters the viewport. Default false. */
  repeat?: boolean;
  /** Fraction of the element visible before it reveals. Default 0.15. */
  threshold?: number;
  as?: RevealTag;
  ref?: React.Ref<HTMLElement>;
}

/**
 * Fades and rises its content in when it scrolls into view. The server HTML
 * and no-JS render are fully visible: the element is only held back once the
 * observer is attached. Under reduced motion it shows at once.
 */
export function Reveal({ stagger = false, delay = 0, effect = 'rise', repeat = false, threshold = 0.15, as: Tag = 'div', className, style, ref, ...rest }: RevealProps) {
  const node = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = node.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      el.setAttribute('data-reveal', 'in');
      return;
    }
    el.setAttribute('data-reveal', 'pending');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.setAttribute('data-reveal', 'in');
            if (!repeat) io.disconnect();
          } else if (repeat) el.setAttribute('data-reveal', 'pending');
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [repeat, threshold]);
  return (
    <Tag
      {...(rest as React.HTMLAttributes<HTMLElement>)}
      ref={mergeRefs(ref, (el: HTMLElement | null) => {
        node.current = el;
      }) as React.Ref<never>}
      className={cx('ns-reveal', `ns-reveal--${effect}`, stagger && 'ns-reveal--stagger', className)}
      style={delay ? ({ '--ns-reveal-delay': `${delay}ms`, ...style } as React.CSSProperties) : style}
    />
  );
}
