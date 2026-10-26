'use client';
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNorthstar } from './provider.js';
import { cx, mergeRefs, useControllable, type Size } from './internal/util.js';
import { Check, ChevronDown, Close, Minus, Plus, Search } from './internal/icons.js';

/* ------------------------------------------------------------------ Field */

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}
const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Override the generated control id. */
  id?: string;
  children: React.ReactNode;
}

/** Label, description and error for one control; wires ids and aria-* to the control inside. */
export function Field({ label, description, error, required = false, disabled = false, id, className, children, ...rest }: FieldProps) {
  const auto = useId();
  const controlId = id ?? `ns-field-${auto}`;
  const descId = description ? `${controlId}-desc` : undefined;
  const errId = error ? `${controlId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;
  const value = useMemo(
    () => ({ id: controlId, describedBy, invalid: Boolean(error), required, disabled }),
    [controlId, describedBy, error, required, disabled],
  );
  return (
    <div {...rest} className={cx('ns-field', className)} data-invalid={error ? true : undefined}>
      <label className="ns-field__label" htmlFor={controlId}>
        {label}
        {required && (
          <span className="ns-field__required" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
      {description && (
        <p id={descId} className="ns-field__description">
          {description}
        </p>
      )}
      {error && (
        <p id={errId} className="ns-field__error">
          <span aria-hidden="true">{'! '}</span>
          {error}
        </p>
      )}
    </div>
  );
}

interface FieldInput {
  id?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  invalid?: boolean | undefined;
  'aria-describedby'?: string | undefined;
}

/** Field wiring for a control: id, aria-describedby, aria-invalid, required, disabled. */
export function useFieldProps(props: FieldInput) {
  const field = useContext(FieldContext);
  const invalid = props.invalid ?? field?.invalid ?? false;
  return {
    aria: {
      id: props.id ?? field?.id,
      disabled: props.disabled ?? field?.disabled,
      required: props.required ?? field?.required,
      'aria-describedby': [props['aria-describedby'], field?.describedBy].filter(Boolean).join(' ') || undefined,
      'aria-invalid': invalid || undefined,
    },
    invalid,
  };
}

/* ------------------------------------------------------------------ Input */

interface ValueProps<T> {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue'>,
    ValueProps<string> {
  size?: Size;
  invalid?: boolean;
  /** Content drawn inside the start edge (an icon, a unit). */
  start?: React.ReactNode;
  end?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ size = 'md', invalid, start, end, className, value, defaultValue, onValueChange, onChange, style, ...rest }: InputProps) {
  const { aria, invalid: isInvalid } = useFieldProps({ ...rest, invalid });
  const [v, setV] = useControllable(value, defaultValue ?? '', onValueChange);
  return (
    <div className={cx('ns-input', `ns-size-${size}`, isInvalid && 'ns-invalid', aria.disabled && 'ns-disabled', className)} style={style}>
      {start && <span className="ns-input__adornment">{start}</span>}
      <input
        {...rest}
        {...aria}
        className="ns-input__control"
        value={v}
        onChange={(e) => {
          onChange?.(e);
          setV(e.target.value);
        }}
      />
      {end && <span className="ns-input__adornment">{end}</span>}
    </div>
  );
}

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue'>,
    ValueProps<string> {
  invalid?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function Textarea({ invalid, className, value, defaultValue, onValueChange, onChange, ...rest }: TextareaProps) {
  const { aria, invalid: isInvalid } = useFieldProps({ ...rest, invalid });
  const [v, setV] = useControllable(value, defaultValue ?? '', onValueChange);
  return (
    <textarea
      {...rest}
      {...aria}
      className={cx('ns-textarea', isInvalid && 'ns-invalid', className)}
      value={v}
      onChange={(e) => {
        onChange?.(e);
        setV(e.target.value);
      }}
    />
  );
}

/* ----------------------------------------------------------------- Select */

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'value' | 'defaultValue'>,
    ValueProps<string> {
  options: Option[];
  placeholder?: string;
  size?: Size;
  invalid?: boolean;
  ref?: React.Ref<HTMLSelectElement>;
}

/** A styled native select: platform keyboard and screen-reader behaviour for free. */
export function Select({ options, placeholder, size = 'md', invalid, className, value, defaultValue, onValueChange, onChange, style, ...rest }: SelectProps) {
  const { aria, invalid: isInvalid } = useFieldProps({ ...rest, invalid });
  const [v, setV] = useControllable(value, defaultValue ?? '', onValueChange);
  return (
    <div className={cx('ns-select', `ns-size-${size}`, isInvalid && 'ns-invalid', className)} style={style}>
      <select
        {...rest}
        {...aria}
        className="ns-select__control"
        value={v}
        onChange={(e) => {
          onChange?.(e);
          setV(e.target.value);
        }}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="ns-select__chevron" aria-hidden="true">
        <ChevronDown />
      </span>
    </div>
  );
}

/* --------------------------------------------------------------- Combobox */

export interface ComboboxProps extends ValueProps<string | null> {
  options: Option[];
  placeholder?: string;
  size?: Size;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  /** Custom filter; defaults to a case-insensitive substring match on the label. */
  filter?: (option: Option, query: string) => boolean;
}

export function Combobox({ options, placeholder, size = 'md', invalid, className, value, defaultValue, onValueChange, filter, ...rest }: ComboboxProps) {
  const { messages } = useNorthstar();
  const { aria, invalid: isInvalid } = useFieldProps({ ...rest, invalid });
  const [selected, setSelected] = useControllable<string | null>(value, defaultValue ?? null, onValueChange);
  const selectedLabel = options.find((o) => o.value === selected)?.label ?? '';
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `ns-combobox-${useId().replace(/:/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => setQuery(selectedLabel), [selectedLabel]);

  const match = filter ?? ((o: Option, q: string) => o.label.toLowerCase().includes(q.toLowerCase()));
  const visible = query === selectedLabel ? options : options.filter((o) => match(o, query));

  const commit = (o: Option | undefined) => {
    if (!o || o.disabled) return;
    setSelected(o.value);
    setQuery(o.label);
    setOpen(false);
    setActive(-1);
  };
  const move = (delta: number) => {
    if (!open) setOpen(true);
    if (visible.length === 0) return;
    let i = active;
    for (let n = 0; n < visible.length; n++) {
      i = (i + delta + visible.length) % visible.length;
      if (!visible[i]?.disabled) break;
    }
    setActive(i);
  };

  return (
    <div
      ref={rootRef}
      className={cx('ns-combobox', className)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          setQuery(selectedLabel);
        }
      }}
    >
      <div className={cx('ns-input', `ns-size-${size}`, isInvalid && 'ns-invalid', aria.disabled && 'ns-disabled')}>
        <input
          {...aria}
          aria-label={rest['aria-label']}
          className="ns-input__control"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              move(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              move(-1);
            } else if (e.key === 'Enter' && open && active >= 0) {
              e.preventDefault();
              commit(visible[active]);
            } else if (e.key === 'Escape' && open) {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              setQuery(selectedLabel);
            }
          }}
        />
        <span className="ns-select__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </div>
      <ul id={listId} role="listbox" className="ns-combobox__list ns-pop" hidden={!open} aria-label={rest['aria-label']}>
        {visible.map((o, i) => (
          <li
            key={o.value}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={o.value === selected}
            aria-disabled={o.disabled || undefined}
            data-active={i === active || undefined}
            className="ns-option"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => commit(o)}
          >
            <span>{o.label}</span>
            {o.value === selected && <Check />}
          </li>
        ))}
      </ul>
      {open && visible.length === 0 && (
        <div className="ns-combobox__empty ns-pop" role="status">
          {messages.noResults}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Checkbox */

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'defaultChecked'> {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

/** Native checkbox with rounded corners. */
export function Checkbox({ checked, defaultChecked, indeterminate = false, onCheckedChange, onChange, className, children, ref, style, ...rest }: CheckboxProps) {
  const [on, setOn] = useControllable(checked, defaultChecked ?? false, onCheckedChange);
  const inner = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={cx('ns-check', rest.disabled && 'ns-disabled', className)} style={style}>
      <input
        {...rest}
        ref={mergeRefs(ref, inner)}
        type="checkbox"
        className="ns-check__input"
        checked={on}
        onChange={(e) => {
          onChange?.(e);
          setOn(e.target.checked);
        }}
      />
      <span className="ns-check__box" aria-hidden="true">
        {indeterminate ? <Minus /> : <Check />}
      </span>
      {children && <span className="ns-check__label">{children}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ Radio */

interface RadioContextValue {
  name: string;
  value: string;
  set: (v: string) => void;
  disabled: boolean;
}
const RadioContext = createContext<RadioContextValue | null>(null);

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>,
    ValueProps<string> {
  name?: string;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export function RadioGroup({ name, value, defaultValue, onValueChange, disabled = false, orientation = 'vertical', label, className, children, ...rest }: RadioGroupProps) {
  const auto = useId();
  const [v, setV] = useControllable(value, defaultValue ?? '', onValueChange);
  return (
    <div role="radiogroup" aria-label={label} aria-orientation={orientation} {...rest} className={cx('ns-radio-group', `ns-radio-group--${orientation}`, className)}>
      <RadioContext.Provider value={{ name: name ?? `ns-radio-${auto}`, value: v, set: setV, disabled }}>{children}</RadioContext.Provider>
    </div>
  );
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  value: string;
  children?: React.ReactNode;
}

export function Radio({ value, children, className, disabled, style, onChange, ...rest }: RadioProps) {
  const group = useContext(RadioContext);
  const isDisabled = disabled ?? group?.disabled;
  return (
    <label className={cx('ns-check ns-radio', isDisabled && 'ns-disabled', className)} style={style}>
      <input
        {...rest}
        type="radio"
        className="ns-check__input"
        name={group?.name ?? rest.name}
        value={value}
        disabled={isDisabled}
        checked={group ? group.value === value : rest.checked}
        onChange={(e) => {
          onChange?.(e);
          if (e.target.checked) group?.set(value);
        }}
      />
      <span className="ns-check__box" aria-hidden="true" />
      {children && <span className="ns-check__label">{children}</span>}
    </label>
  );
}

/* ----------------------------------------------------------------- Switch */

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children?: React.ReactNode;
}

export function Switch({ checked, defaultChecked, onCheckedChange, className, children, onClick, ...rest }: SwitchProps) {
  const { aria } = useFieldProps(rest);
  const ariaNoRequired = { ...aria, required: undefined };
  const [on, setOn] = useControllable(checked, defaultChecked ?? false, onCheckedChange);
  const button = (
    <button
      type="button"
      {...rest}
      {...ariaNoRequired}
      role="switch"
      aria-checked={on}
      className={cx('ns-switch', !children && className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) setOn(!on);
      }}
    >
      <span className="ns-switch__thumb" aria-hidden="true" />
    </button>
  );
  if (!children) return button;
  return (
    <label className={cx('ns-switch-label', className)}>
      {button}
      <span>{children}</span>
    </label>
  );
}

/* ----------------------------------------------------------------- Slider */

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step'>,
    ValueProps<number> {
  min?: number;
  max?: number;
  step?: number;
  ref?: React.Ref<HTMLInputElement>;
}

/** Native range input: arrow keys, Page Up/Down, Home and End work as on the platform. */
export function Slider({ min = 0, max = 100, step = 1, value, defaultValue, onValueChange, onChange, className, style, ...rest }: SliderProps) {
  const { aria } = useFieldProps(rest);
  const [v, setV] = useControllable(value, defaultValue ?? min, onValueChange);
  const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  return (
    <input
      {...rest}
      {...aria}
      type="range"
      min={min}
      max={max}
      step={step}
      value={v}
      className={cx('ns-slider', className)}
      style={{ ...style, ['--ns-slider-fill' as string]: `${pct}%` }}
      onChange={(e) => {
        onChange?.(e);
        setV(Number(e.target.value));
      }}
    />
  );
}

/* ------------------------------------------------------------ NumberInput */

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'type' | 'min' | 'max' | 'step'>,
    ValueProps<number | null> {
  min?: number;
  max?: number;
  step?: number;
  size?: Size;
  invalid?: boolean;
}

function clamp(n: number, min?: number, max?: number) {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

export function NumberInput({ min, max, step = 1, size = 'md', invalid, value, defaultValue, onValueChange, className, style, onKeyDown, onBlur, ...rest }: NumberInputProps) {
  const { messages } = useNorthstar();
  const { aria, invalid: isInvalid } = useFieldProps({ ...rest, invalid });
  const [v, setV] = useControllable<number | null>(value, defaultValue ?? null, onValueChange);
  const [draft, setDraft] = useState(v === null ? '' : String(v));
  useEffect(() => setDraft(v === null ? '' : String(v)), [v]);
  const bump = (dir: 1 | -1) => setV(clamp((v ?? min ?? 0) + dir * step, min, max));
  const commitDraft = () => {
    if (draft.trim() === '') return setV(null);
    const n = Number(draft.replace(',', '.'));
    if (Number.isFinite(n)) setV(clamp(n, min, max));
    else setDraft(v === null ? '' : String(v));
  };
  return (
    <div className={cx('ns-input ns-number', `ns-size-${size}`, isInvalid && 'ns-invalid', aria.disabled && 'ns-disabled', className)} style={style}>
      <input
        {...rest}
        {...aria}
        className="ns-input__control"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={v ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => {
          commitDraft();
          onBlur?.(e);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            bump(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            bump(-1);
          } else if (e.key === 'Home' && min !== undefined) {
            e.preventDefault();
            setV(min);
          } else if (e.key === 'End' && max !== undefined) {
            e.preventDefault();
            setV(max);
          } else if (e.key === 'Enter') commitDraft();
        }}
      />
      <span className="ns-number__steppers">
        <button
          type="button"
          tabIndex={-1}
          aria-label={messages.decrement}
          disabled={aria.disabled || (min !== undefined && v !== null && v <= min)}
          onClick={() => bump(-1)}
        >
          <Minus />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label={messages.increment}
          disabled={aria.disabled || (max !== undefined && v !== null && v >= max)}
          onClick={() => bump(1)}
        >
          <Plus />
        </button>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ SearchInput */

export interface SearchInputProps extends Omit<InputProps, 'type' | 'start' | 'end'> {
  onClear?: () => void;
}

export function SearchInput({ value, defaultValue, onValueChange, onClear, placeholder, ref, onKeyDown, ...rest }: SearchInputProps) {
  const { messages } = useNorthstar();
  const [v, setV] = useControllable(value, defaultValue ?? '', onValueChange);
  const inner = useRef<HTMLInputElement>(null);
  const clear = () => {
    setV('');
    onClear?.();
  };
  return (
    <Input
      aria-label={rest['aria-label'] ?? messages.search}
      placeholder={placeholder ?? messages.search}
      {...rest}
      ref={mergeRefs(ref, inner)}
      type="search"
      value={v}
      onValueChange={setV}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === 'Escape' && v) {
          e.preventDefault();
          e.stopPropagation();
          clear();
        }
      }}
      start={<Search />}
      end={
        v ? (
          <button
            type="button"
            className="ns-input__clear"
            aria-label={messages.clear}
            onClick={() => {
              clear();
              inner.current?.focus();
            }}
          >
            <Close />
          </button>
        ) : undefined
      }
    />
  );
}
