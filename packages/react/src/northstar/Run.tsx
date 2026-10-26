'use client';
import type { ReactNode } from 'react';
import type { CostEstimate } from '@northstar-js/contracts';
import { Button } from '../actions.js';
import { Dialog } from '../overlays.js';
import { cx } from '../internal/util.js';
import { studyMessages, type WithMessages } from './messages.js';

/** Format an estimate as currency, or null when there is none. */
export function formatCost(estimate: CostEstimate | undefined, locale = 'en'): string | null {
  if (!estimate) return null;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: estimate.currency }).format(estimate.amount);
  } catch {
    return `${estimate.amount} ${estimate.currency}`;
  }
}

export interface RunCostProps extends React.HTMLAttributes<HTMLDivElement>, WithMessages {
  /** null or undefined shows "Cost unavailable" and disables the run. */
  estimate: CostEstimate | undefined;
  /** Called by the run button. Omit to hide the button. */
  onRun?: () => void;
  /** Disable the run for another reason (an anchor to fix, say). */
  disabled?: boolean;
  /** Shown under the button, e.g. why the run is blocked. */
  note?: ReactNode;
  loading?: boolean;
  locale?: string;
}

/** Estimated cost and the run button. Without an estimate the cost reads "Cost unavailable" and nothing can run. */
export function RunCost({ estimate, onRun, disabled = false, note, loading, locale = 'en', messages, className, ...rest }: RunCostProps) {
  const m = studyMessages(messages);
  const cost = formatCost(estimate, locale);
  const unavailable = cost === null;
  return (
    <div {...rest} className={cx('ns-run-cost', className)} data-unavailable={unavailable || undefined}>
      <div className="ns-run-cost__line">
        <span className="ns-study-muted">{m.estimatedCost}</span>
        <span className={cx('ns-study-mono', unavailable && 'ns-study-muted')}>{cost ?? m.costUnavailable}</span>
      </div>
      {estimate?.basis && <span className="ns-study-hint">{estimate.basis}</span>}
      {onRun && (
        <Button variant="primary" onClick={onRun} disabled={unavailable || disabled} loading={loading ?? false} className="ns-run-cost__button">
          {m.runStudy}
        </Button>
      )}
      {unavailable && <span className="ns-study-hint">{m.costUnavailableHint}</span>}
      {note && <div className="ns-study-callout">{note}</div>}
    </div>
  );
}

export interface RunConfirmProps extends WithMessages {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  estimate: CostEstimate | undefined;
  /** Study title, shown in the body. */
  studyTitle?: string;
  onConfirm: () => void;
  /** Optional trigger; usually the RunCost button opens the dialog through `open`. */
  trigger?: ReactNode;
  children?: ReactNode;
  locale?: string;
}

/** The paid-run confirmation. Confirm is disabled while no estimate exists. */
export function RunConfirm({
  open, defaultOpen, onOpenChange, estimate, studyTitle, onConfirm, trigger, children, locale = 'en', messages,
}: RunConfirmProps) {
  const m = studyMessages(messages);
  const cost = formatCost(estimate, locale);
  return (
    <Dialog.Root
      {...(open !== undefined ? { open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger && <Dialog.Trigger className="ns-button ns-button--secondary ns-size-md">{trigger}</Dialog.Trigger>}
      <Dialog.Content size="sm">
        <Dialog.Header>
          <div>
            <Dialog.Title>{m.runConfirmTitle}</Dialog.Title>
            <Dialog.Description>
              {studyTitle ? `${studyTitle}. ` : ''}
              {m.runConfirmBody}
            </Dialog.Description>
          </div>
          <Dialog.Close />
        </Dialog.Header>
        <div className="ns-run-cost__line ns-run-confirm__cost">
          <span className="ns-study-muted">{m.estimatedCost}</span>
          <span className="ns-study-mono">{cost ?? m.costUnavailable}</span>
        </div>
        {children}
        <Dialog.Footer>
          <Dialog.Close className="ns-button ns-button--secondary ns-size-md">{m.cancel}</Dialog.Close>
          <Dialog.Close className="ns-button ns-button--primary ns-size-md" disabled={cost === null} onClick={() => onConfirm()}>
            {m.confirmRun}
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}
