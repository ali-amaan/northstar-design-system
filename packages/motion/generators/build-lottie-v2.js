/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar instrument motion set → <player>/public/projects/northstar-instruments/scene-N/
// node build-lottie-v2.js <player-dir>
const fs = require('fs');
const path = require('path');

const out = path.join(process.argv[2], 'public', 'projects', 'northstar-instruments');
fs.rmSync(out, { recursive: true, force: true });
const FR = 60;

const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const SLOTS = {
  accent: { p: { a: 0, k: rgba('#93B4E0') } },
  ink: { p: { a: 0, k: rgba('#E8EAEE') } },
  muted: { p: { a: 0, k: rgba('#7D838F') } },
};
const CONTROLS = [
  { sid: 'accent', label: 'Glacier (signal)' },
  { sid: 'ink', label: 'Ink' },
  { sid: 'muted', label: 'Graduation' },
];
const E = {
  settle: [0, 0.65, 0.51, 0.99],
  enter: [0.2, 0.75, 0.34, 0.94],
  travel: [1, 0.49, 0, 0.55],
  exit: [1, 0.02, 0.54, 0.42],
  linear: [0, 0, 1, 1],
  hold: null,
};

const st = v => ({ a: 0, k: v });
function anim(keys) {
  keys = keys.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]);
  return {
    a: 1,
    k: keys.map(([t, s, e], i) => {
      const k = { t, s: Array.isArray(s) ? s : [s] };
      if (i < keys.length - 1) {
        if (e === 'hold') { k.h = 1; return k; }
        const [x1, y1, x2, y2] = E[e || 'settle'];
        k.o = { x: [x1], y: [y1] };
        k.i = { x: [x2], y: [y2] };
      }
      return k;
    }),
  };
}
const tr = (o = {}) => ({ ty: 'tr', p: o.p || st([0, 0]), a: st([0, 0]), s: o.s || st([100, 100]), r: o.r || st(0), o: o.o || st(100), sk: st(0), sa: st(0) });
const ellipse = d => ({ ty: 'el', p: st([0, 0]), s: st([d, d]), d: 1 });
const rect = (w, h, p = [0, 0]) => ({ ty: 'rc', p: st(p), s: st([w, h]), r: st(0), d: 1 });
const line = (a, b) => ({ ty: 'sh', d: 1, ks: st({ i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [a, b], c: false }) });
const poly = (v, c = true) => ({ ty: 'sh', d: 1, ks: st({ i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v, c }) });
const stroke = (sid, w, o = st(100)) => ({ ty: 'st', c: { sid }, o, w: st(w), lc: 1, lj: 1, ml: 4 });
const fill = sid => ({ ty: 'fl', c: { sid }, o: st(100), r: 1 });
const trim = (s, e, o = st(0)) => ({ ty: 'tm', s, e, o, m: 1 });
const group = (items, t) => ({ ty: 'gr', nm: 'g', it: [...items, t || tr()] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([32, 32, 0]), a: st([0, 0, 0]), s: ks.s || st([100, 100, 100]) },
  shapes,
});
const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [+(r * Math.cos(a)).toFixed(2), +(r * Math.sin(a)).toFixed(2)]; };
const starPts = (R, r) => Array.from({ length: 8 }, (_, i) => pt(i % 2 ? r : R, i * 45));
function scene(n, nm, w, h, op, layers) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'lottie.json'), JSON.stringify({ v: '5.12.0', fr: FR, ip: 0, op, w, h, nm, ddd: 0, assets: [], slots: SLOTS, layers }));
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS }, null, 2));
}

// Shared instrument parts (64 px canvas, rim r = 22)
const graduations = (op, every = 15) => layer('graduations', [group([
  ...Array.from({ length: 360 / every }, (_, i) => i * every).filter(a => a !== 0).map(a => line(pt(24.5, a), pt(a % 90 ? 26.5 : 28, a))),
  stroke('muted', 1.25),
])], op);
const northTick = (op, ks) => layer('north', [group([line([0, -29.5], [0, -23.5]), stroke('ink', 2)])], op, ks);
const rimLayer = (op, sid = 'ink', o = 100, draw) => layer('rim', [group([ellipse(44), ...(draw ? [trim(st(0), draw)] : []), stroke(sid, 2.5, st(o))])], op);
const needleLayer = (op, rot, sid = 'accent') => layer('needle', [group([line([0, 3], [0, -17]), stroke(sid, 3)])], op, { r: rot });
const hub = (op, sid = 'accent', s) => layer('hub', [group([rect(5, 5), fill(sid)], s ? tr({ s }) : undefined)], op);

