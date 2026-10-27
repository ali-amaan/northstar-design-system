'use client';
import { cloneElement, createContext, isValidElement, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Portal, useNorthstar, type ButtonFinish, type Material } from './provider.js';
import { usePresence } from './internal/interaction.js';
import { useDismiss, useFocusTrap, rovingKeyDown } from './internal/layers.js';
import { cx, mergeRefs, useControllable } from './internal/util.js';
import { Close as CloseGlyph } from './internal/icons.js';
import { ExpandIcon, ExpandLabel, expandHost, type Expand } from './internal/expand.js';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface OpenProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface LayerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentId: string;
  titleId: string;
  descriptionId: string;
  described: boolean;
  setDescribed: (v: boolean) => void;
}

function useLayerState({ open, defaultOpen, onOpenChange }: OpenProps): LayerContextValue {
  const [isOpen, setOpen] = useControllable(open, defaultOpen ?? false, onOpenChange);
  const id = useId().replace(/:/g, '');
  const [described, setDescribed] = useState(false);
  return {
    described,
    setDescribed,
    open: isOpen,
    setOpen,
    triggerRef: useRef<HTMLButtonElement>(null),
    contentRef: useRef<HTMLDivElement>(null),
    contentId: `ns-layer-${id}`,
    titleId: `ns-layer-${id}-title`,
    descriptionId: `ns-layer-${id}-desc`,
  };
}

function useLayer(ctx: React.Context<LayerContextValue | null>, name: string) {
  const v = useContext(ctx);
  if (!v) throw new Error(`<${name}> must be used inside its Root`);
  return v;
}

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Render the single child element as the trigger instead of a <button>. */
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
};

