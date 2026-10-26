'use client';
import { useNorthstar, type Material } from './provider.js';
import { usePointerTracking } from './internal/interaction.js';
import { cx, mergeRefs, type Size, type Tone } from './internal/util.js';
import { rovingKeyDown } from './internal/layers.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  tone?: Tone;
  loading?: boolean;
  /** Accessible text announced while loading. */
  loadingLabel?: string;
  /** Shows the success check (it draws in, then rests). Purely presentational; announce the outcome elsewhere too. */
  success?: boolean;
  /** Accessible text added while `success` is set. Default "Done". */
  successLabel?: string;
  /** `glass` gives secondary and ghost buttons the liquid-glass material. Default `solid`. */
  material?: Material;
  /** Leans toward the pointer by a few pixels and springs back. Pointer only; off under reduced motion. */
  magnetic?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/** The north star: a fixed four-point mark with an orbit turning round it while work runs. */
function NorthStarSpinner() {
  return (
    <svg className="ns-spinner ns-spinner--star" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path className="ns-spinner__star" d="M8 3 8.8 7.2 13 8 8.8 8.8 8 13 7.2 8.8 3 8 7.2 7.2Z" fill="currentColor" />
      <circle className="ns-spinner__orbit" cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function SuccessCheck() {
  return (
    <svg className="ns-button__check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
    </svg>
  );
}

export function Button({
  variant = 'secondary',
  size = 'md',
  tone = 'neutral',
  loading = false,
  loadingLabel = 'Loading',
  success = false,
  successLabel = 'Done',
  material,
  magnetic = false,
  disabled,
  className,
  children,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  const ns = useNorthstar();
  const glass = (material ?? 'solid') === 'glass';
  const track = usePointerTracking<HTMLButtonElement>(magnetic || glass, { magnetic: magnetic ? 4 : 0 });
  const done = success && !loading;
  return (
    <button
      {...rest}
      ref={mergeRefs(ref, track)}
      type={type}
      className={cx(
        'ns-button',
        `ns-button--${variant}`,
        `ns-size-${size}`,
        tone === 'signal' && 'ns-tone-signal',
        glass && 'ns-button--glass',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      data-success={done || undefined}
      data-magnetic={magnetic || undefined}
    >
      {loading && <NorthStarSpinner />}
      {done && <SuccessCheck />}
      <span className="ns-button__label">{children}</span>
      {loading && <span className="ns-visually-hidden">{loadingLabel === 'Loading' ? ns.messages.loading : loadingLabel}</span>}
      {done && <span className="ns-visually-hidden">{successLabel}</span>}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /** Required accessible name. */
  label: string;
  icon: React.ReactNode;
  /**
   * Icon-led: `true` shows the icon and, on hover and keyboard focus, eases
   * open to reveal the full label (never truncated). `always` keeps the label
   * shown. Default false: icon only, with the label as a native tooltip.
   */
  expand?: boolean | 'always';
}

export function IconButton({ label, icon, expand = false, className, title, ...rest }: IconButtonProps) {
  if (expand) {
    return (
      <Button {...rest} title={title} className={cx('ns-icon-button', 'ns-icon-button--expand', expand === 'always' && 'ns-icon-button--open', className)}>
        <span className="ns-icon-button__icon" aria-hidden="true">
          {icon}
        </span>
        <RevealLabel>{label}</RevealLabel>
      </Button>
    );
  }
  return (
    <Button {...rest} aria-label={label} title={title ?? label} className={cx('ns-icon-button', className)}>
      {icon}
    </Button>
  );
}

/**
 * A label that is collapsed to zero width and eases open (grid 0fr → 1fr) when
 * an ancestor control is hovered or focused, so the whole text shows and
 * nothing is cut with an ellipsis. It stays in the accessibility tree.
 */
export function RevealLabel({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...rest} className={cx('ns-reveal-label', className)}>
      <span className="ns-reveal-label__inner">{children}</span>
    </span>
  );
}

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Required accessible name. */
  label: string;
  orientation?: 'horizontal' | 'vertical';
  /** Sits on liquid glass, floating. Default false. */
  glass?: boolean;
}

/** A toolbar of icon-led items: arrow keys move between them, Home and End jump. */
export function Toolbar({ label, orientation = 'horizontal', glass = false, className, onKeyDown, ...rest }: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      {...rest}
      className={cx('ns-toolbar', `ns-toolbar--${orientation}`, glass && 'ns-liquid ns-liquid--sm ns-liquid--floating ns-liquid--tint-subtle', className)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        rovingKeyDown(e, '.ns-toolbar__item', orientation);
      }}
    />
  );
}

export interface ToolbarItemProps extends Omit<IconButtonProps, 'expand'> {
  /** Default true: the label reveals on hover and focus. */
  expand?: boolean | 'always';
}

export function ToolbarItem({ expand = true, variant = 'ghost', className, ...rest }: ToolbarItemProps) {
  return <IconButton {...rest} expand={expand} variant={variant} className={cx('ns-toolbar__item', className)} />;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: Tone;
  /** Adds rel="noreferrer" and target="_blank". */
  external?: boolean;
  ref?: React.Ref<HTMLAnchorElement>;
}

export function Link({ tone = 'signal', external, className, ...rest }: LinkProps) {
  // The underline draws in from the left on hover and keyboard focus (CSS).
  return (
    <a
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...rest}
      className={cx('ns-link', tone === 'neutral' && 'ns-link--neutral', className)}
    />
  );
}

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Joined buttons share borders; spaced ones keep a gap. */
  attached?: boolean;
  label?: string;
}

export function ButtonGroup({ attached = false, label, className, ...rest }: ButtonGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      {...rest}
      className={cx('ns-button-group', attached && 'ns-button-group--attached', className)}
    />
  );
}
