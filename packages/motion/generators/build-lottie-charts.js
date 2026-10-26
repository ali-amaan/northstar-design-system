/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar charts → <player>/public/projects/northstar-charts/scene-N/
// node build-lottie-charts.js <player-dir>
// Helpers copied from build-lottie-hero.js (that file is not edited).
const fs = require('fs');
const path = require('path');

if (!process.argv[2]) { console.error('usage: node build-lottie-charts.js <player-dir>'); process.exit(1); }
const out = path.join(process.argv[2], 'public', 'projects', 'northstar-charts');
fs.rmSync(out, { recursive: true, force: true });
const FR = 60;

const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const SLOTS = {
  bgColor: { p: { a: 0, k: rgba('#08090C') } },
  accent: { p: { a: 0, k: rgba('#93B4E0') } },
  ink: { p: { a: 0, k: rgba('#E8EAEE') } },
  muted: { p: { a: 0, k: rgba('#7D838F') } },
};
const CONTROL = {
  bgColor: { sid: 'bgColor', label: 'Background (Night)' },
  accent: { sid: 'accent', label: 'Glacier (north star, measures)' },
  ink: { sid: 'ink', label: 'Ink (agents, bands)' },
  muted: { sid: 'muted', label: 'Hairlines' },
};
const E = { settle: [0, 0.65, 0.51, 0.99], enter: [0.2, 0.75, 0.34, 0.94], travel: [1, 0.49, 0, 0.55], exit: [1, 0.02, 0.54, 0.42], linear: [0, 0, 1, 1] };
const r2 = v => Math.round(v * 100) / 100;
const st = v => ({ a: 0, k: v });
function anim(keys) {
  keys = keys.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]);
  if (keys.length === 1) return st(keys[0][1]);
  return { a: 1, k: keys.map(([t, s, e], i) => {
    const k = { t: Math.round(t), s: (Array.isArray(s) ? s : [s]).map(r2) };
    if (i < keys.length - 1) { const [x1, y1, x2, y2] = E[e || 'settle']; k.o = { x: [x1], y: [y1] }; k.i = { x: [x2], y: [y2] }; }
    return k;
  }) };
}
const tr = (o = {}) => ({ ty: 'tr', p: o.p || st([0, 0]), a: st([0, 0]), s: o.s || st([100, 100]), r: o.r || st(0), o: o.o || st(100), sk: st(0), sa: st(0) });
const poly = (v, c = true) => ({ ty: 'sh', d: 1, ks: st({ i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v: v.map(p => p.map(r2)), c }) });
const rect = (w, h, p = [0, 0]) => ({ ty: 'rc', p: st(p), s: st([w, h]), r: st(0), d: 1 });
const stroke = (sid, w, o = 100) => ({ ty: 'st', c: { sid }, o: st(o), w: st(w), lc: 1, lj: 1, ml: 4 });
const fill = (sid, o = 100) => ({ ty: 'fl', c: { sid }, o: st(o), r: 1 });
const trim = (s, e) => ({ ty: 'tm', s, e, o: st(0), m: 1 });
const group = (items, t) => ({ ty: 'gr', nm: 'g', it: [...items, t || tr()] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([0, 0, 0]), a: st([0, 0, 0]), s: ks.s || st([100, 100, 100]) },
  shapes,
});
const pol = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
const starPts = (R, r = R * 0.27, cx = 0, cy = 0) => Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(i % 2 ? r : R, i * 45); return [cx + x, cy + y]; });
const background = (op, W, H) => layer('background', [group([rect(W * 2, H * 2), fill('bgColor')])], op, { p: st([W / 2, H / 2, 0]) });

const report = [];
function scene(n, nm, op, W, H, layers, sids) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  const json = { v: '5.12.0', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, assets: [], slots: SLOTS, layers };
  const text = JSON.stringify(json);
  fs.writeFileSync(path.join(dir, 'lottie.json'), text);
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: sids.map(s => CONTROL[s]) }, null, 2));
  report.push([`scene-${n}`, nm, `${W}x${H}`, `${op}f`, (text.length / 1024).toFixed(1) + ' KB', layers.length + ' layers']);
}

