'use client';
import { useId, useRef, type ReactNode } from 'react';
import type { QuestionType, ResearchItem, ResponseFormat } from '@northstar-js/contracts';
import { Icon } from '@northstar-js/icons';
import { Button, IconButton } from '../actions.js';
import { Select } from '../forms.js';
import { EmptyResearch } from '../illustrations/index.js';
import { cx, useControllable } from '../internal/util.js';
import { studyMessages, type WithMessages } from './messages.js';

export interface AnchorIssue {
  /** Zero-based anchor index. */
  anchor: number;
  message: ReactNode;
}

const QUESTION_TYPES: QuestionType[] = ['mood_direction', 'consensus_trust', 'neutral_factual', 'concrete_habit', 'values_identity', 'intention_virtue'];
const FORMATS: ResponseFormat[] = ['likert', 'single_choice', 'multi_select', 'ranking', 'free_text', 'price_trial'];

export interface ResearchBuilderProps extends React.HTMLAttributes<HTMLDivElement>, WithMessages {
  items?: ResearchItem[];
  defaultItems?: ResearchItem[];
  onItemsChange?: (items: ResearchItem[]) => void;
  selectedKey?: string | null;
  defaultSelectedKey?: string | null;
  onSelectedKeyChange?: (key: string | null) => void;
  /** Anchor-check results per item key. Items with issues are marked "Fix". */
  anchorIssues?: Record<string, AnchorIssue[]>;
  /** Makes a new item for "Add item". Defaults to an empty five-anchor Likert item. */
  createItem?: (index: number) => ResearchItem;
  /** Extra controls in the editor header (an objective picker, say). */
  editorToolbar?: (item: ResearchItem) => ReactNode;
  readOnly?: boolean;
}

function defaultItem(i: number): ResearchItem {
  return { key: `item-${Date.now().toString(36)}-${i}`, question: '', type: 'mood_direction', format: 'likert', anchors: ['', '', '', '', ''] };
}

