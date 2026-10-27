'use client';
import type { StudyState } from '@northstar-js/contracts';
import { Icon, type IconName } from '@northstar-js/icons';
import { usePrefersReducedMotion } from '@northstar-js/motion';
import { cx } from '../internal/util.js';
import { ExpandIcon, ExpandLabel, expandHost } from '../internal/expand.js';
import { studyMessages, type WithMessages } from './messages.js';

/** One dial shape per state: status is told apart by shape and word, never by hue alone. */
export const STATUS_ICON: Record<StudyState, IconName> = {
  draft: 'draft',
  ready: 'study',
  running: 'running',
  complete: 'complete',
  partial: 'drift',
  failed: 'off-axis',
  archived: 'locked',
};

export interface StudyStatusProps extends React.HTMLAttributes<HTMLSpanElement>, WithMessages {
  state: StudyState;
  /** 'tag' draws a bordered chip; 'inline' only the mark and word. */
  variant?: 'tag' | 'inline';
  /** Icon size in px. */
  size?: number;
  /** Icon-first chip: the dial shows and the word eases open on hover (always on touch); the word names it for screen readers throughout. `always` keeps it. Default false. */
  expand?: boolean | 'always';
}

/** Study lifecycle state: a dial shape plus its word. Running sweeps, or stands still under reduced motion. */
export function StudyStatus({ state, variant = 'tag', size = 14, expand = false, messages, className, ...rest }: StudyStatusProps) {
  const m = studyMessages(messages);
  const reduced = usePrefersReducedMotion();
  const motion = state === 'running' ? (reduced ? 'still' : 'sweep') : undefined;
  const host = expandHost(expand);
  return (
    <span
      {...rest}
      className={cx('ns-study-status', `ns-study-status--${variant}`, `ns-study-status--${state}`, host.className, className)}
      data-state={state}
      data-expand={host['data-expand']}
      {...(motion ? { 'data-motion': motion } : {})}
    >
      {host.className ? (
        <ExpandIcon>
          <Icon name={STATUS_ICON[state]} size={size} className="ns-study-status__mark" />
        </ExpandIcon>
      ) : (
        <Icon name={STATUS_ICON[state]} size={size} className="ns-study-status__mark" />
      )}
      {host.className ? <ExpandLabel className="ns-study-status__word">{m.states[state]}</ExpandLabel> : <span className="ns-study-status__word">{m.states[state]}</span>}
    </span>
  );
}
