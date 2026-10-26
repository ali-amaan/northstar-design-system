'use client';
import type { ReactNode } from 'react';
import type { Study, StudyTab } from '@northstar-js/contracts';
import { Tabs } from '../navigation.js';
import { FlowStep, FlowSteps, NextAction } from '../flow.js';
import { cx, useControllable } from '../internal/util.js';
import { StudyStatus } from './StudyStatus.js';
import { studyMessages, type WithMessages } from './messages.js';

export const STUDY_TABS: readonly StudyTab[] = ['brief', 'population', 'research', 'responses'];

export interface StudyShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, WithMessages {
  study: Study;
  /** The open tab (controlled). Falls back to `defaultTab`, then `study.tab`, then 'brief'. */
  tab?: StudyTab;
  defaultTab?: StudyTab;
  onTabChange?: (tab: StudyTab) => void;
  /** Content per tab. `children` renders under the active tab when no panel is given for it. */
  panels?: Partial<Record<StudyTab, ReactNode>>;
  /** Small counter beside each tab label, e.g. "2/3" or "locked". */
  tabMeta?: Partial<Record<StudyTab, ReactNode>>;
  /** Actions at the end of the tab bar (e.g. "Add item" on Research). */
  tabActions?: ReactNode;
  /** Actions at the end of the title bar (export, more). */
  actions?: ReactNode;
  /** Save indicator; omit to hide. */
  saveState?: 'saved' | 'saving';
  /** The breadcrumb root. Defaults to "Studies". */
  crumb?: ReactNode;
  /** Right-hand properties rail. */
  aside?: ReactNode;
  /**
   * Guided mode: the four tabs become a flow (Brief → Population → Research →
   * Responses) with progress, animated step changes and one next action.
   */
  guided?: boolean;
  /** Guided mode: steps that cannot be left yet (e.g. an unfinished brief). */
  blockedTabs?: readonly StudyTab[];
  /** Guided mode: a short line beside the next action, per step. */
  stepHints?: Partial<Record<StudyTab, ReactNode>>;
  /** Guided mode: the next action on the last step. */
  onFinish?: () => void;
  /** Guided mode: label of the last step's action. */
  finishLabel?: ReactNode;
}

/** The study workspace: title bar, the four tabs Brief → Population → Research → Responses, content and an optional rail. */
export function StudyShell({
  study, tab, defaultTab, onTabChange, panels, tabMeta, tabActions, actions, saveState, crumb, aside, guided = false, blockedTabs, stepHints, onFinish, finishLabel, messages, className, children, ...rest
}: StudyShellProps) {
  const m = studyMessages(messages);
  const [current, setCurrent] = useControllable<StudyTab>(tab, defaultTab ?? study.tab ?? 'brief', onTabChange);
  return (
    <div {...rest} className={cx('ns-study-shell', aside ? 'ns-study-shell--with-aside' : undefined, className)} data-study={study.id}>
      <div className="ns-study-shell__main">
        <div className="ns-study-shell__bar">
          <nav className="ns-study-shell__crumb" aria-label={m.studies}>
            <span>{crumb ?? m.studies}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3.5 2 6.5 5 3.5 8" />
            </svg>
            <b aria-current="page">{study.title}</b>
          </nav>
          <StudyStatus state={study.state} messages={messages} />
          <span className="ns-study-shell__spacer" />
          {saveState && (
            <span className="ns-study-shell__save" role="status">
              {saveState === 'saving' ? m.saving : m.saved}
            </span>
          )}
          {actions}
        </div>
        {guided ? (
          <FlowSteps
            value={current}
            onValueChange={(v) => setCurrent(v as StudyTab)}
            onComplete={onFinish}
            label={m.studySections}
            className="ns-study-shell__flow"
          >
            {STUDY_TABS.map((t) => (
              <FlowStep key={t} value={t} title={m.tabs[t]} textTitle={m.tabs[t]} blocked={blockedTabs?.includes(t)} description={tabMeta?.[t]}>
                {panels?.[t] ?? children}
                <div className="ns-study-shell__next">
                  <NextAction hint={stepHints?.[t]} finishLabel={finishLabel} />
                </div>
              </FlowStep>
            ))}
          </FlowSteps>
        ) : (
        <Tabs.Root value={current} onValueChange={(v) => setCurrent(v as StudyTab)} transition className="ns-study-shell__tabs">
          <div className="ns-study-shell__tabbar">
            <Tabs.List label={m.studySections} className="ns-study-shell__tablist">
              {STUDY_TABS.map((t) => (
                <Tabs.Trigger key={t} value={t} className="ns-study-shell__tab">
                  {m.tabs[t]}
                  {tabMeta?.[t] !== undefined && <span className="ns-study-shell__tab-meta">{tabMeta[t]}</span>}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {tabActions && <div className="ns-study-shell__tab-actions">{tabActions}</div>}
          </div>
          <Tabs.Content value={current} className="ns-study-shell__content">
            {panels?.[current] ?? children}
          </Tabs.Content>
        </Tabs.Root>
        )}
      </div>
      {aside && (
        <aside className="ns-study-shell__aside" aria-label={m.studyProperties}>
          {aside}
        </aside>
      )}
    </div>
  );
}