function renderTrigger(props: TriggerProps, extra: Record<string, unknown>, ref: React.Ref<HTMLButtonElement>) {
  const { asChild, children, ...rest } = props;
  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const childOnClick = child.props.onClick as ((e: React.MouseEvent) => void) | undefined;
    const extraOnClick = extra.onClick as ((e: React.MouseEvent) => void) | undefined;
    return cloneElement(child, {
      ...rest,
      ...extra,
      ref,
      onClick: (e: React.MouseEvent) => {
        childOnClick?.(e);
        extraOnClick?.(e);
      },
    });
  }
  return (
    <button type="button" {...rest} {...extra} ref={ref}>
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Dialog */

const DialogContext = createContext<LayerContextValue | null>(null);

function DialogRoot(props: OpenProps) {
  const state = useLayerState(props);
  return <DialogContext.Provider value={state}>{props.children}</DialogContext.Provider>;
}

function DialogTrigger(props: TriggerProps) {
  const ctx = useLayer(DialogContext, 'Dialog.Trigger');
  return renderTrigger(
    props,
    {
      'aria-haspopup': 'dialog',
      'aria-expanded': ctx.open,
      'aria-controls': ctx.open ? ctx.contentId : undefined,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(e);
        ctx.setOpen(true);
      },
    },
    mergeRefs(props.ref, ctx.triggerRef),
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Close when the overlay is pressed. Default true. */
  dismissOnOutside?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** `glass` or `solid`. Defaults to the provider's material. */
  material?: Material;
}

/** Material class for a layer: the prop wins, then the provider. */
function useMaterial(material: Material | undefined): string {
  const ns = useNorthstar();
  return `ns-material--${material ?? ns.material}`;
}

interface ModalSurfaceProps extends DialogContentProps {
  ctx: LayerContextValue;
  kind: 'dialog' | 'sheet';
  side?: 'right' | 'left' | 'bottom';
}

function ModalSurface({ ctx, kind, side = 'right', dismissOnOutside = true, size = 'md', material, className, children, ...rest }: ModalSurfaceProps) {
  const materialClass = useMaterial(material);
  const mounted = usePresence(ctx.open, ctx.contentRef);
  const state = ctx.open ? 'open' : 'closed';
  useDismiss(ctx.open, [ctx.contentRef], () => ctx.setOpen(false), { outside: dismissOnOutside });
  useFocusTrap(ctx.open, ctx.contentRef);
  useEffect(() => {
    if (!ctx.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [ctx.open]);
  if (!mounted) return null;
  return (
    <Portal>
      <div className={cx('ns-overlay', `ns-overlay--${kind}`)} aria-hidden="true" data-state={state} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ctx.titleId}
        aria-describedby={ctx.described ? ctx.descriptionId : undefined}
        tabIndex={-1}
        id={ctx.contentId}
        {...rest}
        ref={ctx.contentRef}
        data-state={state}
        inert={!ctx.open || undefined}
        className={cx(kind === 'dialog' ? 'ns-dialog' : 'ns-sheet', kind === 'dialog' ? `ns-dialog--${size}` : `ns-sheet--${side}`, materialClass, className)}
      >
        {children}
      </div>
    </Portal>
  );
}

function DialogContent(props: DialogContentProps) {
  const ctx = useLayer(DialogContext, 'Dialog.Content');
  return <ModalSurface {...props} ctx={ctx} kind="dialog" />;
}

function makeTitle(context: React.Context<LayerContextValue | null>, name: string) {
  return function Title({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
    const ctx = useLayer(context, name);
    return <h2 id={ctx.titleId} {...rest} className={cx('ns-layer__title', className)} />;
  };
}
function makeDescription(context: React.Context<LayerContextValue | null>, name: string) {
  return function Description({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
    const ctx = useLayer(context, name);
    const { setDescribed } = ctx;
    useEffect(() => {
      setDescribed(true);
      return () => setDescribed(false);
    }, [setDescribed]);
    return <p id={ctx.descriptionId} {...rest} className={cx('ns-layer__description', className)} />;
  };
}
function makeClose(context: React.Context<LayerContextValue | null>, name: string) {
  return function Close(props: TriggerProps) {
    const ctx = useLayer(context, name);
    const { messages } = useNorthstar();
    const { children, className, ...rest } = props;
    if (children === undefined) {
      return (
        <button
          type="button"
          aria-label={messages.close}
          {...rest}
          className={cx('ns-layer__close ns-button ns-button--ghost ns-size-sm ns-icon-button', className)}
          onClick={(e) => {
            props.onClick?.(e);
            ctx.setOpen(false);
          }}
        >
          <CloseGlyph />
        </button>
      );
    }
    return renderTrigger(
      { ...rest, className, children },
      {
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          props.onClick?.(e);
          ctx.setOpen(false);
        },
      },
      props.ref ?? null,
    );
  };
}

function Footer({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx('ns-layer__footer', className)} />;
}
function Body({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx('ns-layer__body', className)} />;
}
function Header({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx('ns-layer__header', className)} />;
}

/** Modal dialog: focus trap, Escape and overlay dismiss, focus restored to the trigger. */
export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header,
  Title: makeTitle(DialogContext, 'Dialog.Title'),
  Description: makeDescription(DialogContext, 'Dialog.Description'),
  Body,
  Footer,
  Close: makeClose(DialogContext, 'Dialog.Close'),
};

/* ------------------------------------------------------------------ Sheet */

const SheetContext = createContext<LayerContextValue | null>(null);

function SheetRoot(props: OpenProps) {
  const state = useLayerState(props);
  return <SheetContext.Provider value={state}>{props.children}</SheetContext.Provider>;
}
function SheetTrigger(props: TriggerProps) {
  const ctx = useLayer(SheetContext, 'Sheet.Trigger');
  return renderTrigger(
    props,
    {
      'aria-haspopup': 'dialog',
      'aria-expanded': ctx.open,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(e);
        ctx.setOpen(true);
      },
    },
    mergeRefs(props.ref, ctx.triggerRef),
  );
}
export interface SheetContentProps extends Omit<DialogContentProps, 'size'> {
  side?: 'right' | 'left' | 'bottom';
}
function SheetContent(props: SheetContentProps) {
  const ctx = useLayer(SheetContext, 'Sheet.Content');
  return <ModalSurface {...props} ctx={ctx} kind="sheet" />;
}

/** A modal panel from the edge of the screen. Same behaviour as Dialog. */
export const Sheet = {
  Root: SheetRoot,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Header,
  Title: makeTitle(SheetContext, 'Sheet.Title'),
  Description: makeDescription(SheetContext, 'Sheet.Description'),
  Body,
  Footer,
  Close: makeClose(SheetContext, 'Sheet.Close'),
};

/* ------------------------------------------------------------ positioning */

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

function usePosition(open: boolean, anchor: React.RefObject<HTMLElement | null>, floating: React.RefObject<HTMLElement | null>, side: Side, align: Align, offset = 6) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useIsoLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const a = anchor.current?.getBoundingClientRect();
      const f = floating.current?.getBoundingClientRect();
      if (!a || !f) return;
      let top = 0;
      let left = 0;
      const vertical = side === 'top' || side === 'bottom';
      if (vertical) {
        top = side === 'bottom' ? a.bottom + offset : a.top - f.height - offset;
        left = align === 'start' ? a.left : align === 'end' ? a.right - f.width : a.left + (a.width - f.width) / 2;
      } else {
        left = side === 'right' ? a.right + offset : a.left - f.width - offset;
        top = align === 'start' ? a.top : align === 'end' ? a.bottom - f.height : a.top + (a.height - f.height) / 2;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      left = Math.max(8, Math.min(left, vw - f.width - 8));
      top = Math.max(8, Math.min(top, vh - f.height - 8));
      setPos({ top, left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, side, align, offset]);
  return pos;
}

/* ---------------------------------------------------------------- Popover */

const PopoverContext = createContext<LayerContextValue | null>(null);

function PopoverRoot(props: OpenProps) {
  const state = useLayerState(props);
  return <PopoverContext.Provider value={state}>{props.children}</PopoverContext.Provider>;
}
function PopoverTrigger(props: TriggerProps) {
  const ctx = useLayer(PopoverContext, 'Popover.Trigger');
  return renderTrigger(
    props,
    {
      'aria-haspopup': 'dialog',
      'aria-expanded': ctx.open,
      'aria-controls': ctx.open ? ctx.contentId : undefined,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(e);
        ctx.setOpen(!ctx.open);
      },
    },
    mergeRefs(props.ref, ctx.triggerRef),
  );
}
export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;
  align?: Align;
  /** Accessible name when the popover has no Popover.Title. */
  label?: string;
  /** `glass` or `solid`. Defaults to the provider's material. */
  material?: Material;
}
function PopoverContent({ side = 'bottom', align = 'start', label, material, className, style, children, ...rest }: PopoverContentProps) {
  const ctx = useLayer(PopoverContext, 'Popover.Content');
  const materialClass = useMaterial(material);
  const mounted = usePresence(ctx.open, ctx.contentRef);
  const close = () => {
    ctx.setOpen(false);
    ctx.triggerRef.current?.focus();
  };
  useDismiss(ctx.open, [ctx.contentRef, ctx.triggerRef], close);
  const pos = usePosition(ctx.open, ctx.triggerRef, ctx.contentRef, side, align);
  useEffect(() => {
    if (!ctx.open) return;
    const el = ctx.contentRef.current;
    (el?.querySelector<HTMLElement>('[data-autofocus]') ?? el)?.focus();
  }, [ctx.open]);
  if (!mounted) return null;
  return (
    <Portal>
      <div
        role="dialog"
        aria-label={label}
        aria-labelledby={label ? undefined : ctx.titleId}
        tabIndex={-1}
        id={ctx.contentId}
        {...rest}
        ref={ctx.contentRef}
        data-side={side}
        data-state={ctx.open ? 'open' : 'closed'}
        inert={!ctx.open || undefined}
        className={cx('ns-popover ns-pop', materialClass, className)}
        style={{ ...style, top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? undefined : 'hidden' }}
        onKeyDown={(e) => {
          rest.onKeyDown?.(e);
          // Tabbing out of a non-modal popover closes it.
          if (e.key === 'Tab') {
            const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]'));
            const last = items[items.length - 1];
            if ((!e.shiftKey && document.activeElement === last) || items.length === 0) {
              e.preventDefault();
              close();
            }
          }
        }}
      >
        {children}
      </div>
    </Portal>
  );
}

