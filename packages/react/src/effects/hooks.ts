'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const QUERY = '(prefers-reduced-motion: reduce)';

/** Read once, now. Safe on the server (returns false). */
export function reducedMotionNow(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches;
}

/** Live `prefers-reduced-motion`. CSS handles the visuals; this gates JS-spawned motion. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/** Controlled/uncontrolled state: `value` wins when defined. */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const ref = useRef(onChange);
  ref.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      ref.current?.(next);
    },
    [controlled],
  );
  return [controlled ? value : inner, set];
}

export function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

/** Cancels pending timers on unmount. */
export function useTimers(): (fn: () => void, ms: number) => void {
  const ids = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const set = ids.current;
    return () => {
      for (const id of set) clearTimeout(id);
      set.clear();
    };
  }, []);
  return useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
  }, []);
}
