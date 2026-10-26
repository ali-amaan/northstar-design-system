'use client';
// Flow: a guided sequence of steps with one clear next action. The header
// shows where you are (a sliding marker over the step list and a progress
// rail); the content changes with a view transition where supported and a
// directional CSS slide elsewhere; NextAction is the single primary button.
import { Children, createContext, isValidElement, useContext, useEffect, useId, useRef, useState } from 'react';
import { useNorthstar } from './provider.js';
import { Button, type ButtonProps } from './actions.js';
import { canViewTransition, withViewTransition } from './motion.js';
import { cx, useControllable } from './internal/util.js';
import { Check, ChevronLeft, ChevronRight } from './internal/icons.js';

export interface FlowStepProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  value: string;
  title: React.ReactNode;
  /** Plain-text title for announcements; defaults to `title` when it is a string. */
  textTitle?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Marks the step done even when it is not behind the current one. */
  complete?: boolean;
  /** Blocks NextAction from leaving this step. */
  blocked?: boolean | undefined;
}

interface FlowContextValue {
  value: string;
  index: number;
  count: number;
  steps: FlowStepProps[];
  baseId: string;
  go: (value: string) => void;
  next: () => void;
  back: () => void;
  onComplete?: (() => void) | undefined;
}

const FlowContext = createContext<FlowContextValue | null>(null);

/** The current flow, or null outside one. */
export function useFlow(): FlowContextValue | null {
  return useContext(FlowContext);
}

export interface FlowStepsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called when NextAction is pressed on the last step. */
  onComplete?: (() => void) | undefined;
  /** Only completed steps and the next one can be jumped to. Default true. */
  linear?: boolean;
  /** Accessible name of the step list. */
  label?: string;
  /** Hide the step list and show only the progress rail. */
  compact?: boolean;
  children: React.ReactNode;
}

function stepTitle(s: FlowStepProps): string {
  return s.textTitle ?? (typeof s.title === 'string' ? s.title : s.value);
}

