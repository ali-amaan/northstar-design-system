import { describe, expect, it } from 'vitest';
import { MARKET_STATUS, PLACEHOLDER_TOKENS, marketStatus } from '../src/index.js';
import { figures, studies } from '../src/fixtures.js';

describe('marketStatus', () => {
  it('returns the known markets', () => {
    expect(marketStatus('FI')).toEqual({ code: 'FI', status: 'roster-ready' });
    expect(marketStatus('JP')).toEqual({ code: 'JP', status: 'roster-ready' });
    expect(marketStatus('AX')).toEqual({ code: 'AX', status: 'covered', coveredBy: 'FI' });
    expect(marketStatus('US')).toEqual({ code: 'US', status: 'registered' });
  });
  it('normalises case and whitespace', () => {
    expect(marketStatus(' fi ').status).toBe('roster-ready');
  });
  it('treats every other code as none', () => {
    expect(marketStatus('SE')).toEqual({ code: 'SE', status: 'none' });
    expect(marketStatus('')).toEqual({ code: '', status: 'none' });
  });
  it('returns a copy, not the constant', () => {
    const entry = marketStatus('FI');
    entry.status = 'none';
    expect(MARKET_STATUS.FI.status).toBe('roster-ready');
  });
});

describe('fixtures', () => {
  it('display strings use only placeholder tokens', () => {
    for (const { display } of Object.values(figures)) {
      const tokens = display.match(/\[[A-Z]+\]/g) ?? [];
      expect(tokens.length).toBeGreaterThan(0);
      for (const t of tokens) expect(PLACEHOLDER_TOKENS).toContain(t);
      expect(display).not.toMatch(/\d/);
    }
  });
  it('carry no plausible numbers', () => {
    for (const { figure } of Object.values(figures)) expect(figure.value).toBe(0);
    for (const s of studies) expect(s.population.size).toBe(0);
  });
});
