'use client';
import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { cx, reducedMotionNow, useTimers } from './hooks.js';

/* ---------------------------------------------------------- TooltipCompass */

export interface TooltipCompassProps {
  content: React.ReactNode;
  /** The trigger: one focusable element. It receives `aria-describedby` while the tooltip shows. */
  children: React.ReactElement<{ 'aria-describedby'?: string | undefined }>;
  side?: 'top' | 'bottom';
  /** Hover delay in ms before showing. Default 250. Focus shows at once. */
  delay?: number;
  className?: string;
}

/**
 * A tooltip whose arrow is a compass needle: it swings in and settles
 * pointing at its trigger, Glacier end toward the thing described. Shows on
 * hover and keyboard focus, hides on leave, blur and Escape.
 */
export function TooltipCompass({ content, children, side = 'top', delay = 250, className }: TooltipCompassProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), ms);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  const described = [children.props['aria-describedby'], open ? id : null].filter(Boolean).join(' ') || undefined;
  return (
    <span
      className={cx('ns-fx-tipc', className)}
      data-side={side}
      onPointerEnter={(e) => e.pointerType !== 'touch' && show(delay)}
      onPointerLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          hide();
        }
      }}
    >
      {cloneElement(children, { 'aria-describedby': described })}
      {open ? (
        <span role="tooltip" id={id} className="ns-fx-tipc__bubble">
          {content}
          <svg className="ns-fx-tipc__needle" viewBox="0 0 10 16" aria-hidden="true" focusable="false">
            <path className="ns-fx-tipc__tail" d="M5 0 7.2 8H2.8Z" />
            <path className="ns-fx-tipc__head" d="M5 16 2.8 8H7.2Z" />
          </svg>
        </span>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------- ToastComet */

export interface ToastCometProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional action, such as a Button. */
  action?: React.ReactNode;
  /** Visibility. When it turns false the toast leaves, then unmounts. Default true. */
  open?: boolean;
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * A toast that arrives like a comet: it comes in along a short arc (two
 * axes on different curves) with a tail of light that thins and fades as it
 * settles. Announced politely as a status. Reduced motion: it just appears.
 */
export function ToastComet({ title, description, action, open = true, onDismiss, dismissLabel = 'Dismiss', className, ...rest }: ToastCometProps) {
  const [present, setPresent] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const after = useTimers();
  useEffect(() => {
    if (open) {
      setPresent(true);
      setLeaving(false);
    } else if (present) {
      if (reducedMotionNow()) return setPresent(false);
      setLeaving(true);
      after(() => setPresent(false), 220);
    }
  }, [open]);
  if (!present) return null;
  return (
    <div {...rest} role="status" className={cx('ns-fx-comet', className)} data-leaving={leaving || undefined}>
      <div className="ns-fx-comet__x">
        <div className="ns-fx-comet__y">
          <span className="ns-fx-comet__tail" aria-hidden="true" />
          <div className="ns-fx-comet__card">
            <span className="ns-fx-comet__head" aria-hidden="true" />
            <div className="ns-fx-comet__text">
              <div className="ns-fx-comet__title">{title}</div>
              {description ? <div className="ns-fx-comet__desc">{description}</div> : null}
            </div>
            {action ? <div className="ns-fx-comet__action">{action}</div> : null}
            {onDismiss ? (
              <button type="button" className="ns-fx-comet__close" aria-label={dismissLabel} onClick={onDismiss}>
                <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false">
                  <path d="M3 3 9 9M9 3 3 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
