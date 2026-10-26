'use client';
import { useId, type ReactNode } from 'react';
import type { PopulationRef } from '@northstar-js/contracts';
import { Composition, type CompositionRow } from '@northstar-js/charts';
import { MarketStatus } from '@northstar-js/maps';
import { Button } from '../actions.js';
import { NumberInput } from '../forms.js';
import { EmptyPopulation } from '../illustrations/index.js';
import { cx } from '../internal/util.js';
import { studyMessages, type WithMessages } from './messages.js';

export interface CompositionGroup {
  /** Dimension name, e.g. "Age". */
  label: string;
  rows: CompositionRow[];
}

export interface PopulationPanelProps extends React.HTMLAttributes<HTMLDivElement>, WithMessages {
  /** The study's one population. */
  population: PopulationRef;
  /** Margins (and panel shares once built), one group per dimension. Empty shows the empty state. */
  composition?: CompositionGroup[];
  /** Sub-heading of the composition panel, e.g. which margins it is raked to. */
  compositionNote?: ReactNode;
  /** Sentence under the composition panel. */
  caption?: ReactNode;
  onSizeChange?: (size: number | null) => void;
  onSeedChange?: (seed: number | null) => void;
  onRebuild?: () => void;
  /** Locks size, seed and rebuild (after a run). */
  readOnly?: boolean;
  /** Width of each composition chart. Default 320. */
  chartWidth?: number;
  locale?: string;
}

/** The Population tab: market status, size and seed, and the composition against published margins. */
export function PopulationPanel({
  population, composition = [], compositionNote, caption, onSizeChange, onSeedChange, onRebuild, readOnly = false,
  chartWidth = 320, locale = 'en', messages, className, ...rest
}: PopulationPanelProps) {
  const m = studyMessages(messages);
  const id = useId().replace(/:/g, '');
  const sizeId = `ns-pop-size-${id}`, seedId = `ns-pop-seed-${id}`, headId = `ns-pop-comp-${id}`;
  return (
    <div {...rest} className={cx('ns-population', className)}>
      <div className="ns-population__controls">
        <span className="ns-population__market">
          <span className="ns-study-label">{m.market}</span>
          <MarketStatus code={population.code} variant="row" />
        </span>
        <span className="ns-study-divider" aria-hidden="true" />
        <label className="ns-study-label" htmlFor={sizeId}>{m.size}</label>
        <NumberInput
          id={sizeId}
          size="sm"
          min={0}
          value={population.size}
          {...(onSizeChange ? { onValueChange: onSizeChange } : {})}
          disabled={readOnly}
          className="ns-population__number"
        />
        <label className="ns-study-label" htmlFor={seedId}>{m.seed}</label>
        <NumberInput
          id={seedId}
          size="sm"
          min={0}
          value={population.seed ?? null}
          {...(onSeedChange ? { onValueChange: onSeedChange } : {})}
          disabled={readOnly}
          className="ns-population__number"
        />
        <Button size="sm" onClick={onRebuild} disabled={readOnly || !onRebuild}>
          {m.rebuild}
        </Button>
        <span className="ns-study-hint">{m.rebuildHint}</span>
      </div>

      <section className="ns-study-panel" aria-labelledby={headId}>
        <div className="ns-study-panel__head">
          <h2 id={headId} className="ns-study-panel__title">{m.composition}</h2>
          {compositionNote && <span className="ns-study-hint">{compositionNote}</span>}
          {population.label && <span className="ns-study-hint ns-study-panel__end ns-study-mono">{population.label}</span>}
        </div>
        {composition.length === 0 ? (
          <div className="ns-study-empty">
            <EmptyPopulation />
            <p className="ns-study-empty__title">{m.emptyPopulationTitle}</p>
            <p className="ns-study-hint">{m.emptyPopulationBody}</p>
          </div>
        ) : (
          <div className="ns-population__grid">
            {composition.map((g) => (
              <div key={g.label} className="ns-population__group">
                <h3 className="ns-population__group-title">{g.label}</h3>
                <Composition margins={g.rows} title={g.label} width={chartWidth} locale={locale} />
              </div>
            ))}
          </div>
        )}
      </section>
      {caption && <span className="ns-study-hint">{caption}</span>}
      <div className="ns-study-callout">
        <span className="ns-tag ns-tone-signal">{m.scope}</span>
        <span>{m.scopeBody}</span>
      </div>
    </div>
  );
}
