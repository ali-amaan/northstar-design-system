// @vitest-environment jsdom
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MARKET_STATUS } from '@northstar-js/contracts';
import { CountryMap, CountryMark, FEATURES, MarketStatus, WorldMap, loadCountryMap } from '../src/index.js';

afterEach(cleanup);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = (p: string) => join(ROOT, p);

describe('shipped files', () => {
  it('ships 241 maps per theme plus marks and an index', () => {
    for (const d of ['night', 'day', 'marks']) expect(readdirSync(pkg(`dist/maps/${d}`)).filter((f) => f.endsWith('.svg'))).toHaveLength(241);
    const index = JSON.parse(readFileSync(pkg('dist/maps/index.json'), 'utf8')) as unknown[];
    expect(index).toHaveLength(241);
    expect(FEATURES).toHaveLength(241);
  });
  it('bakes the same market status as contracts', () => {
    const file = JSON.parse(readFileSync(pkg('data/market-status.json'), 'utf8')) as { markets: { code: string; status: string; coveredBy?: string }[] };
    const fromContracts = Object.values(MARKET_STATUS).map((e) => ({ ...e }));
    expect(file.markets).toEqual(fromContracts);
    for (const e of fromContracts) expect(FEATURES.find((f) => f.key === e.code)?.status).toBe(e.status);
  });
});

describe('MarketStatus', () => {
  it('row: star, name and label for a roster-ready market', () => {
    const { container } = render(<MarketStatus code="fi" />);
    expect(screen.getByText('Finland')).toBeTruthy();
    expect(screen.getByText('Roster-ready')).toBeTruthy();
    expect(container.querySelector('[data-mark="star"]')).toBeTruthy();
  });
  it('mark: ring for registered, with an accessible name', () => {
    const { container } = render(<MarketStatus code="US" variant="mark" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('United States: Registered · not calibrated');
    expect(container.querySelector('[data-mark="ring"]')).toBeTruthy();
  });
  it('label: words only; unknown market is not available', () => {
    const { container } = render(<MarketStatus code="SE" variant="label" />);
    expect(container.textContent).toBe('Not available');
    expect(container.querySelector('svg')).toBeNull();
  });
  it('covered names the host roster', () => {
    render(<MarketStatus code="AX" variant="label" />);
    expect(screen.getByText('Covered by FI roster')).toBeTruthy();
  });
});

describe('WorldMap', () => {
  it('draws every feature even-odd, marks from contracts, and the selection', () => {
    const { container } = render(<WorldMap selected="JP" />);
    expect(container.querySelectorAll('[data-part="land"] path')).toHaveLength(241);
    expect(container.querySelector('[data-part="land"]')?.getAttribute('fill-rule')).toBe('evenodd');
    expect(container.querySelector('[data-selected="true"]')?.getAttribute('data-key')).toBe('JP');
    expect(container.querySelectorAll('[data-mark="star"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-mark="ring"]')).toHaveLength(1);
  });
  it('accepts a record of marks', () => {
    const { container } = render(<WorldMap marks={{ FI: 'roster-ready' }} />);
    expect(container.querySelectorAll('[data-part="marks"] > *')).toHaveLength(1);
  });
});

describe('CountryMap and CountryMark', () => {
  it('lazy-loads a country and renders its layers', async () => {
    const { container } = render(<CountryMap code="FI" size="thumb" />);
    expect(container.querySelector('svg')?.getAttribute('aria-busy')).toBe('true');
    await waitFor(() => expect(container.querySelectorAll('path').length).toBeGreaterThan(2));
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('96');
    expect(svg.getAttribute('aria-label')).toContain('Roster-ready');
  });
  it('renders preloaded data synchronously', async () => {
    const data = await loadCountryMap('JP');
    expect(data?.viewBox).toBe('0 0 512 512');
    const { container } = render(<CountryMap code="JP" data={data!} />);
    expect(container.querySelector('title')?.textContent).toBe('Japan');
  });
  it('mark loads its outline', async () => {
    const { container } = render(<CountryMark code="JP" size={20} />);
    await waitFor(() => expect(container.querySelector('path')).toBeTruthy());
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Japan');
  });
  it('unknown code stays empty', async () => {
    expect(await loadCountryMap('ZZ')).toBeNull();
  });
});
