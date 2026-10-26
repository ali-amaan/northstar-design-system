import { cx, type Size, type Tone } from './internal/util.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  tone?: Tone;
  loading?: boolean;
  /** Accessible text announced while loading. */
  loadingLabel?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  tone = 'neutral',
  loading = false,
  loadingLabel = 'Loading',
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cx('ns-button', `ns-button--${variant}`, `ns-size-${size}`, tone === 'signal' && 'ns-tone-signal', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
    >
      {loading && <span className="ns-spinner" aria-hidden="true" />}
      <span className="ns-button__label">{children}</span>
      {loading && <span className="ns-visually-hidden">{loadingLabel}</span>}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /** Required accessible name. */
  label: string;
  icon: React.ReactNode;
}

export function IconButton({ label, icon, className, title, ...rest }: IconButtonProps) {
  return (
    <Button {...rest} aria-label={label} title={title ?? label} className={cx('ns-icon-button', className)}>
      {icon}
    </Button>
  );
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: Tone;
  /** Adds rel="noreferrer" and target="_blank". */
  external?: boolean;
  ref?: React.Ref<HTMLAnchorElement>;
}

export function Link({ tone = 'signal', external, className, ...rest }: LinkProps) {
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