// 1 · ns-calibrate — running loop. The needle searches for north, damps, holds, swings out again.
{
  const op = 120;
  scene(1, 'ns-calibrate · running · loop', 64, 64, op, [
    hub(op),
    needleLayer(op, anim([[0, -48, 'travel'], [22, 30, 'travel'], [40, -15, 'travel'], [55, 7, 'travel'], [67, -3, 'travel'], [78, 0, 'hold'], [100, 0, 'travel'], [op, -48]])),
    northTick(op),
    rimLayer(op, 'ink', 45),
    graduations(op),
  ]);
}

// 2 · ns-north-settle — complete, once. The rim closes, the needle swings in and settles; the star lands on north.
{
  const op = 66;
  scene(2, 'ns-north-settle · complete · once', 64, 64, op, [
    layer('star', [group([poly(starPts(6.5, 1.8)), fill('accent')], tr({ s: anim([[40, [0, 0], 'enter'], [50, [115, 115], 'settle'], [58, [100, 100]]]) }))], op, { p: st([32, 5.5, 0]) }),
    hub(op, 'ink'),
    needleLayer(op, anim([[6, -72, 'enter'], [24, 16, 'travel'], [34, -6, 'travel'], [42, 2, 'travel'], [48, 0]]), 'ink'),
    rimLayer(op, 'ink', 100, anim([[0, 0, 'enter'], [18, 100]])),
    graduations(op),
  ]);
}

// 3 · ns-rake — population rebuild, loop. Four margin bars converge on their published targets in three passes (IPF).
{
  const op = 120;
  const L = 42, x0 = -21, ys = [-15, -5, 5, 15], tgt = [30, 20, 36, 14];
  const err = [[11, -9, 7, -6], [-5, 4, -3, 3], [2, -1.5, 1, -1], [0, 0, 0, 0]];
  const ls = [];
  ys.forEach((y, i) => {
    const pct = v => Math.max(4, Math.min(100, (v / L) * 100));
    const k = [[0, pct(tgt[i] + err[0][i]), 'travel'], [26, pct(tgt[i] + err[1][i]), 'travel'], [50, pct(tgt[i] + err[2][i]), 'travel'], [70, pct(tgt[i]), 'hold'], [op, pct(tgt[i])]];
    ls.push(layer(`bar ${i}`, [group([line([x0, y], [x0 + L, y]), trim(st(0), anim(k)), stroke('ink', 4)])], op));
    ls.push(layer(`target ${i}`, [group([line([x0 + tgt[i], y - 4.5], [x0 + tgt[i], y + 4.5]), stroke('accent', 1.5)])], op));
  });
  const fade = anim([[0, 0, 'enter'], [10, 100, 'hold'], [104, 100, 'exit'], [116, 0, 'hold'], [op, 0]]);
  ls.forEach(l => { l.ks.o = fade; });
  ls.push(layer('axis', [group([line([x0 - 3, -22], [x0 - 3, 22]), stroke('muted', 1.5)])], op));
  scene(3, 'ns-rake · population · loop', 64, 64, op, ls);
}

// 4 · ns-anchor-snap — anchor check passes, once. The scale graduates from the middle out; the reading lands on its anchor.
{
  const op = 54;
  const xs = [-20, -10, 0, 10, 20];
  const ls = [layer('reading', [group([rect(6, 6), fill('accent')])], op, {
    p: anim([[16, [8, 22, 0], 'settle'], [34, [44, 22, 0], 'settle'], [40, [42, 22, 0]]]),
    o: anim([[16, 0, 'enter'], [24, 100]]),
  })];
  xs.forEach((x, i) => {
    const s = 6 + Math.abs(i - 2) * 3, h = i === 2 ? 14 : i % 2 ? 8 : 11;
    ls.push(layer(`tick ${i}`, [group([line([0, -h / 2], [0, h / 2]), stroke('ink', 1.5)], tr({ s: anim([[s, [100, 0], 'enter'], [s + 12, [100, 100]]]) }))], op, { p: st([32 + x, 38, 0]) }));
  });
  ls.push(layer('baseline', [group([line([-24, 0], [24, 0]), trim(st(0), anim([[0, 0, 'enter'], [12, 100]])), stroke('ink', 2)])], op, { p: st([32, 38, 0]) }));
  scene(4, 'ns-anchor-snap · check passes · once', 64, 64, op, ls);
}

