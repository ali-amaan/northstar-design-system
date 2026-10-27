'use client';
import { createContext, useContext, useEffect, useId, useRef } from 'react';
import { cx, mergeRefs, useControllable } from './hooks.js';
import { clamp, r2, starPath } from './math.js';

/* --------------------------------------------------------- CompassSwitch */

export interface CompassSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value' | 'defaultValue'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  ref?: React.Ref<HTMLButtonElement>;
}

const ROSE_TICKS = Array.from({ length: 8 }, (_, i) => i * 45);

/**
 * A switch whose thumb is a compass. Off, the needle rests at west; on, the
 * thumb travels across and the needle swings to north with a small overshoot,
 * the way a damped needle settles. The state also reads from the needle's
 * direction and the track fill, not colour alone.
 */
export function CompassSwitch({ checked, defaultChecked = false, onCheckedChange, className, children, onClick, ...rest }: CompassSwitchProps) {
  const [on, setOn] = useControllable(checked, defaultChecked, onCheckedChange);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOn(!on);
      }}
      className={cx('ns-fx-compass', className)}
      data-state={on ? 'on' : 'off'}
    >
      <span className="ns-fx-compass__track" aria-hidden="true">
        <span className="ns-fx-compass__thumb">
          <svg viewBox="0 0 20 20" focusable="false">
            {ROSE_TICKS.map((deg) => (
              <line key={deg} className={cx('ns-fx-compass__tick', deg % 90 === 0 && 'ns-fx-compass__tick--card')} x1="10" y1="1.6" x2="10" y2={deg % 90 === 0 ? 3.6 : 2.8} transform={`rotate(${deg} 10 10)`} />
            ))}
            <g className="ns-fx-compass__needle">
              <path className="ns-fx-compass__north" d="M10 3.6 11.6 10H8.4Z" />
              <path className="ns-fx-compass__south" d="M10 16.4 8.4 10H11.6Z" />
            </g>
            <circle cx="10" cy="10" r="1" className="ns-fx-compass__hub" />
          </svg>
        </span>
      </span>
      {children ? <span className="ns-fx-compass__label">{children}</span> : null}
    </button>
  );
}

/* --------------------------------------------------------- SextantSlider */

