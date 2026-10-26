/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar hero star-fields → <player>/public/projects/northstar-hero/scene-N/
// node build-lottie-hero.js <player-dir>
const fs = require('fs');
const path = require('path');

const out = path.join(process.argv[2], 'public', 'projects', 'northstar-hero');
fs.rmSync(out, { recursive: true, force: true });
const FR = 60, W = 960, H = 540;

const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const SLOTS = {
  bgColor: { p: { a: 0, k: rgba('#08090C') } },
  accent: { p: { a: 0, k: rgba('#93B4E0') } },
  ink: { p: { a: 0, k: rgba('#E8EAEE') } },
  muted: { p: { a: 0, k: rgba('#7D838F') } },
};
const CONTROLS = [
  { sid: 'bgColor', label: 'Background (Night)' },
  { sid: 'accent', label: 'Glacier (north star, measures)' },
  { sid: 'ink', label: 'Ink (agents)' },
  { sid: 'muted', label: 'Hairlines' },
];
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
const ellipse = d => ({ ty: 'el', p: st([0, 0]), s: st([d, d]), d: 1 });
const rect = (w, h) => ({ ty: 'rc', p: st([0, 0]), s: st([w, h]), r: st(0), d: 1 });
const stroke = (sid, w, o = 100) => ({ ty: 'st', c: { sid }, o: st(o), w: st(w), lc: 1, lj: 1, ml: 4 });
const fill = sid => ({ ty: 'fl', c: { sid }, o: st(100), r: 1 });
const trim = (s, e) => ({ ty: 'tm', s, e, o: st(0), m: 1 });
const group = (items, t) => ({ ty: 'gr', nm: 'g', it: [...items, t || tr()] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([0, 0, 0]), a: st([0, 0, 0]), s: ks.s || st([100, 100, 100]) },
  shapes,
});
const pol = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
const starPts = (R, r = R * 0.27, cx = 0, cy = 0) => Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(i % 2 ? r : R, i * 45); return [cx + x, cy + y]; });
const background = op => layer('background', [group([rect(W * 2, H * 2), fill('bgColor')])], op, { p: st([W / 2, H / 2, 0]) });
let seed = 20261025;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
function scene(n, nm, op, layers) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  const json = { v: '5.12.0', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, assets: [], slots: SLOTS, layers };
  fs.writeFileSync(path.join(dir, 'lottie.json'), JSON.stringify(json));
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS }, null, 2));
  console.log(nm, (JSON.stringify(json).length / 1024).toFixed(0) + ' KB', layers.length + ' layers');
}

// 1 · ns-field — the population as a whole frame. A perspective field of agents; a slow swell passes through it.
{
  const op = 240, cols = 27, rows = 12, ls = [];
  for (let r = 0; r < rows; r++) {
    const depth = r / (rows - 1);                       // 0 far, 1 near
    const y0 = 180 + Math.pow(depth, 1.35) * 330;
    const gap = 16 + depth * 26, R = 1.6 + depth * 3.2, A = 3 + depth * 9;
    for (let c = 0; c < cols; c++) {
      const x = W / 2 + (c - (cols - 1) / 2) * gap;
      if (x < -20 || x > W + 20) continue;
      const ph = c * 0.38 + r * 0.55;
      // keys at t=0, crest, trough, t=op — eased in/out between extremes approximates the sine
      const at = t => Math.sin(2 * Math.PI * t / op + ph);
      const tc = (((0.25 - ph / (2 * Math.PI)) % 1) + 1) % 1 * op, tt = (tc + op / 2) % op;
      const ts = [0, tc, tt, op].sort((a, b) => a - b);
      const yk = ts.map(t => [t, [x, y0 - A * at(t), 0], 'travel']);
      const ok = ts.map(t => [t, 40 + 55 * (at(t) + 1) / 2, 'travel']);
      ls.push(layer(`a${r}-${c}`, [group([poly(starPts(R)), fill('ink')])], op, { p: anim(yk), o: anim(ok) }));
    }
  }
  ls.push(layer('north', [group([poly(starPts(15)), fill('accent')], tr({ r: anim([[0, 0, 'linear'], [op, 90]]) }))], op, { p: st([W / 2, 92, 0]) }));
  ls.push(layer('meridian', [group([poly([[0, -60], [0, 60]], false), stroke('muted', 1, 45)])], op, { p: st([W / 2, 176, 0]) }));
  ls.push(background(op));
  scene(1, 'ns-field · population · loop', op, ls);
}

