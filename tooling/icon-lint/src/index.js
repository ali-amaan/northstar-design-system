// @ts-check
// Icon checks for the Northstar instrument set. Pure functions plus a directory runner; no dependencies.
import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

export const ALLOWED_STROKE_WIDTHS = ['1', '1.5'];
export const ALLOWED_PAINT = ['currentColor', 'none'];
const FORBIDDEN_ELEMENTS = ['text', 'image', 'filter', 'mask', 'style', 'foreignObject', 'use', 'script'];
const FORBIDDEN_ATTRIBUTES = ['transform', 'style', 'id', 'class', 'filter', 'mask'];
const PAINT_ATTRIBUTES = ['fill', 'stroke', 'color', 'stop-color'];
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** @typedef {{ name: string, attrs: Record<string, string>, text: string }} SvgElement */

/**
 * Minimal tokenizer for the flat SVG this set uses: each start tag, its attributes and the text after it.
 * @param {string} source
 * @returns {SvgElement[]}
 */
export function parseSvg(source) {
  /** @type {SvgElement[]} */
  const out = [];
  const tag = /<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*\/?>([^<]*)/g;
  for (const m of source.matchAll(tag)) {
    /** @type {Record<string, string>} */
    const attrs = {};
    for (const a of (m[2] ?? '').matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1] ?? ''] = a[2] ?? a[3] ?? '';
    out.push({ name: m[1] ?? '', attrs, text: (m[3] ?? '').trim() });
  }
  return out;
}

/**
 * @param {string} name icon name (file basename)
 * @param {string} source SVG text
 * @param {{ title?: string }} [entry] the manifest entry, when there is one
 * @returns {string[]} problems; empty when the icon passes
 */
export function lintIcon(name, source, entry) {
  /** @type {string[]} */
  const errs = [];
  if (!KEBAB.test(name)) errs.push(`name "${name}" is not kebab-case`);
  const els = parseSvg(source);
  const root = els[0];
  if (!root || root.name !== 'svg') return [...errs, 'root element is not <svg>'];
  if (root.attrs.viewBox !== '0 0 20 20') errs.push(`viewBox is "${root.attrs.viewBox ?? ''}", expected "0 0 20 20"`);
  const title = els.find(e => e.name === 'title');
  if (!title || !title.text) errs.push('missing <title>');
  if (entry && !entry.title?.trim()) errs.push('manifest title is empty');
  if (!els.some(e => e.name !== 'svg' && e.name !== 'title')) errs.push('no drawing elements');
  for (const el of els) {
    if (FORBIDDEN_ELEMENTS.includes(el.name)) errs.push(`<${el.name}> is not allowed`);
    for (const [k, v] of Object.entries(el.attrs)) {
      if (FORBIDDEN_ATTRIBUTES.includes(k)) errs.push(`<${el.name}> has forbidden attribute ${k}`);
      if (PAINT_ATTRIBUTES.includes(k) && !ALLOWED_PAINT.includes(v)) errs.push(`<${el.name}> ${k}="${v}": only currentColor or none`);
      if (k === 'stroke-width' && !ALLOWED_STROKE_WIDTHS.includes(v)) errs.push(`<${el.name}> stroke-width="${v}": only 1 or 1.5`);
    }
    if (el.name !== 'svg' && el.attrs.stroke && el.attrs.stroke !== 'none' && !el.attrs['stroke-width'])
      errs.push(`<${el.name}> is stroked without an explicit stroke-width`);
  }
  return errs;
}

/**
 * Lints every *.svg in a directory against a manifest ({ icons: [{ name, title, tags }] }).
 * @param {string} svgDir
 * @param {string} manifestPath
 * @returns {{ checked: number, problems: string[] }}
 */
export function lintIconSet(svgDir, manifestPath) {
  /** @type {{ icons: { name: string, title: string, tags: string[] }[] }} */
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const byName = new Map(manifest.icons.map(i => [i.name, i]));
  const files = readdirSync(svgDir).filter(f => f.endsWith('.svg')).sort();
  /** @type {string[]} */
  const problems = [];
  const seen = new Set();
  for (const f of files) {
    const name = basename(f, '.svg');
    seen.add(name);
    const entry = byName.get(name);
    if (!entry) problems.push(`${name}: not in manifest`);
    else if (!Array.isArray(entry.tags) || entry.tags.length === 0) problems.push(`${name}: manifest has no tags`);
    for (const e of lintIcon(name, readFileSync(join(svgDir, f), 'utf8'), entry)) problems.push(`${name}: ${e}`);
  }
  for (const n of byName.keys()) if (!seen.has(n)) problems.push(`${n}: in manifest but no SVG file`);
  if (byName.size !== manifest.icons.length) problems.push('manifest has duplicate names');
  return { checked: files.length, problems };
}
