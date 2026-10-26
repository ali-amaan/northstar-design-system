import { test } from 'vitest';
import { expectTypeOf } from 'expect-type';
import type {
  ClaimClass,
  CostEstimate,
  FigureValue,
  MarketStatus,
  MarketStatusEntry,
  PlaceholderToken,
  Study,
  StudyState,
  StudyTab,
} from '../src/index.js';
import { MARKET_STATUS, marketStatus } from '../src/index.js';
import { figures, studies } from '../src/fixtures.js';

test('unions are exact', () => {
  expectTypeOf<StudyState>().toEqualTypeOf<
    'draft' | 'ready' | 'running' | 'complete' | 'partial' | 'failed' | 'archived'
  >();
  expectTypeOf<StudyTab>().toEqualTypeOf<'brief' | 'population' | 'research' | 'responses'>();
  expectTypeOf<ClaimClass>().toEqualTypeOf<'level' | 'direction' | 'ranking'>();
  expectTypeOf<MarketStatus>().toEqualTypeOf<'roster-ready' | 'covered' | 'registered' | 'none'>();
  expectTypeOf<PlaceholderToken>().toEqualTypeOf<
    '[SHARE]' | '[BAND]' | '[N]' | '[SEED]' | '[OPTION]' | '[COST]' | '[NAME]'
  >();
  expectTypeOf<CostEstimate>().toEqualTypeOf<{ amount: number; currency: string; basis: string } | null>();
});

test('FigureValue shape', () => {
  expectTypeOf<FigureValue['value']>().toEqualTypeOf<number>();
  expectTypeOf<FigureValue['band']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<{ value: number }>().toExtend<FigureValue>();
  expectTypeOf<{ value: string }>().not.toExtend<FigureValue>();
});

test('Study and helpers', () => {
  expectTypeOf<Study['state']>().toEqualTypeOf<StudyState>();
  expectTypeOf<Study['tab']>().toEqualTypeOf<StudyTab | undefined>();
  expectTypeOf(marketStatus).returns.toEqualTypeOf<MarketStatusEntry>();
  expectTypeOf(MARKET_STATUS.AX.coveredBy).toEqualTypeOf<'FI'>();
  expectTypeOf(studies).toEqualTypeOf<readonly Study[]>();
  expectTypeOf(figures.level.figure.claim).toEqualTypeOf<'level'>();
});
