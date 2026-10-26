import { expect } from 'vitest';
import { axe } from 'vitest-axe';

/** Run axe over the whole document (portals included). Colour contrast is
 * checked by tooling/contrast against the tokens; jsdom cannot compute it. */
export async function expectNoAxeViolations(root: Element = document.body): Promise<void> {
  const results = await axe(root, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`);
  expect(summary).toEqual([]);
}
