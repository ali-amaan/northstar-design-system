'use client';
import { useId } from 'react';
import { useNorthstar, type Material } from './provider.js';
import { usePointerTracking } from './internal/interaction.js';
import { cx, mergeRefs } from './internal/util.js';

/* ---------------------------------------------------------------- Surface */

type SurfaceTag = 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'li';

export interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  /** `glass` (default) is liquid glass: refraction at the rim, specular and rim light; `solid` is opaque. */
  material?: Material;
  /** Specular highlight follows the pointer. */
  reactive?: boolean;
  /** 1 hugs the page, 3 floats. Default 2. */
  depth?: 1 | 2 | 3;
  radius?: 6 | 8 | 12;
  as?: SurfaceTag;
  ref?: React.Ref<HTMLElement>;
}

/**
 * The material primitive. `glass` is liquid glass (see LiquidGlass): the
 * backdrop refracts at the rim on Chromium, blur and specular elsewhere. Falls
 * back to the opaque `material.solid` when transparency is reduced, in forced
 * colours, and where backdrop-filter is unsupported. Borderless by default:
 * separation comes from tone, shadow and the rim light.
 */
export function Surface({ material = 'glass', reactive = false, depth = 2, radius = 12, as: Tag = 'div', className, ref, ...rest }: SurfaceProps) {
  const track = usePointerTracking<HTMLElement>(reactive);
  return (
    <Tag
      {...(rest as React.HTMLAttributes<HTMLElement>)}
      ref={mergeRefs(ref, track) as React.Ref<never>}
      className={cx('ns-surface', `ns-material--${material}`, `ns-depth-${depth}`, `ns-radius-${radius}`, reactive && 'ns-reactive', className)}
    />
  );
}

/** Wraps secondary actions so they ease in when the enclosing card, row or list item is hovered or holds focus. */
export function HoverActions({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...rest} className={cx('ns-hover-actions', className)} />;
}

/* ------------------------------------------------------------------- Card */

export type CardVariant = 'solid' | 'glass' | 'spotlight';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** `solid` (default), `glass`, or `spotlight`: a glacier glow and border light that follow the pointer. */
  variant?: CardVariant;
  /** Lifts on hover and focus-within. Use when the card is, or contains, the action. */
  interactive?: boolean;
  /** A slow light travelling around the border (the "moving border"). Static under reduced motion. */
  orbit?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Shown at the end of the header row. */
  actions?: React.ReactNode;
  /** Secondary actions that ease in on hover and focus-within (always shown on touch). */
  revealActions?: boolean;
  footer?: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'li';
  ref?: React.Ref<HTMLElement>;
}

export function Card({
  variant = 'solid',
  interactive = false,
  orbit = false,
  title,
  description,
  actions,
  revealActions = false,
  footer,
  as: Tag = 'div',
  className,
  children,
  ref,
  ...rest
}: CardProps) {
  const track = usePointerTracking<HTMLElement>(variant !== 'solid');
  const head = title || description || actions;
  return (
    <Tag
      {...(rest as React.HTMLAttributes<HTMLElement>)}
      ref={mergeRefs(ref, track) as React.Ref<never>}
      className={cx(
        'ns-card',
        `ns-card--${variant}`,
        variant === 'solid' ? 'ns-material--solid' : 'ns-material--glass',
        variant !== 'solid' && 'ns-reactive',
        interactive && 'ns-card--interactive',
        orbit && 'ns-card--orbit',
        className,
      )}
    >
      {head && (
        <div className="ns-card__header">
          <div className="ns-card__heading">
            {title && <h3 className="ns-card__title">{title}</h3>}
            {description && <p className="ns-card__description">{description}</p>}
          </div>
          {actions && <div className={cx('ns-card__actions', revealActions && 'ns-hover-actions')}>{actions}</div>}
        </div>
      )}
      {children !== undefined && children !== null && <div className="ns-card__body">{children}</div>}
      {footer && <div className="ns-card__footer">{footer}</div>}
    </Tag>
  );
}

/* ------------------------------------------------------------------ Panel */

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  variant?: CardVariant;
  title?: React.ReactNode;
  /** Shown at the end of the header bar. */
  actions?: React.ReactNode;
  /** Remove body padding, for lists and tables that run edge to edge. */
  flush?: boolean;
  /** Heading level of the title. Default 2. */
  level?: 2 | 3 | 4;
  ref?: React.Ref<HTMLElement>;
}

/** A workspace panel: a header bar and a body, as a labelled region. Material defaults to the provider's. */
export function Panel({ variant, title, actions, flush = false, level = 2, className, children, ref, ...rest }: PanelProps) {
  const ns = useNorthstar();
  const v: CardVariant = variant ?? (ns.material === 'glass' ? 'glass' : 'solid');
  const track = usePointerTracking<HTMLElement>(v !== 'solid');
  const H = `h${level}` as 'h2';
  const auto = `ns-panel-${useId().replace(/:/g, '')}`;
  const id = `${rest.id ?? auto}-title`;
  return (
    <section
      aria-labelledby={title ? id : undefined}
      {...rest}
      ref={mergeRefs(ref, track) as React.Ref<HTMLElement>}
      className={cx('ns-panel', `ns-card--${v}`, v === 'solid' ? 'ns-material--solid' : 'ns-material--glass', v !== 'solid' && 'ns-reactive', className)}
    >
      {(title || actions) && (
        <div className="ns-panel__head">
          {title && (
            <H id={id} className="ns-panel__title">
              {title}
            </H>
          )}
          {actions && <div className="ns-panel__actions">{actions}</div>}
        </div>
      )}
      <div className={cx('ns-panel__body', flush && 'ns-panel__body--flush')}>{children}</div>
    </section>
  );
}