export interface SextantSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'type' | 'min' | 'max' | 'step' | 'onChange'> {
  label: React.ReactNode;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Values the thumb catches on while dragged (keyboard steps pass straight through). */
  detents?: number[];
  /** Catch distance for detents, in value units. Default 2 % of the range. */
  detentRange?: number;
  /** Formats the readout and `aria-valuetext`. */
  format?: (value: number) => string;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * A slider read like a sextant's vernier: a graduated scale whose ticks rise
 * as the index passes over them, a Plex Mono readout riding on the index and
 * optional detents marked with a star that the thumb catches on while
 * dragged. Built on a native range input, so keyboard, touch and assistive
 * technology work unchanged.
 */
export function SextantSlider({
  label,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  detents = [],
  detentRange,
  format = (v) => String(v),
  className,
  id,
  disabled,
  ref,
  ...rest
}: SextantSliderProps) {
  const auto = useId();
  const inputId = id ?? `ns-fx-slider-${auto}`;
  const [v, setV] = useControllable(value, defaultValue ?? min, onValueChange);
  const dragging = useRef(false);
  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);
  const span = max - min || 1;
  const p = clamp((v - min) / span, 0, 1);
  const catchAt = detentRange ?? span * 0.02;
  const steps = Math.round(span / step);
  const every = Math.max(1, Math.ceil(steps / 40));
  const ticks: number[] = [];
  for (let s = 0; s <= steps; s += every) ticks.push(min + s * step);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  const onDetent = detents.includes(v);
  const text = format(v);
  return (
    <div className={cx('ns-fx-sslider', disabled && 'ns-fx-is-disabled', className)} style={{ '--ns-fx-p': r2(p * 100) } as React.CSSProperties}>
      <div className="ns-fx-sslider__head">
        <label htmlFor={inputId} className="ns-fx-sslider__label">{label}</label>
      </div>
      <div className="ns-fx-sslider__scale">
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type="range"
          className="ns-fx-sslider__input"
          min={min}
          max={max}
          step={step}
          value={v}
          disabled={disabled}
          aria-valuetext={text}
          onPointerDown={(e) => {
            dragging.current = true;
            rest.onPointerDown?.(e);
          }}
          onChange={(e) => {
            let next = Number(e.currentTarget.value);
            if (dragging.current) {
              const near = detents.find((d) => Math.abs(d - next) <= catchAt);
              if (near !== undefined) next = near;
            }
            setV(next);
          }}
        />
        <span className="ns-fx-sslider__ticks" aria-hidden="true">
          {ticks.map((t, i) => {
            const at = (t - min) / span;
            const dist = Math.abs(at - p) * ticks.length;
            const lift = r2(1 + 1.4 * Math.max(0, 1 - dist / 3));
            const major = i % 5 === 0;
            return (
              <i
                key={t}
                className={cx('ns-fx-sslider__tick', major && 'ns-fx-sslider__tick--major', at <= p && 'ns-fx-sslider__tick--past')}
                style={{ left: `${r2(at * 100)}%`, '--ns-fx-lift': lift } as React.CSSProperties}
              />
            );
          })}
          {detents.map((d) => (
            <svg key={`d${d}`} className="ns-fx-sslider__detent" viewBox="0 0 8 8" style={{ left: `${r2(((d - min) / span) * 100)}%` }} data-on={d === v || undefined}>
              <path d={starPath(4, 4, 3.6, 0.8)} />
            </svg>
          ))}
        </span>
        <span className="ns-fx-sslider__rail" aria-hidden="true">
          <span className="ns-fx-sslider__index">
            <span key={onDetent ? `d${v}` : 'free'} className={cx('ns-fx-sslider__thumb', onDetent && 'ns-fx-sslider__thumb--detent')} />
            <output htmlFor={inputId} className="ns-fx-sslider__readout">{text}</output>
          </span>
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------- ConstellationCheckbox */

export interface ConstellationCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'defaultChecked'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Shows the mixed state (a single star-to-star line). */
  indeterminate?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * A checkbox whose tick is drawn as a constellation: three stars appear in
 * turn and lines join them star to star. A native input underneath keeps
 * Space, labels, forms and the mixed state working.
 */
export function ConstellationCheckbox({ checked, defaultChecked = false, onCheckedChange, indeterminate = false, className, children, onChange, ref, ...rest }: ConstellationCheckboxProps) {
  const [on, setOn] = useControllable(checked, defaultChecked, onCheckedChange);
  const inner = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx('ns-fx-ccheck', rest.disabled && 'ns-fx-is-disabled', className)} data-state={indeterminate ? 'mixed' : on ? 'on' : 'off'}>
      <input
        {...rest}
        ref={mergeRefs(ref, inner)}
        type="checkbox"
        className="ns-fx-ccheck__input"
        checked={on}
        onChange={(e) => {
          onChange?.(e);
          setOn(e.currentTarget.checked);
        }}
      />
      <span className="ns-fx-ccheck__box" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          {indeterminate ? (
            <g className="ns-fx-ccheck__mixed">
              <line className="ns-fx-ccheck__ln ns-fx-ccheck__ln--a" x1="4" y1="8" x2="12" y2="8" />
              <circle className="ns-fx-ccheck__st" cx="4" cy="8" r="1.35" />
              <circle className="ns-fx-ccheck__st ns-fx-ccheck__st--c" cx="12" cy="8" r="1.35" />
            </g>
          ) : (
            <g className="ns-fx-ccheck__mark">
              <line className="ns-fx-ccheck__ln ns-fx-ccheck__ln--a" x1="3.6" y1="8.4" x2="6.6" y2="11.4" />
              <line className="ns-fx-ccheck__ln ns-fx-ccheck__ln--b" x1="6.6" y1="11.4" x2="12.4" y2="4.6" />
              <circle className="ns-fx-ccheck__st ns-fx-ccheck__st--a" cx="3.6" cy="8.4" r="1.25" />
              <circle className="ns-fx-ccheck__st ns-fx-ccheck__st--b" cx="6.6" cy="11.4" r="1.35" />
              <path className="ns-fx-ccheck__st ns-fx-ccheck__st--c" d={starPath(12.4, 4.6, 2.4, 0.6)} />
            </g>
          )}
        </svg>
      </span>
      {children ? <span className="ns-fx-ccheck__label">{children}</span> : null}
    </label>
  );
}

/* ------------------------------------------------------------ RadioOrbit */

