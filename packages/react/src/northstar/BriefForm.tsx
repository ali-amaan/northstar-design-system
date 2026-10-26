'use client';
import { useId, useRef, type ReactNode } from 'react';
import { Button } from '../actions.js';
import { cx, useControllable } from '../internal/util.js';
import { studyMessages, type WithMessages } from './messages.js';

export interface BriefValue {
  title: string;
  /** The decision the study informs. */
  decision: string;
  objectives: string[];
}

export interface BriefFormProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>, WithMessages {
  value?: BriefValue;
  defaultValue?: BriefValue;
  onValueChange?: (value: BriefValue) => void;
  /** Most objectives a study may carry. Default 5. */
  maxObjectives?: number;
  /** Per-objective meta, e.g. "3 items". */
  objectiveMeta?: (index: number) => ReactNode;
  /** Shown above the objectives (a template picker, say). */
  toolbar?: ReactNode;
  readOnly?: boolean;
}

const EMPTY: BriefValue = { title: '', decision: '', objectives: [] };

/** The Brief tab: study name, the decision it informs, and its objectives. */
export function BriefForm({
  value, defaultValue, onValueChange, maxObjectives = 5, objectiveMeta, toolbar, readOnly = false, messages, className, ...rest
}: BriefFormProps) {
  const m = studyMessages(messages);
  const [v, setV] = useControllable<BriefValue>(value, defaultValue ?? EMPTY, onValueChange);
  const headingId = `ns-brief-${useId().replace(/:/g, '')}`;
  const list = useRef<HTMLDivElement | null>(null);
  const patch = (p: Partial<BriefValue>) => setV({ ...v, ...p });
  const focusRow = (i: number) =>
    requestAnimationFrame(() => list.current?.querySelectorAll<HTMLInputElement>('input')[i]?.focus());
  const add = () => {
    if (v.objectives.length >= maxObjectives) return;
    patch({ objectives: [...v.objectives, ''] });
    focusRow(v.objectives.length);
  };
  const remove = (i: number) => {
    patch({ objectives: v.objectives.filter((_, j) => j !== i) });
    focusRow(Math.max(0, i - 1));
  };
  const full = v.objectives.length >= maxObjectives;

  return (
    <div {...rest} className={cx('ns-brief', className)}>
      <div className="ns-brief__head">
        <input
          className="ns-brief__title"
          aria-label={m.studyName}
          value={v.title}
          readOnly={readOnly}
          onChange={(e) => patch({ title: e.target.value })}
        />
        <textarea
          className="ns-brief__decision"
          rows={2}
          aria-label={m.decision}
          placeholder={m.decisionPlaceholder}
          value={v.decision}
          readOnly={readOnly}
          onChange={(e) => patch({ decision: e.target.value })}
        />
      </div>
      {toolbar && <div className="ns-brief__toolbar">{toolbar}</div>}
      <section className="ns-study-panel" aria-labelledby={headingId}>
        <div className="ns-study-panel__head">
          <h2 id={headingId} className="ns-study-panel__title">{m.objectives}</h2>
          <span className="ns-study-hint">{m.objectiveCount(v.objectives.length, maxObjectives)}</span>
          {!readOnly && (
            <Button variant="ghost" size="sm" className="ns-study-panel__action" onClick={add} disabled={full}>
              {m.addObjective}
            </Button>
          )}
        </div>
        <div ref={list} role="list">
          {v.objectives.map((o, i) => (
            <div role="listitem" key={i} className="ns-study-row">
              <span className="ns-study-id" aria-hidden="true">O{i + 1}</span>
              <input
                className="ns-study-row__input"
                aria-label={m.objectiveLabel(i)}
                value={o}
                readOnly={readOnly}
                onChange={(e) => patch({ objectives: v.objectives.map((x, j) => (j === i ? e.target.value : x)) })}
                onKeyDown={(e) => {
                  if (readOnly) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add();
                  } else if (e.key === 'Backspace' && o === '' && v.objectives.length > 0) {
                    e.preventDefault();
                    remove(i);
                  }
                }}
              />
              {objectiveMeta && <span className="ns-tag">{objectiveMeta(i)}</span>}
              {!readOnly && (
                <button type="button" className="ns-study-icon-button" aria-label={m.removeObjective(i)} onClick={() => remove(i)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {!readOnly && !full && (
            <div role="listitem" className="ns-study-row">
              <span className="ns-study-id" aria-hidden="true">O{v.objectives.length + 1}</span>
              <button type="button" className="ns-study-row__ghost" onClick={add}>
                {m.objectivePlaceholder}
              </button>
            </div>
          )}
        </div>
      </section>
      <span className="ns-study-hint">{m.objectivesHint}</span>
    </div>
  );
}