/** Non-modal floating panel anchored to its trigger. */
export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Title: makeTitle(PopoverContext, 'Popover.Title'),
  Description: makeDescription(PopoverContext, 'Popover.Description'),
  Close: makeClose(PopoverContext, 'Popover.Close'),
};

/* ------------------------------------------------------------------- Menu */

const MenuContext = createContext<LayerContextValue | null>(null);
const ITEM = '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]';

function MenuRoot(props: OpenProps) {
  const state = useLayerState(props);
  return <MenuContext.Provider value={state}>{props.children}</MenuContext.Provider>;
}

// Which item gets focus when the menu opens.
let openFocus: 'first' | 'last' = 'first';

export type MenuTriggerProps = TriggerProps & {
  /** Leading icon (decorative). Ignored with `asChild`. */
  icon?: React.ReactNode;
  /**
   * Icon-first trigger: with `icon`, `true` shows the icon and eases the label
   * open on hover, keyboard focus and while the menu is open (always on
   * touch). `always` keeps it open. Default false.
   */
  expand?: Expand;
  /**
   * Button finish when the trigger is styled as a button (`ns-button`):
   * `spin` or `soft`. Default: the provider's `buttonFinish`.
   */
  finish?: ButtonFinish;
};

function MenuTrigger({ icon, expand = false, finish, ...triggerProps }: MenuTriggerProps) {
  const ctx = useLayer(MenuContext, 'Menu.Trigger');
  let props: TriggerProps = finish ? ({ ...triggerProps, 'data-finish': finish } as TriggerProps) : triggerProps;
  if (!triggerProps.asChild && icon !== undefined && icon !== null && icon !== false) {
    const host = expandHost(expand);
    props = {
      ...props,
      className: cx(triggerProps.className, host.className && 'ns-button--expand', host.className),
      ...(host['data-expand'] ? ({ 'data-expand': host['data-expand'] } as Record<string, string>) : {}),
      children: (
        <>
          <ExpandIcon className="ns-button__icon">{icon}</ExpandIcon>
          {host.className ? <ExpandLabel className="ns-button__label">{triggerProps.children}</ExpandLabel> : <span className="ns-button__label">{triggerProps.children}</span>}
        </>
      ),
    };
  }
  return renderTrigger(
    props,
    {
      'aria-haspopup': 'menu',
      'aria-expanded': ctx.open,
      'aria-controls': ctx.open ? ctx.contentId : undefined,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        props.onClick?.(e);
        openFocus = 'first';
        ctx.setOpen(!ctx.open);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => {
        props.onKeyDown?.(e);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          openFocus = e.key === 'ArrowUp' ? 'last' : 'first';
          ctx.setOpen(true);
        }
      },
    },
    mergeRefs(props.ref, ctx.triggerRef),
  );
}