interface OrbitCtx {
  name: string;
  value: string;
  set: (v: string) => void;
  disabled: boolean;
}
const RadioOrbitContext = createContext<OrbitCtx | null>(null);

export interface RadioOrbitGroupProps extends Omit<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange' | 'defaultValue'> {
  legend: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  ref?: React.Ref<HTMLFieldSetElement>;
}

/** A radio group whose options are planets: the chosen one gains a body and a moon that makes one orbit and settles at north. */
export function RadioOrbitGroup({ legend, value, defaultValue = '', onValueChange, name, orientation = 'vertical', disabled = false, className, children, ...rest }: RadioOrbitGroupProps) {
  const auto = useId();
  const [v, setV] = useControllable(value, defaultValue, onValueChange);
  return (
    <fieldset {...rest} disabled={disabled} className={cx('ns-fx-rorbit', `ns-fx-rorbit--${orientation}`, className)}>
      <legend className="ns-fx-rorbit__legend">{legend}</legend>
      <RadioOrbitContext.Provider value={{ name: name ?? `ns-fx-orbit-${auto}`, value: v, set: setV, disabled }}>
        <div className="ns-fx-rorbit__options">{children}</div>
      </RadioOrbitContext.Provider>
    </fieldset>
  );
}

export interface RadioOrbitProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'name' | 'value' | 'checked'> {
  value: string;
  /** Secondary line under the label. */
  description?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

export function RadioOrbit({ value, description, className, children, disabled, onChange, ...rest }: RadioOrbitProps) {
  const ctx = useContext(RadioOrbitContext);
  if (!ctx) throw new Error('RadioOrbit must be used inside RadioOrbitGroup');
  const checked = ctx.value === value;
  return (
    <label className={cx('ns-fx-rorbit__option', (disabled || ctx.disabled) && 'ns-fx-is-disabled', className)} data-state={checked ? 'on' : 'off'}>
      <input
        {...rest}
        type="radio"
        className="ns-fx-rorbit__input"
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={(e) => {
          onChange?.(e);
          if (e.currentTarget.checked) ctx.set(value);
        }}
      />
      <span className="ns-fx-rorbit__mark" aria-hidden="true">
        <svg viewBox="0 0 20 20" focusable="false">
          <circle className="ns-fx-rorbit__ring" cx="10" cy="10" r="7.5" />
          <circle className="ns-fx-rorbit__planet" cx="10" cy="10" r="3.4" />
          <g className="ns-fx-rorbit__arm">
            <circle className="ns-fx-rorbit__moon" cx="10" cy="2.5" r="1.6" />
          </g>
        </svg>
      </span>
      <span className="ns-fx-rorbit__text">
        <span className="ns-fx-rorbit__label">{children}</span>
        {description ? <span className="ns-fx-rorbit__desc">{description}</span> : null}
      </span>
    </label>
  );
}

/* --------------------------------------------------------- GraticuleInput */

export interface GraticuleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: React.ReactNode;
  /** Help text under the field. */
  hint?: React.ReactNode;
  /** Message shown, and announced, when the value is invalid. The rule turns dashed (no colour change alone). */
  error?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * A text field that, on focus, draws a fine graduated rule beneath itself
 * from the left, like the scale engraved under a sight. Invalid state is a
 * dashed rule plus the message.
 */
export function GraticuleInput({ label, hint, error, id, className, ref, ...rest }: GraticuleInputProps) {
  const auto = useId();
  const inputId = id ?? `ns-fx-input-${auto}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-error` : undefined;
  const describedBy = [rest['aria-describedby'], hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('ns-fx-ginput', error ? 'ns-fx-ginput--invalid' : null, rest.disabled && 'ns-fx-is-disabled', className)}>
      <label htmlFor={inputId} className="ns-fx-ginput__label">{label}</label>
      <span className="ns-fx-ginput__field">
        <input {...rest} ref={ref} id={inputId} className="ns-fx-ginput__input" aria-invalid={error ? true : rest['aria-invalid']} aria-describedby={describedBy} />
        <span className="ns-fx-ginput__rule" aria-hidden="true" />
      </span>
      {hint ? <span id={hintId} className="ns-fx-ginput__hint">{hint}</span> : null}
      {error ? <span id={errId} className="ns-fx-ginput__error">{error}</span> : null}
    </div>
  );
}