// 2 · ns-calibrate-field — a raw sample settles into the raked panel; the grid and the horizon lock it in.
{
  const op = 240, cols = 16, rows = 9, x0 = 240, y0 = 130, sx = 32, sy = 36, ls = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const tx = x0 + c * sx, ty = y0 + r * sy;
    const fx = 60 + rnd() * (W - 120), fy = 60 + rnd() * (H - 120), d = c * 3 + rnd() * 8;
    ls.push(layer(`a${r}-${c}`, [group([poly(starPts(3.4)), fill('ink')])], op, {
      p: anim([[0, [fx, fy, 0], 'travel'], [40 + d, [fx, fy, 0], 'settle'], [110 + d, [tx, ty, 0]]]),
      o: anim([[0, 0, 'enter'], [10 + rnd() * 30, 70, 'settle'], [110 + d, 100]]),
    }));
  }
  const gx = [], gy = [];
  for (let c = 0; c < cols; c++) gx.push(group([poly([[x0 + c * sx, y0 - 18], [x0 + c * sx, y0 + (rows - 1) * sy + 18]], false), trim(st(0), anim([[150 + c * 2, 0, 'enter'], [185 + c * 2, 100]])), stroke('muted', 1, 35)]));
  for (let r = 0; r < rows; r++) gy.push(group([poly([[x0 - 18, y0 + r * sy], [x0 + (cols - 1) * sx + 18, y0 + r * sy]], false), trim(st(0), anim([[150 + r * 3, 0, 'enter'], [185 + r * 3, 100]])), stroke('muted', 1, 35)]));
  ls.push(layer('north', [group([poly(starPts(14)), fill('accent')], tr({ s: anim([[196, [0, 0], 'enter'], [212, [112, 112], 'settle'], [224, [100, 100]]]) }))], op, { p: st([W / 2, 72, 0]) }));
  ls.push(layer('horizon', [group([poly([[-300, 0], [300, 0]], false), trim(anim([[170, 50, 'enter'], [205, 0]]), anim([[170, 50, 'enter'], [205, 100]])), stroke('ink', 2)])], op, { p: st([W / 2, 470, 0]) }));
  ls.push(layer('grid', [...gx, ...gy], op));
  ls.push(background(op));
  scene(2, 'ns-calibrate-field · sample → panel · once', op, ls);
}

// 3 · ns-orbit — calibration rings. Each ring turns one step per loop at its own rate; the meridian stays fixed.
{
  const op = 240, cx = W / 2, cy = H / 2, ls = [];
  [[64, 8, 1], [112, 12, -1], [162, 16, 1], [212, 20, -1]].forEach(([rad, n, dir], i) => {
    const stars = Array.from({ length: n }, (_, k) => { const [x, y] = pol(rad, (360 / n) * k); return group([poly(starPts(2.2 + i * 0.8, undefined, x, y)), fill('ink')]); });
    ls.push(layer(`ring ${i}`, [...stars, group([ellipse(rad * 2), stroke('muted', 1, 30)])], op, {
      p: st([cx, cy, 0]), r: anim([[0, 0, 'linear'], [op, dir * 360 / n]]),
    }));
  });
  ls.unshift(layer('north', [group([poly(starPts(12)), fill('accent')], tr({ s: anim([[0, [100, 100], 'travel'], [120, [112, 112], 'travel'], [op, [100, 100]]]) }))], op, { p: st([cx, cy, 0]) }));
  ls.push(layer('meridian', [group([poly([[0, -250], [0, -24]], false), stroke('muted', 1, 50)])], op, { p: st([cx, cy, 0]) }));
  ls.push(background(op));
  scene(3, 'ns-orbit · calibration · loop', op, ls);
}

// 4 · ns-aggregate — answers become figures. Scattered agents thread together, then stack into three columns that earn their bands.
{
  const op = 240, ls = [], N = 60, cols = [[600, 26], [700, 20], [800, 14]], base = 440, step = 11;
  const pts = Array.from({ length: N }, () => [90 + rnd() * 400, 90 + rnd() * 360]);
  // thread: nearest-neighbour walk
  const order = [0], used = new Set([0]);
  while (order.length < N) { const p = pts[order[order.length - 1]]; let best = -1, bd = 1e9; pts.forEach((q, j) => { if (used.has(j)) return; const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (d < bd) { bd = d; best = j; } }); order.push(best); used.add(best); }
  ls.push(layer('thread', [group([poly(order.map(i => pts[i]), false), trim(st(0), anim([[20, 0, 'enter'], [95, 100]])), stroke('muted', 1, 60)])], op, { o: anim([[100, 100, 'exit'], [130, 0]]) }));
  let k = 0;
  cols.forEach(([x, count], ci) => {
    for (let j = 0; j < count; j++, k++) {
      const [fx, fy] = pts[order[k]], d = 110 + j * 2 + ci * 6;
      ls.unshift(layer(`a${ci}-${j}`, [group([poly(starPts(3.6)), fill('ink')])], op, {
        p: anim([[0, [fx, fy, 0], 'travel'], [d, [fx, fy, 0], 'settle'], [d + 40, [x, base - j * step, 0]]]),
        o: anim([[0, 0, 'enter'], [6 + rnd() * 20, 100]]),
      }));
    }
    const top = base - (count - 1) * step - 22, t0 = 175 + ci * 6;
    ls.unshift(layer(`band ${ci}`, [
      group([poly([[-14, -9], [14, -9]], false), stroke('ink', 2)]), group([poly([[-14, 9], [14, 9]], false), stroke('ink', 2)]),
      group([poly([[0, -9], [0, 9]], false), stroke('ink', 1.25)]), group([rect(8, 8), fill('accent')]),
    ], op, { p: st([x, top, 0]), o: anim([[t0, 0, 'enter'], [t0 + 14, 100]]), s: anim([[t0, [60, 160, 100], 'settle'], [t0 + 30, [100, 100, 100]]]) }));
  });
  ls.push(layer('axis', [group([poly([[540, base + 14], [860, base + 14]], false), trim(st(0), anim([[100, 0, 'enter'], [130, 100]])), stroke('muted', 1.25, 80)])], op));
  ls.push(background(op));
  scene(4, 'ns-aggregate · answers → figures · once', op, ls);
}