export interface MenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;
  align?: Align;
  /** `glass` or `solid`. Defaults to the provider's material. */
  material?: Material;
}

function MenuContent({ side = 'bottom', align = 'start', material, className, style, children, ...rest }: MenuContentProps) {
  const ctx = useLayer(MenuContext, 'Menu.Content');
  const materialClass = useMaterial(material);
  const mounted = usePresence(ctx.open, ctx.contentRef);
  const close = () => {
    ctx.setOpen(false);
    ctx.triggerRef.current?.focus();
  };
  useDismiss(ctx.open, [ctx.contentRef, ctx.triggerRef], close);
  const pos = usePosition(ctx.open, ctx.triggerRef, ctx.contentRef, side, align, 4);
  const typed = useRef({ text: '', at: 0 });
  useEffect(() => {
    if (!ctx.open) return;
    const items = Array.from(ctx.contentRef.current?.querySelectorAll<HTMLElement>(ITEM) ?? []).filter((el) => el.getAttribute('aria-disabled') !== 'true');
    const which = openFocus;
    openFocus = 'first';
    (which === 'last' ? items[items.length - 1] : items[0])?.focus();
  }, [ctx.open]);
  if (!mounted) return null;
  return (
    <Portal>
      <div
        role="menu"
        aria-labelledby={ctx.triggerRef.current?.id || undefined}
        aria-orientation="vertical"
        id={ctx.contentId}
        tabIndex={-1}
        {...rest}
        ref={ctx.contentRef}
        data-side={side}
        data-state={ctx.open ? 'open' : 'closed'}
        inert={!ctx.open || undefined}
        className={cx('ns-menu ns-pop', materialClass, className)}
        style={{ ...style, top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? undefined : 'hidden' }}
        onKeyDown={(e) => {
          rest.onKeyDown?.(e);
          if (rovingKeyDown(e, ITEM, 'vertical')) return;
          if (e.key === 'Tab') {
            e.preventDefault();
            close();
            return;
          }
          if (e.key.length === 1 && /\S/.test(e.key)) {
            const now = Date.now();
            typed.current.text = now - typed.current.at > 600 ? e.key : typed.current.text + e.key;
            typed.current.at = now;
            const q = typed.current.text.toLowerCase();
            const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEM));
            items.find((el) => el.getAttribute('aria-disabled') !== 'true' && (el.textContent ?? '').trim().toLowerCase().startsWith(q))?.focus();
          }
        }}
      >
        {children}
      </div>
    </Portal>
  );
}

