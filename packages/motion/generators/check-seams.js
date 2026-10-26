/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Loop-seam check: every animated property's value at frame 0 must equal its value at frame op.
// Rotations that differ by a whole symmetry step are reported separately (expected for rings).
// node check-seams.js <projects-dir> <project/scene> ...
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
for (const target of process.argv.slice(3)) {
  const j = JSON.parse(fs.readFileSync(path.join(root, target, 'lottie.json'), 'utf8'));
  const res = { n: 0, diff: [], rot: [] };
  const walk = (o, where) => {
    if (!o || typeof o !== 'object') return;
    if (o.a === 1 && Array.isArray(o.k)) {
      res.n++;
      const a = o.k[0].s, b = o.k[o.k.length - 1].s;
      if (JSON.stringify(a) !== JSON.stringify(b)) (/\.r$/.test(where) ? res.rot : res.diff).push(`${where} ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
      return;
    }
    for (const [k, v] of Object.entries(o)) walk(v, `${where}.${k}`);
  };
  j.layers.forEach(l => { walk(l.ks, `${l.nm}.ks`); walk(l.shapes, `${l.nm}.shapes`); });
  console.log(`${target} | ${j.nm} | animated ${res.n} | mismatched ${res.diff.length} | rotation steps ${res.rot.length}`);
  res.diff.slice(0, 5).forEach(d => console.log('   ✗', d.slice(0, 160)));
  res.rot.slice(0, 3).forEach(d => console.log('   ↻', d.slice(0, 160)));
}
