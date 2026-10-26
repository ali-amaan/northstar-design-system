import { type ReactNode } from 'react';
import type { ResearchItem, Study } from '@northstar-js/contracts';
import { Distribution, Figure } from '@northstar-js/charts';
import { EmptyResponses } from '../illustrations/index.js';
import { cx } from '../internal/util.js';
import { studyMessages, type WithMessages } from './messages.js';

export interface ResponsesViewProps extends React.HTMLAttributes<HTMLDivElement>, WithMessages {
  study: Study;
  /** 'objective' groups items under the study's objectives; 'item' lists them in battery order. */
  groupBy?: 'objective' | 'item';
  /** Which objective (index into `study.objectives`) an item belongs to. Default: the first. */
  objectiveOf?: (item: ResearchItem, index: number) => number | undefined;
  /** Extra content under an item's figure (a selected free-text answer, say). */
  renderExtra?: (item: ResearchItem) => ReactNode;
  /** Intro sentence above the figures; pass null to hide. */
  intro?: ReactNode;
  /** Width of each distribution chart. Default 320. */
  chartWidth?: number;
  locale?: string;
}

interface Group {
  key: string;
  code?: string;
  title: string;
  rows: { item: ResearchItem; index: number }[];
}

/** The Responses tab: one row per item with its headline figure and distribution, grouped by objective. */
export function ResponsesView({
  study, groupBy = 'objective', objectiveOf, renderExtra, intro, chartWidth = 320, locale = 'en', messages, className, ...rest
}: ResponsesViewProps) {
  const m = studyMessages(messages);
  const answered = study.items.map((item, index) => ({ item, index })).filter((r) => r.item.result);

  if (answered.length === 0) {
    return (
      <div {...rest} className={cx('ns-responses', className)}>
        <div className="ns-study-empty">
          <EmptyResponses />
          <p className="ns-study-empty__title">{m.emptyResponsesTitle}</p>
          <p className="ns-study-hint">{m.emptyResponsesBody}</p>
        </div>
      </div>
    );
  }

  let groups: Group[];
  if (groupBy === 'item' || study.objectives.length === 0) {
    groups = [{ key: 'all', title: m.items, rows: answered }];
  } else {
    const by = new Map<number, Group>();
    const other: Group = { key: 'other', title: m.otherItems, rows: [] };
    for (const r of answered) {
      const o = objectiveOf ? objectiveOf(r.item, r.index) : 0;
      if (o === undefined || !study.objectives[o]) {
        other.rows.push(r);
        continue;
      }
      if (!by.has(o)) by.set(o, { key: `o${o}`, code: `O${o + 1}`, title: study.objectives[o]!, rows: [] });
      by.get(o)!.rows.push(r);
    }
    groups = [...[...by.entries()].sort((a, b) => a[0] - b[0]).map(([, g]) => g), ...(other.rows.length ? [other] : [])];
  }

  return (
    <div {...rest} className={cx('ns-responses', className)}>
      {intro !== null && <p className="ns-study-hint ns-responses__intro">{intro ?? m.responsesIntro}</p>}
      {groups.map((g) => {
        const hid = `ns-resp-${study.id}-${g.key}`;
        return (
          <section key={g.key} className="ns-study-panel" aria-labelledby={hid}>
            <div className="ns-study-panel__head">
              {g.code && <span className="ns-study-id">{g.code}</span>}
              <h2 id={hid} className="ns-study-panel__title">{g.title}</h2>
              <span className="ns-study-hint ns-study-panel__end">{m.itemCount(g.rows.length)}</span>
            </div>
            {g.rows.map(({ item, index }) => {
              const h = item.result!.headline;
              const d = item.result!.distribution;
              return (
                <article key={item.key} className="ns-responses__row" aria-label={m.itemId(index)}>
                  <span className="ns-study-id">{m.itemId(index)}</span>
                  <span className="ns-responses__q">{item.question}</span>
                  <div className="ns-responses__figure">
                    {h ? (
                      <Figure
                        value={h.value}
                        size="sm"
                        locale={locale}
                        {...(h.band !== undefined ? { band: h.band } : {})}
                        {...(h.claim ? { claim: h.claim } : {})}
                        {...(h.caption !== undefined ? { caption: h.caption } : {})}
                        {...(h.state ? { state: h.state } : {})}
                      />
                    ) : null}
                  </div>
                  <div className="ns-responses__dist">
                    <Distribution anchors={d.anchors} shares={d.shares} width={chartWidth} locale={locale} title={`${m.distribution} ${m.itemId(index)}`} />
                  </div>
                  {renderExtra && <div className="ns-responses__extra">{renderExtra(item)}</div>}
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