export interface MenuItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  onSelect?: () => void;
  disabled?: boolean;
  /** Keyboard hint shown at the end (e.g. "⌘K"). */
  shortcut?: React.ReactNode;
  icon?: React.ReactNode;
}

function MenuItem({ onSelect, disabled = false, shortcut, icon, className, children, ...rest }: MenuItemProps) {
  const ctx = useLayer(MenuContext, 'Menu.Item');
  const select = () => {
    if (disabled) return;
    onSelect?.();
    ctx.setOpen(false);
    ctx.triggerRef.current?.focus();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      {...rest}
      className={cx('ns-menu__item', className)}
      onClick={(e) => {
        rest.onClick?.(e);
        select();
      }}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      }}
      onPointerMove={(e) => {
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
      }}
    >
      {icon && <span className="ns-menu__icon" aria-hidden="true">{icon}</span>}
      <span className="ns-menu__text">{children}</span>
      {shortcut && <span className="ns-menu__shortcut">{shortcut}</span>}
    </div>
  );
}

function MenuSeparator({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" {...rest} className={cx('ns-menu__separator', className)} />;
}
function MenuLabel({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="presentation" {...rest} className={cx('ns-menu__label', className)} />;
}

/** Action menu: arrow keys, Home/End, typeahead, Enter/Space to select, Escape to close. */
export const Menu = {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  Separator: MenuSeparator,
  Label: MenuLabel,
};

/* ---------------------------------------------------------------- Tooltip */

export interface TooltipProps {
  content: React.ReactNode;
  /** A single focusable element. */
  children: React.ReactElement;
  side?: Side;
  align?: Align;
  /** Hover delay in ms. Focus shows immediately. */
  delay?: number;
  /** `glass` or `solid`. Defaults to the provider's material. */
  material?: Material;
}

/** Supplementary text on hover and focus; Escape hides it. Never the only label of a control. */
export function Tooltip({ content, children, side = 'top', align = 'center', delay = 400, material }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLElement>(null);
  const floating = useRef<HTMLDivElement>(null);
  const materialClass = useMaterial(material);
  const mounted = usePresence(open, floating);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = `ns-tooltip-${useId().replace(/:/g, '')}`;
  const pos = usePosition(open, anchor, floating, side, align);
  useDismiss(open, [], () => setOpen(false), { outside: false });
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (wait: number) => {
    clearTimeout(timer.current);
    if (wait <= 0) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), wait);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };
  const child = children as React.ReactElement<Record<string, unknown> & { ref?: React.Ref<HTMLElement> }>;
  const p = child.props;
  const call = (name: string, e: unknown) => (p[name] as ((e: unknown) => void) | undefined)?.(e);
  return (
    <>
      {cloneElement(child, {
        ref: mergeRefs(p.ref, anchor),
        'aria-describedby': [p['aria-describedby'] as string | undefined, open ? id : undefined].filter(Boolean).join(' ') || undefined,
        onPointerEnter: (e: unknown) => {
          call('onPointerEnter', e);
          show(delay);
        },
        onPointerLeave: (e: unknown) => {
          call('onPointerLeave', e);
          hide();
        },
        onFocus: (e: unknown) => {
          call('onFocus', e);
          show(0);
        },
        onBlur: (e: unknown) => {
          call('onBlur', e);
          hide();
        },
      })}
      {mounted && (
        <Portal>
          <div
            id={open ? id : undefined}
            role="tooltip"
            ref={floating}
            className={cx('ns-tooltip', materialClass)}
            data-side={side}
            data-state={open ? 'open' : 'closed'}
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? undefined : 'hidden' }}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