export function FlowSteps({ value, defaultValue, onValueChange, onComplete, linear = true, label, compact = false, className, children, ...rest }: FlowStepsProps) {
  const { messages } = useNorthstar();
  const steps = Children.toArray(children)
    .filter((c): c is React.ReactElement<FlowStepProps> => isValidElement(c) && typeof (c.props as FlowStepProps).value === 'string')
    .map((c) => c.props);
  const [v, setV] = useControllable(value, defaultValue ?? steps[0]?.value ?? '', onValueChange);
  const index = Math.max(0, steps.findIndex((s) => s.value === v));
  const prev = useRef(index);
  const stage = useRef<HTMLDivElement>(null);
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  const [vt, setVt] = useState(false);
  useEffect(() => setVt(canViewTransition()), []);
  const baseId = `ns-flow-${useId().replace(/:/g, '')}`;

  const go = (target: string) => {
    const to = steps.findIndex((s) => s.value === target);
    if (to < 0 || target === v) return;
    const d = to > prev.current ? 'forward' : 'back';
    prev.current = to;
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-ns-flow-dir', d);
    withViewTransition(() => {
      setDir(d);
      setV(target);
    }, stage.current);
  };
  const first = useRef(true);
  useEffect(() => {
    prev.current = index;
    if (first.current) {
      first.current = false;
      return;
    }
    // The step that held focus has gone; hand focus to the new step's title.
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (!active || active === document.body || !active.isConnected || stage.current?.contains(active)) {
      stage.current?.querySelector<HTMLElement>('.ns-flow__title')?.focus({ preventScroll: true });
    }
  }, [index]);

  const ctx: FlowContextValue = {
    value: steps[index]?.value ?? v,
    index,
    count: steps.length,
    steps,
    baseId,
    go,
    next: () => {
      if (steps[index]?.blocked) return;
      if (index < steps.length - 1) go(steps[index + 1]!.value);
      else onComplete?.();
    },
    back: () => index > 0 && go(steps[index - 1]!.value),
    onComplete,
  };
  const current = steps[index];
  const progress = steps.length > 1 ? index / (steps.length - 1) : 1;

  return (
    <FlowContext.Provider value={ctx}>
      <div {...rest} className={cx('ns-flow', vt && 'ns-flow--vt', compact && 'ns-flow--compact', className)} data-direction={dir}>
        <div className="ns-flow__head">
          {!compact && (
            <ol className="ns-flow__steps" aria-label={label ?? messages.flowSteps}>
              {steps.map((s, i) => {
                const done = s.complete || i < index;
                const reachable = !linear || done || i <= index + 1;
                const state = i === index ? 'current' : done ? 'complete' : 'upcoming';
                return (
                  <li key={s.value} className="ns-flow__item" data-state={state}>
                    <button
                      type="button"
                      className="ns-flow__step"
                      aria-current={i === index ? 'step' : undefined}
                      disabled={!reachable || (i === index + 1 && !!steps[index]?.blocked)}
                      onClick={() => go(s.value)}
                    >
                      <span className="ns-flow__mark" aria-hidden="true">
                        {done && i !== index ? <Check /> : s.icon ?? <span className="ns-flow__num">{i + 1}</span>}
                      </span>
                      <span className="ns-flow__label">{s.title}</span>
                      <span className="ns-visually-hidden">{state === 'complete' ? `, ${messages.flowComplete}` : ''}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <div
            className="ns-flow__rail"
            role="progressbar"
            aria-label={messages.flowProgress}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
            aria-valuetext={current ? `${messages.step(index + 1, steps.length)}: ${stepTitle(current)}` : undefined}
          >
            <span className="ns-flow__fill" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
        <div ref={stage} className="ns-flow__stage">
          {Children.toArray(children).map((c) =>
            isValidElement(c) && (c.props as FlowStepProps).value === ctx.value ? c : null,
          )}
        </div>
      </div>
    </FlowContext.Provider>
  );
}

/** One step. Renders only while it is the current step. */
export function FlowStep({ value, title, textTitle, description, icon, complete, blocked, className, children, ...rest }: FlowStepProps) {
  const ctx = useFlow();
  void icon;
  void complete;
  void blocked;
  void textTitle;
  const id = `${ctx?.baseId ?? 'ns-flow'}-${value}-title`;
  return (
    <section {...rest} key={value} aria-labelledby={id} className={cx('ns-flow__panel', className)} data-step={value}>
      <header className="ns-flow__panel-head">
        {ctx && <span className="ns-flow__eyebrow">{`${ctx.index + 1} / ${ctx.count}`}</span>}
        <h3 id={id} className="ns-flow__title" tabIndex={-1}>
          {title}
        </h3>
        {description && <p className="ns-flow__description">{description}</p>}
      </header>
      <div className="ns-flow__body">{children}</div>
    </section>
  );
}

export interface NextActionProps extends Omit<ButtonProps, 'variant'> {
  /** Shows a quiet Back button before the next action. Default true inside a flow. */
  showBack?: boolean;
  /** Label on the last step. */
  finishLabel?: React.ReactNode | undefined;
  /** Secondary content between Back and the next action (a hint, a cost). */
  hint?: React.ReactNode | undefined;
}

/**
 * The one clear next action. Inside FlowSteps it advances (and names the step
 * it leads to); on the last step it calls `onComplete`. Outside a flow it is a
 * primary button with a trailing arrow that slides on hover.
 */
export function NextAction({ showBack = true, finishLabel, hint, children, onClick, className, disabled, ...rest }: NextActionProps) {
  const ctx = useFlow();
  const { messages } = useNorthstar();
  const last = ctx ? ctx.index >= ctx.count - 1 : false;
  const nextStep = ctx && !last ? ctx.steps[ctx.index + 1] : undefined;
  const label = children ?? (last ? finishLabel ?? messages.flowFinish : nextStep ? messages.flowNext(stepTitle(nextStep)) : messages.flowFinish);
  return (
    <div className="ns-next-action">
      {ctx && showBack && ctx.index > 0 && (
        <Button variant="ghost" onClick={ctx.back} className="ns-next-action__back">
          <ChevronLeft />
          {messages.flowBack}
        </Button>
      )}
      {hint && <span className="ns-next-action__hint">{hint}</span>}
      <Button
        {...rest}
        variant="primary"
        disabled={disabled || (ctx ? !!ctx.steps[ctx.index]?.blocked : false)}
        className={cx('ns-next-action__go', className)}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) ctx?.next();
        }}
      >
        {label}
        <span className="ns-next-action__arrow" aria-hidden="true">
          {last ? <Check /> : <ChevronRight />}
        </span>
      </Button>
    </div>
  );
}

export const Flow = { Steps: FlowSteps, Step: FlowStep, Next: NextAction };