/** The Research tab: the item list (add, reorder, remove) beside an editor for wording, type, format and anchors. */
export function ResearchBuilder({
  items, defaultItems, onItemsChange, selectedKey, defaultSelectedKey, onSelectedKeyChange, anchorIssues = {},
  createItem = defaultItem, editorToolbar, readOnly = false, messages, className, ...rest
}: ResearchBuilderProps) {
  const m = studyMessages(messages);
  const uid = useId().replace(/:/g, '');
  const [list, setList] = useControllable<ResearchItem[]>(items, defaultItems ?? [], onItemsChange);
  const [sel, setSel] = useControllable<string | null>(selectedKey, defaultSelectedKey ?? list[0]?.key ?? null, onSelectedKeyChange);
  const listRef = useRef<HTMLOListElement | null>(null);
  const index = list.findIndex((x) => x.key === sel);
  const item = index >= 0 ? list[index] : undefined;

  const focusItem = (key: string) =>
    requestAnimationFrame(() => Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-key]') ?? []).find((el) => el.dataset.key === key)?.focus(),
    );
  const update = (patch: Partial<ResearchItem>) => {
    if (!item) return;
    setList(list.map((x) => (x.key === item.key ? { ...x, ...patch } : x)));
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    const a = next[i]!, b = next[j]!;
    next[i] = b;
    next[j] = a;
    setList(next);
    focusItem(a.key);
  };
  const remove = (i: number) => {
    const gone = list[i]!;
    const next = list.filter((_, j) => j !== i);
    setList(next);
    if (gone.key === sel) {
      const n = next[Math.min(i, next.length - 1)];
      setSel(n?.key ?? null);
      if (n) focusItem(n.key);
    }
  };
  const add = () => {
    const n = createItem(list.length);
    setList([...list, n]);
    setSel(n.key);
    focusItem(n.key);
  };

  const issues = item ? (anchorIssues[item.key] ?? []) : [];
  const id = (i: number) => m.itemId(i);

  return (
    <div {...rest} className={cx('ns-research', className)}>
      <div className="ns-research__list">
        <div className="ns-research__list-head">
          <span>{m.items}</span>
          <span className="ns-study-mono">{list.length}</span>
          {!readOnly && (
            <Button size="sm" className="ns-study-panel__end" icon={<Icon name="add" size={14} />} onClick={add}>
              {m.addItem}
            </Button>
          )}
        </div>
        {list.length === 0 ? (
          <div className="ns-study-empty">
            <EmptyResearch />
            <p className="ns-study-empty__title">{m.emptyResearchTitle}</p>
            <p className="ns-study-hint">{m.emptyResearchBody}</p>
          </div>
        ) : (
          <ol ref={listRef} className="ns-research__items" aria-label={m.items}>
            {list.map((x, i) => {
              const fix = (anchorIssues[x.key]?.length ?? 0) > 0;
              const on = x.key === sel;
              return (
                <li key={x.key} className={cx('ns-research__item', on && 'ns-research__item--on')}>
                  <button
                    type="button"
                    className="ns-research__select"
                    data-key={x.key}
                    aria-current={on || undefined}
                    onClick={() => setSel(x.key)}
                    onKeyDown={(e) => {
                      if (readOnly || !e.altKey) return;
                      if (e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); }
                      if (e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); }
                    }}
                  >
                    <span className="ns-study-id">{id(i)}</span>
                    <Icon name={fix ? 'off-axis' : 'complete'} size={14} className={fix ? 'ns-study-signal' : 'ns-study-muted'} />
                    <span className="ns-research__q">{x.question || '—'}</span>
                    {fix ? <span className="ns-tag ns-tone-signal">{m.needsFix}</span> : x.format && <span className="ns-tag">{m.formats[x.format]}</span>}
                  </button>
                  {!readOnly && (
                    <span className="ns-research__tools">
                      <IconButton size="sm" variant="ghost" expand className="ns-research__tool" label={m.moveUp(id(i))} disabled={i === 0} onClick={() => move(i, -1)} icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 7.5 6 4.5 9 7.5" /></svg>} />
                      <IconButton size="sm" variant="ghost" expand className="ns-research__tool" label={m.moveDown(id(i))} disabled={i === list.length - 1} onClick={() => move(i, 1)} icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>} />
                      <IconButton size="sm" variant="ghost" expand className="ns-research__tool" label={m.removeItem(id(i))} onClick={() => remove(i)} icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 3l6 6M9 3l-6 6" /></svg>} />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="ns-research__editor">
        {!item ? (
          <p className="ns-study-hint">{m.selectItem}</p>
        ) : (
          <>
            <div className="ns-research__editor-head">
              <span className="ns-study-id">{id(index)}</span>
              <Select
                size="sm"
                aria-label={m.questionType}
                value={item.type}
                disabled={readOnly}
                options={QUESTION_TYPES.map((t) => ({ value: t, label: m.questionTypes[t] }))}
                onValueChange={(t) => update({ type: t as QuestionType })}
              />
              <Select
                size="sm"
                aria-label={m.format}
                value={item.format ?? 'likert'}
                disabled={readOnly}
                options={FORMATS.map((f) => ({ value: f, label: m.formats[f] }))}
                onValueChange={(f) => update({ format: f as ResponseFormat })}
              />
              {editorToolbar?.(item)}
            </div>
            <textarea
              className="ns-research__wording"
              rows={2}
              aria-label={m.wording}
              value={item.question}
              readOnly={readOnly}
              onChange={(e) => update({ question: e.target.value })}
            />
            {item.anchors && (
              <fieldset className="ns-research__anchors">
                <legend className="ns-study-label">{m.anchors}</legend>
                {item.anchors.map((a, i) => {
                  const issue = issues.find((x) => x.anchor === i);
                  const descId = `ns-anchor-${uid}-${i}`;
                  return (
                    <div key={i} className="ns-research__anchor">
                      <span className="ns-study-id">{i + 1}</span>
                      <input
                        className={cx('ns-research__anchor-input', issue && 'ns-invalid')}
                        aria-label={m.anchorLabel(i)}
                        aria-invalid={issue ? true : undefined}
                        aria-describedby={issue ? descId : undefined}
                        value={a}
                        readOnly={readOnly}
                        onChange={(e) => update({ anchors: item.anchors!.map((y, j) => (j === i ? e.target.value : y)) })}
                      />
                      <Icon
                        name={issue ? 'off-axis' : 'validate'}
                        size={14}
                        title={issue ? m.anchorNeedsFix : m.anchorPasses}
                        className={issue ? 'ns-study-signal' : 'ns-study-muted'}
                      />
                    </div>
                  );
                })}
              </fieldset>
            )}
            {issues.map((x) => (
              <div key={x.anchor} id={`ns-anchor-${uid}-${x.anchor}`} className="ns-study-callout">
                <span className="ns-tag ns-tone-signal">{m.anchorLabel(x.anchor)}</span>
                <span>{x.message}</span>
              </div>
            ))}
            <span className="ns-study-hint">{m.anchorHint}</span>
          </>
        )}
      </div>
    </div>
  );
}
