// @ts-check
import { describe, expect, it } from 'vitest';
import { lintIcon } from './index.js';

const ok =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Ok</title>' +
  '<path d="M1 1h2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M2 2h1v1z" fill="currentColor"/></svg>';

describe('lintIcon', () => {
  it('passes a clean icon', () => expect(lintIcon('fact-card', ok, { title: 'Ok' })).toEqual([]));
  it('rejects a non-kebab name', () => expect(lintIcon('FactCard', ok).join()).toMatch(/kebab/));
  it('rejects the wrong grid', () => expect(lintIcon('a', ok.replace('0 0 20 20', '0 0 24 24')).join()).toMatch(/viewBox/));
  it('rejects stroke widths other than 1 and 1.5', () =>
    expect(lintIcon('a', ok.replace('stroke-width="1.5"', 'stroke-width="2"')).join()).toMatch(/stroke-width/));
  it('rejects hard-coded colour', () =>
    expect(lintIcon('a', ok.replace('fill="currentColor"', 'fill="#93B4E0"')).join()).toMatch(/currentColor/));
  it('rejects transform, style and id', () => {
    const errs = lintIcon('a', ok.replace('<path d="M2', '<path transform="rotate(4)" style="x" id="a" d="M2')).join();
    for (const w of ['transform', 'style', 'id']) expect(errs).toContain(`attribute ${w}`);
  });
  it('rejects text, image, filter and mask elements', () => {
    for (const el of ['text', 'image', 'filter', 'mask'])
      expect(lintIcon('a', ok.replace('</svg>', `<${el}/></svg>`)).join()).toContain(`<${el}>`);
  });
  it('requires a title', () => expect(lintIcon('a', ok.replace('<title>Ok</title>', '')).join()).toMatch(/title/));
  it('requires a manifest title when an entry is given', () =>
    expect(lintIcon('a', ok, { title: ' ' }).join()).toMatch(/manifest title/));
});
