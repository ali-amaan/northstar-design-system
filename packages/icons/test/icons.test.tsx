// @vitest-environment jsdom
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lintIconSet } from '@northstar-js/tooling-icon-lint';
import { Icon, iconNames, icons, RunningIcon, FreeTextIcon } from '../src/index.js';

const svgDir = join(import.meta.dirname, '..', 'src', 'svg');
const manifestPath = join(import.meta.dirname, '..', 'src', 'manifest.json');

describe('source set', () => {
  it('passes icon-lint', () => {
    const { checked, problems } = lintIconSet(svgDir, manifestPath);
    expect(problems).toEqual([]);
    expect(checked).toBe(50);
  });
  it('manifest and generated data agree', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { icons: { name: string; title: string }[] };
    expect([...iconNames].sort()).toEqual(manifest.icons.map(i => i.name).sort());
    for (const i of manifest.icons) expect(icons[i.name as keyof typeof icons].title).toBe(i.title);
  });
});

describe('<Icon>', () => {
  it('is decorative without a title', () => {
    const { container } = render(<Icon name="study" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.querySelector('title')).toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 20 20');
    expect(svg.getAttribute('width')).toBe('20');
  });
  it('is named by its title', () => {
    const { getByRole } = render(<Icon name="search" title="Search studies" size={24} />);
    const svg = getByRole('img', { name: 'Search studies' });
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('height')).toBe('24');
  });
  it('takes ref as a prop', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon name="north" ref={ref} />);
    expect(ref.current?.tagName.toLowerCase()).toBe('svg');
  });
  it('draws only currentColor at 1 and 1.5', () => {
    const { container } = render(<RunningIcon />);
    const paths = [...container.querySelectorAll('path')];
    expect(paths.length).toBe(3);
    for (const p of paths) {
      expect([p.getAttribute('fill'), p.getAttribute('stroke')].filter(Boolean).every(v => v === 'none' || v === 'currentColor')).toBe(true);
      const w = p.getAttribute('stroke-width');
      if (w) expect(['1', '1.5']).toContain(w);
    }
  });
  it('named exports render their icon', () => {
    const { container } = render(<FreeTextIcon className="x" />);
    expect(container.querySelector('svg')?.getAttribute('data-ns-icon')).toBe('free-text');
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('x');
  });
});