// 5 · ns-off-axis — a check fails, once. The needle drifts off north; the deviation is measured as an arc. No shake.
{
  const op = 54;
  scene(5, 'ns-off-axis · needs fix · once', 64, 64, op, [
    hub(op, 'accent', anim([[22, [100, 100], 'settle'], [30, [150, 150], 'settle'], [42, [100, 100]]])),
    needleLayer(op, anim([[0, 0, 'enter'], [18, 25, 'settle'], [28, 22]])),
    layer('deviation', [group([poly(Array.from({ length: 14 }, (_, i) => pt(19.5, i * 2)), false), trim(st(0), anim([[0, 0, 'enter'], [18, 96], [28, 85]])), stroke('accent', 1.75)])], op),
    northTick(op),
    rimLayer(op, 'ink', 45),
    graduations(op),
  ]);
}

// 6 · ns-band-tighten — a figure lands, once. The reading appears wide, then the band tightens to its measured width.
{
  const op = 60;
  const W = 24, w = 9;
  scene(6, 'ns-band-tighten · result · once', 64, 64, op, [
    layer('reading', [group([rect(7, 7), fill('accent')], tr({ s: anim([[0, [0, 0], 'enter'], [12, [100, 100]]]) }))], op),
    layer('cap L', [group([line([0, -7], [0, 7]), stroke('ink', 2.5)])], op, { p: anim([[8, [32 - W, 32, 0], 'settle'], [40, [32 - w, 32, 0]]]) }),
    layer('cap R', [group([line([0, -7], [0, 7]), stroke('ink', 2.5)])], op, { p: anim([[8, [32 + W, 32, 0], 'settle'], [40, [32 + w, 32, 0]]]) }),
    layer('band', [group([line([-W, 0], [W, 0]), trim(anim([[8, 0, 'settle'], [40, (W - w) / (2 * W) * 100]]), anim([[8, 100, 'settle'], [40, 100 - (W - w) / (2 * W) * 100]])), stroke('ink', 2.5)])], op),
    layer('axis', [group([line([-28, 14], [28, 14]), stroke('muted', 1.25)])], op),
  ]);
}

// 7 · ns-register — autosave, loop. Three registers set in turn, then clear together.
{
  const op = 60;
  const ls = [];
  [-12, 0, 12].forEach((x, i) => {
    const ph = i * 9;
    ls.push(layer(`set ${i}`, [group([line([0, 9], [0, -9]), stroke('ink', 3.5)], tr({ s: anim([[0, [100, 0], 'hold'], [ph, [100, 0], 'enter'], [ph + 12, [100, 100], 'hold'], [op, [100, 100]]]) }))], op, {
      p: st([32 + x, 41, 0]),
      o: anim([[0, 100, 'hold'], [44, 100, 'exit'], [54, 0, 'hold'], [op, 0]]),
    }));
    ls.push(layer(`slot ${i}`, [group([line([0, 9], [0, -9]), stroke('muted', 1.25)])], op, { p: st([32 + x, 32, 0]) }));
  });
  ls.forEach(l => { if (l.nm.startsWith('set')) l.shapes[0].it[0] = line([0, 0], [0, -18]); });
  scene(7, 'ns-register · saving · loop', 64, 64, op, ls);
}

// 8 · ns-horizon — awaiting responses, once. The horizon draws and graduates; the north star rises and turns an eighth.
{
  const op = 120;
  const ls = [
    layer('star', [group([poly(starPts(13, 3.4)), fill('accent')], tr({ s: anim([[30, [60, 60], 'settle'], [72, [100, 100]]]), r: anim([[72, 0, 'travel'], [116, 45]]) }))], op, {
      p: anim([[30, [80, 70, 0], 'settle'], [72, [80, 38, 0]]]), o: anim([[30, 0, 'enter'], [44, 100]]),
    }),
    layer('north', [group([line([0, -6], [0, 0]), stroke('ink', 1.5)])], op, { p: st([80, 66, 0]), o: anim([[60, 0, 'enter'], [72, 100]]) }),
  ];
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    ls.push(layer(`grad ${i}`, [group([line([0, 0], [0, Math.abs(i) % 2 ? 3 : 5]), stroke('muted', 1.25)])], op, {
      p: st([80 + i * 11, 67, 0]), o: anim([[14 + Math.abs(i) * 4, 0, 'enter'], [24 + Math.abs(i) * 4, 100]]),
    }));
  }
  ls.push(layer('horizon', [group([line([-60, 0], [60, 0]), trim(anim([[0, 50, 'enter'], [36, 0]]), anim([[0, 50, 'enter'], [36, 100]])), stroke('ink', 2)])], op, { p: st([80, 66, 0]) }));
  scene(8, 'ns-horizon · awaiting responses · once', 160, 96, op, ls);
}

console.log('wrote', out);
