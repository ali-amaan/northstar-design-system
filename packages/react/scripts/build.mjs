// Build: tsc to dist, then copy the stylesheets (styles.css, effects.css, backdrops.css). "use client" directives
// are written in the source files and preserved by tsc.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
rmSync(join(root, 'dist'), { recursive: true, force: true });
const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
execFileSync(process.execPath, [tsc, '-p', join(root, 'tsconfig.build.json')], { stdio: 'inherit' });
mkdirSync(join(root, 'dist'), { recursive: true });
for (const file of ['styles.css', 'effects.css', 'backdrops.css']) {
  const css = readFileSync(join(root, 'src', file), 'utf8');
  // Guard: only --ns-* custom properties may be referenced.
  const bad = [...css.matchAll(/var\((--[a-z0-9-]+)/gi)].map((m) => m[1]).filter((v) => !v.startsWith('--ns-'));
  if (bad.length) throw new Error(`${file} references non --ns-* variables: ${[...new Set(bad)].join(', ')}`);
  copyFileSync(join(root, 'src', file), join(root, 'dist', file));
}