// 1 · ns-distribution — stars drop into five Likert stacks (each star = k agents), settle,
//     then the Glacier top-2-box bracket draws centre-out over anchors 4–5. Full-frame demo.
{
  const op = 150, W = 640, H = 360, base = 288, px = 15, py = 16, R = 4.6;
  const cxs = [100, 210, 320, 430, 540];
  const counts = [8, 17, 25, 37, 21];             // illustrative heights, 108 stars
  const rows = counts.map(c => Math.ceil(c / 3));
  const ls = [];
  // bracket over the top-2 box (anchors 4 and 5), drawn centre-out after the stacks land
  const top = Math.min(...[3, 4].map(c => base - 10 - (rows[c] - 1) * py)) - R;
  const by = Math.round(top - 14), x0 = cxs[3] - px - R - 8, x1 = cxs[4] + px + R + 8;
  ls.push(layer('top-2 bracket', [group([
    poly([[x0, by + 8], [x0, by], [x1, by], [x1, by + 8]], false),
    trim(anim([[102, 50, 'enter'], [128, 0]]), anim([[102, 50, 'enter'], [128, 100]])),
    stroke('accent', 1.5),
  ])], op));
  // stars — bottom row lands first across all five columns, so the histogram rises as one body
  counts.forEach((n, c) => {
    for (let j = 0; j < n; j++) {
      const row = Math.floor(j / 3), inRow = Math.min(3, n - row * 3), pos = j % 3;
      const off = inRow === 3 ? (pos - 1) * px : inRow === 2 ? (pos - 0.5) * px : 0;
      const x = cxs[c] + off, y = base - 10 - row * py;
      const t0 = 18 + row * 4 + c * 2 + pos, drop = 70 + row * 3;
      ls.push(layer(`agent ${c + 1}.${j + 1}`, [group([poly(starPts(R)), fill('ink')])], op, {
        p: anim([[t0, [x, y - drop, 0], 'enter'], [t0 + 24, [x, y, 0]]]),
        o: anim([[t0, 0, 'settle'], [t0 + 8, 100]]),
      }));
    }
  });
  ls.push(layer('anchor ticks', cxs.map((x, i) => group([
    poly([[x, base], [x, base + 7]], false),
    trim(st(0), anim([[10 + i * 3, 0, 'enter'], [22 + i * 3, 100]])),
    stroke('muted', 1),
  ])), op));
  ls.push(layer('horizon', [group([
    poly([[40, base], [600, base]], false),
    trim(anim([[0, 50, 'enter'], [26, 0]]), anim([[0, 50, 'enter'], [26, 100]])),
    stroke('muted', 1),
  ])], op));
  ls.push(background(op, W, H));
  scene(1, 'ns-distribution · star stacks · once', op, W, H, ls, ['bgColor', 'accent', 'ink', 'muted']);
}

// 2 · ns-figure — the node lands, the graduation axis draws, and the band caps tighten onto
//     the node; ends on the settled figure glyph. Transparent.
{
  const op = 120, W = 320, H = 200, ay = 122, ax0 = 32, ax1 = 288, u = (ax1 - ax0) / 100;
  // illustrative share; the half-width is R1 concrete_habit's band_pp (6) from studies.py RELIABILITY,
  // matching the Level glyph this scene plays on
  const nx = ax0 + 62 * u, ny = 82, b = 6 * u, wide = 84;
  const ls = [];
  ls.push(layer('node', [group([rect(10, 10), fill('accent')])], op, {
    p: st([nx, ny, 0]), s: anim([[12, [0, 0, 100], 'settle'], [32, [100, 100, 100]]]),
  }));
  ls.push(layer('cap left', [group([poly([[0, -9], [0, 9]], false), stroke('ink', 1.5)])], op, {
    p: anim([[28, [nx - b - wide, ny, 0], 'settle'], [88, [nx - b, ny, 0]]]), o: anim([[28, 0, 'settle'], [42, 100]]),
  }));
  ls.push(layer('cap right', [group([poly([[0, -9], [0, 9]], false), stroke('ink', 1.5)])], op, {
    p: anim([[28, [nx + b + wide, ny, 0], 'settle'], [88, [nx + b, ny, 0]]]), o: anim([[28, 0, 'settle'], [42, 100]]),
  }));
  const k = (b + wide) / b * 100;
  ls.push(layer('band', [group([poly([[-b, 0], [b, 0]], false), stroke('ink', 1.5)])], op, {
    p: st([nx, ny, 0]), s: anim([[28, [k, 100, 100], 'settle'], [88, [100, 100, 100]]]), o: anim([[28, 0, 'settle'], [42, 100]]),
  }));
  ls.push(layer('reading', [group([poly([[nx, ny + 6], [nx, ay]], false), trim(st(0), anim([[84, 0, 'enter'], [100, 100]])), stroke('muted', 1, 60)])], op));
  const ticks = [];
  for (let v = 0, i = 0; v <= 100; v += 5, i++) {
    const x = ax0 + v * u, len = v % 25 ? 4 : 8, t = 4 + i * 1.6;
    ticks.push(group([poly([[x, ay], [x, ay + len]], false), trim(st(0), anim([[t, 0, 'enter'], [t + 10, 100]])), stroke('muted', 1, v % 25 ? 60 : 100)]));
  }
  ls.push(layer('graduations', ticks, op));
  ls.push(layer('axis', [group([poly([[ax0, ay], [ax1, ay]], false), trim(st(0), anim([[0, 0, 'enter'], [38, 100]])), stroke('muted', 1)])], op));
  scene(2, 'ns-figure · band tightens · once', op, W, H, ls, ['accent', 'ink', 'muted']);
}

