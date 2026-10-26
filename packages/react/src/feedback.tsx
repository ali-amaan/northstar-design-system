'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Portal, useNorthstar, type Material } from './provider.js';
import { cx, type Tone } from './internal/util.js';
import { Close } from './internal/icons.js';

/* ------------------------------------------------------------------ Toast */

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: Tone;
  /** ms before auto-dismiss; 0 keeps it until dismissed. Default 5000. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  id?: string;
  /** `glass` or `solid`. Defaults to the provider's material. */
  material?: Material;
}

export interface ToastRecord extends ToastOptions {
  id: string;
}

type Listener = () => void;
let toasts: ToastRecord[] = [];
const listeners = new Set<Listener>();
let seq = 0;
const emit = () => listeners.forEach((l) => l());
const EMPTY: ToastRecord[] = [];

/** Imperative toaster. Render one <Toaster /> near the root. */
export const toast = Object.assign(
  (options: ToastOptions): string => {
    const id = options.id ?? `ns-toast-${++seq}`;
    toasts = [...toasts.filter((t) => t.id !== id), { ...options, id }];
    emit();
    return id;
  },
  {
    dismiss(id?: string) {
      toasts = id ? toasts.filter((t) => t.id !== id) : [];
      emit();
    },
  },
);

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useToasts(): ToastRecord[] {
  return useSyncExternalStore(subscribe, () => toasts, () => EMPTY);
}

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  /** `glass` or `solid`. Defaults to the provider's material. */
  material?: Material;
}

/** One toast surface. Usually rendered by <Toaster />. */
export function Toast({ title, description, tone = 'neutral', action, onDismiss, material, className, ...rest }: ToastProps) {
  const { messages, material: fallback } = useNorthstar();
  return (
    <div {...rest} className={cx('ns-toast', `ns-material--${material ?? fallback}`, tone === 'signal' && 'ns-tone-signal', className)}>
      <div className="ns-toast__text">
        <div className="ns-toast__title">{title}</div>
        {description && <div className="ns-toast__description">{description}</div>}
      </div>
      {action && (
        <button type="button" className="ns-button ns-button--secondary ns-size-sm" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button type="button" className="ns-button ns-button--ghost ns-size-sm ns-icon-button" aria-label={messages.dismiss} onClick={onDismiss}>
          <Close />
        </button>
      )}
    </div>
  );
}

function TimedToast({ record }: { record: ToastRecord }) {
  const { id, duration = 5000, ...rest } = record;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = () => {
    if (duration > 0) timer.current = setTimeout(() => toast.dismiss(id), duration);
  };
  useEffect(() => {
    start();
    return () => clearTimeout(timer.current);
  }, [id, duration]);
  return (
    <li className="ns-toaster__item" onPointerEnter={() => clearTimeout(timer.current)} onPointerLeave={start}>
      <Toast {...rest} onDismiss={() => toast.dismiss(id)} />
    </li>
  );
}

export interface ToasterProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center';
}

/** Polite live region that shows toasts queued with `toast()`. */
export function Toaster({ position = 'bottom-right' }: ToasterProps) {
  const list = useToasts();
  const { messages } = useNorthstar();
  return (
    <Portal>
      <section aria-label={messages.notifications} className={cx('ns-toaster', `ns-toaster--${position}`)}>
        <div role="status" aria-live="polite">
          <ol className="ns-toaster__list">
            {list.map((t) => (
              <TimedToast key={t.id} record={t} />
            ))}
          </ol>
        </div>
      </section>
    </Portal>
  );
}

/* ----------------------------------------------------------------- Banner */

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  tone?: Tone;
  /** Urgent banners interrupt the screen reader (role="alert"). */
  urgent?: boolean;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onDismiss?: () => void;
}

/** Page- or section-level message. Status is told by label and shape, never by red or green. */
export function Banner({ title, tone = 'neutral', urgent = false, icon, actions, onDismiss, className, children, ...rest }: BannerProps) {
  const { messages } = useNorthstar();
  return (
    <div role={urgent ? 'alert' : 'status'} {...rest} className={cx('ns-banner', tone === 'signal' && 'ns-tone-signal', className)}>
      {icon && <span className="ns-banner__icon" aria-hidden="true">{icon}</span>}
      <div className="ns-banner__text">
        {title && <strong className="ns-banner__title">{title}</strong>}
        {children && <div className="ns-banner__body">{children}</div>}
      </div>
      {actions && <div className="ns-banner__actions">{actions}</div>}
      {onDismiss && (
        <button type="button" className="ns-button ns-button--ghost ns-size-sm ns-icon-button" aria-label={messages.dismiss} onClick={onDismiss}>
          <Close />
        </button>
      )}
    </div>
  );
}
