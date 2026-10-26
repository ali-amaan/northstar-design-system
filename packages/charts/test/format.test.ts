import { describe, expect, it } from 'vitest';
import { formatBand, formatNumber, formatPercent, formatPoints } from '../src/format.js';

describe('format', () => {
  it('percent', () => {
    expect(formatPercent(0.42)).toBe('42%');
    expect(formatPercent(0.425, { digits: 1 })).toBe('42.5%');
    expect(formatPercent(0.425, { digits: 1, locale: 'fi' })).toBe('42,5 %');
    expect(formatPercent(Number.NaN)).toBe('–');
  });
  it('points and band', () => {
    expect(formatPoints(6)).toBe('6 pp');
    expect(formatPoints(-1.5, { digits: 1 })).toBe('−1.5 pp');
    expect(formatPoints(2, { sign: true })).toBe('+2 pp');
    expect(formatBand(-6)).toBe('± 6 pp');
  });
  it('number', () => {
    expect(formatNumber(1200)).toBe('1,200');
    expect(formatNumber(1200, { locale: 'fi' })).toBe('1 200');
  });
});
