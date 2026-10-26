#!/usr/bin/env node
// @ts-check
// icon-lint <svg-dir> <manifest.json>
import { lintIconSet } from './index.js';

const [svgDir, manifest] = process.argv.slice(2);
if (!svgDir || !manifest) {
  console.error('usage: icon-lint <svg-dir> <manifest.json>');
  process.exit(2);
}
const { checked, problems } = lintIconSet(svgDir, manifest);
for (const p of problems) console.error(`  x ${p}`);
console.log(`icon-lint: ${checked} icons, ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
