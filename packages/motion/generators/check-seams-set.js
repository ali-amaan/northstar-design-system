/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Permutation-seam check: a loop of identical marks is seamless if the MULTISET of animated states
// at frame 0 equals the multiset at frame op, per layer and per property kind.
// node check-seams-set.js <projects-dir> <project/scene> ...
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const key = v => JSON.stringify(v, (k, x) => (typeof x === 'number' ? Math.round(x * 10) / 10 : x));
for (const target of process.argv.slice(3)) {
  const j = JSON.parse(fs.readFileSync(path.join(root, target, 'lottie.json'), 'utf8'));
  let groups = 0, mismatched = 0;
  const report = [];
  j.layers.forEach(l => {
    const buckets = {};
    const walk = (o, where, prop) => {
      if (!o || typeof o !== 'object') return;
      if (o.a === 1 && Array.isArray(o.k)) {
        const kind = where.replace(/\.\d+\./g, '.#.');
        (buckets[kind] ||= { a: [], b: [] });
        buckets[kind].a.push(key(o.k[0].s));
        buckets[kind].b.push(key(o.k[o.k.length - 1].s));
        return;
      }
      for (const [k, v] of Object.entries(o)) walk(v, `${where}.${k}`);
    };
    walk(l.ks, 'ks');
    walk(l.shapes, 'shapes');
    for (const [kind, { a, b }] of Object.entries(buckets)) {
      groups++;
      const A = [...a].sort().join('|'), B = [...b].sort().join('|');
      if (A !== B) { mismatched++; report.push(`${l.nm} ${kind} (${a.length} values)`); }
    }
  });
  console.log(`${target} | ${j.nm} | property sets ${groups} | sets differing ${mismatched}`);
  report.slice(0, 6).forEach(r => console.log('   ✗', r));
}