// 3 · ns-ranking — item bars arrive in a scrambled order, travel to their ranks, then slot into
//     the spine; hollow nodes mark positions without values; north lands on top. Transparent.
{
  const op = 120, W = 320, H = 240, sx = 40, bw = 220, bh = 22, bx = 60 + bw / 2;
  const ry = r => 46 + r * 42;
  const start = [3, 0, 4, 1, 2];                 // starting slot for final rank r
  const label = 88;                              // one label stand-in length: unequal rules would read as values
  const ls = [];
  ls.push(layer('north', [group([poly(starPts(7)), fill('accent')], tr({ s: anim([[96, [0, 0], 'settle'], [112, [100, 100]]]) }))], op, { p: st([sx, 16, 0]) }));
  for (let r = 0; r < 5; r++) {
    const t = 22 + r * 6, s = start[r];
    ls.push(layer(`node ${r + 1}`, [group([rect(8, 8), stroke('ink', 1.5)], tr({ s: anim([[t + 46, [0, 0], 'settle'], [t + 58, [100, 100]]]) }))], op, { p: st([sx, ry(r), 0]) }));
    ls.push(layer(`item ${r + 1}`, [
      group([
        group([poly([[-bw / 2 + 12, 0], [-bw / 2 + 12 + label, 0]], false), stroke('ink', 2)]),
        group([rect(bw, bh), fill('muted', 22), stroke('muted', 1)]),
        group([poly([[-bw / 2 - 16, 0], [-bw / 2, 0]], false), stroke('muted', 1)]),
      ], tr({ p: anim([[t + 34, [24, 0], 'settle'], [t + 56, [0, 0]]]) })),
    ], op, {
      p: anim([[t, [bx, ry(s), 0], 'travel'], [t + 36, [bx, ry(r), 0]]]),
      o: anim([[4 + s * 3, 0, 'settle'], [16 + s * 3, 100]]),
    }));
  }
  // the spine breaks 5 px above and below each node centre, so it never runs through a hollow
  // "position, no value" square (the scene is transparent, so no knock-out fill). Each segment
  // draws top-down over the same 10 frames, 3 frames after the one above it.
  const cuts = [30, ...[0, 1, 2, 3, 4].flatMap(r => [ry(r) - 5, ry(r) + 5]), 226];
  const segs = [];
  for (let i = 0; i < cuts.length; i += 2) segs.push([cuts[i], cuts[i + 1]]);
  ls.push(layer('spine', segs.map(([y0, y1], i) => group([
    poly([[sx, y0], [sx, y1]], false),
    trim(st(0), anim([[i * 3, 0, 'enter'], [i * 3 + 10, 100]])),
    stroke('muted', 1),
  ])), op));
  scene(3, 'ns-ranking · items slot into order · once', op, W, H, ls, ['accent', 'ink', 'muted']);
}

console.table(report);
