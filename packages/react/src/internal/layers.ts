import { useEffect, useRef } from 'react';
import { focusables } from './util.js';

/** Stack of open dismissable layers, so Escape closes only the topmost. */
const stack: symbol[] = [];

/**
 * Close on Escape (topmost layer only) and on pointer-down outside every
 * element in `inside`.
 */
export function useDismiss(
  active: boolean,
  inside: Array<React.RefObject<HTMLElement | null>>,
  onDismiss: () => void,
  options: { outside?: boolean } = {},
): void {
  const cb = useRef(onDismiss);
  cb.current = onDismiss;
  const insideRef = useRef(inside);
  insideRef.current = inside;
  const outside = options.outside ?? true;
  useEffect(() => {
    if (!active) return;
    const id = Symbol('layer');
    stack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) {
        e.stopPropagation();
        cb.current();
      }
    };
    const onPointer = (e: Event) => {
      if (!outside || stack[stack.length - 1] !== id) return;
      const t = e.target as Node | null;
      if (t && insideRef.current.some((r) => r.current?.contains(t))) return;
      cb.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active, outside]);
}

/** Keep Tab inside `ref` while active; restore focus to the opener afterwards. */
export function useFocusTrap(active: boolean, ref: React.RefObject<HTMLElement | null>, restore = true): void {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    const auto = el.querySelector<HTMLElement>('[data-autofocus]') ?? focusables(el)[0] ?? el;
    auto.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables(el);
      if (items.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || current === el)) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      if (restore && previous && document.contains(previous)) previous.focus();
    };
  }, [active, ref, restore]);
}

/** Roving focus over `selector` items inside a container (arrow keys, Home, End). */
export function rovingKeyDown(
  e: React.KeyboardEvent<HTMLElement>,
  selector: string,
  orientation: 'horizontal' | 'vertical' | 'both' = 'vertical',
): HTMLElement | null {
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
  );
  if (items.length === 0) return null;
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next = (orientation !== 'horizontal' && e.key === 'ArrowDown') || (orientation !== 'vertical' && e.key === 'ArrowRight');
  const prev = (orientation !== 'horizontal' && e.key === 'ArrowUp') || (orientation !== 'vertical' && e.key === 'ArrowLeft');
  let target: HTMLElement | undefined;
  if (next) target = items[(i + 1) % items.length];
  else if (prev) target = items[(i - 1 + items.length) % items.length];
  else if (e.key === 'Home') target = items[0];
  else if (e.key === 'End') target = items[items.length - 1];
  if (!target) return null;
  e.preventDefault();
  target.focus();
  return target;
}
