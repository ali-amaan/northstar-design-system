/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Builds the Northstar Lottie set into the player's public/projects/northstar/.
// node build-lottie.js <player-dir>
const fs = require('fs');
const path = require('path');

const out = path.join(process.argv[2], 'public', 'projects', 'northstar');
const FR = 60;

const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const SLOTS = {
  accent: { p: { a: 0, k: rgba('#93B4E0') } },
  ink: { p: { a: 0, k: rgba('#E8EAEE') } },
  muted: { p: { a: 0, k: rgba('#7D838F') } },
  ground: { p: { a: 0, k: rgba('#08090C') } },
};
const CONTROLS = [
  { sid: 'accent', label: 'Glacier (accent)' },
  { sid: 'ink', label: 'Ink' },
  { sid: 'muted', label: 'Muted' },
  { sid: 'ground', label: 'Ground (cut-outs)' },
];

// Easing anchors from motion-taste: [x1,y1,x2,y2]
const E = {
  settle: [0, 0.65, 0.51, 0.99],
  enter: [0.2, 0.75, 0.34, 0.94],
  travel: [1, 0.49, 0, 0.55],
  exit: [1, 0.02, 0.54, 0.42],
  linear: [0, 0, 1, 1],
};

const st = v => ({ a: 0, k: v });
// keys: [[t, value, ease?], ...] — ease applies to the segment starting at that key
function anim(keys) {
  return {
    a: 1,
    k: keys.map(([t, s, e], i) => {
      const k = { t, s: Array.isArray(s) ? s : [s] };
      if (i < keys.length - 1) {
        const [x1, y1, x2, y2] = E[e || 'settle'];
        k.o = { x: [x1], y: [y1] };
        k.i = { x: [x2], y: [y2] };
      }
      return k;
    }),
  };
}

const tr = (o = {}) => ({
  ty: 'tr',
  p: o.p || st([0, 0]), a: st([0, 0]), s: o.s || st([100, 100]),
  r: o.r || st(0), o: o.o || st(100), sk: st(0), sa: st(0),
});
const ellipse = (d, p = [0, 0]) => ({ ty: 'el', p: st(p), s: st([d, d]), d: 1 });
const rect = (w, h, r, p = [0, 0]) => ({ ty: 'rc', p: st(p), s: st([w, h]), r: st(r), d: 1 });
const pathShape = (v, closed = false) => ({
  ty: 'sh', d: 1,
  ks: st({ i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v, c: closed }),
});
const stroke = (sid, w, o = st(100)) => ({ ty: 'st', c: { sid }, o, w: st(w), lc: 2, lj: 2, ml: 4 });
const fill = (sid, o = st(100)) => ({ ty: 'fl', c: { sid }, o, r: 1 });
const trim = (s, e, o = st(0)) => ({ ty: 'tm', s, e, o, m: 1 });
const group = (nm, items, t) => ({ ty: 'gr', nm, it: [...items, t || tr()] });

function layer(nm, shapes, op, ks = {}) {
  return {
    ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
    ks: {
      o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([0, 0, 0]),
      a: st([0, 0, 0]), s: ks.s || st([100, 100, 100]),
    },
    shapes,
  };
}

function scene(n, nm, w, h, op, layers) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  const json = { v: '5.12.0', fr: FR, ip: 0, op, w, h, nm, ddd: 0, assets: [], slots: SLOTS, layers };
  fs.writeFileSync(path.join(dir, 'lottie.json'), JSON.stringify(json));
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS }, null, 2));
}

// 1 · running — seamless 120f loop: a Glacier arc orbits a quiet track, the core breathes.
{
  const op = 120;
  scene(1, 'ns-running · loop', 64, 64, op, [
    layer('arc', [group('arc', [ellipse(44), trim(st(0), st(28), anim([[0, 0, 'linear'], [op, 360]])), stroke('accent', 4)])], op, { p: st([32, 32, 0]) }),
    layer('core', [group('core', [ellipse(14), fill('accent')], tr({ s: anim([[0, [78, 78], 'travel'], [60, [100, 100], 'travel'], [op, [78, 78]]]) }))], op, { p: st([32, 32, 0]) }),
    layer('track', [group('track', [ellipse(44), stroke('muted', 4, st(35))])], op, { p: st([32, 32, 0]) }),
  ]);
}

// 2 · complete — one-shot 54f: disc lands with a small settle-back, check draws on.
{
  const op = 54;
  scene(2, 'ns-complete · once', 64, 64, op, [
    layer('check', [group('check', [pathShape([[-9, 0.5], [-3, 6.5], [9.5, -6]]), trim(st(0), anim([[10, 0, 'settle'], [32, 100]])), stroke('ground', 4.5)])], op, { p: st([32, 32, 0]) }),
    layer('disc', [group('disc', [ellipse(44), fill('ink')], tr({ s: anim([[0, [0, 0], 'enter'], [14, [108, 108], 'settle'], [24, [100, 100]]]) }))], op, { p: st([32, 32, 0]) }),
  ]);
}

// 3 · needs-fix — one-shot 48f: ring draws, mark rises, one restrained halo pulse. No shake.
{
  const op = 48;
  scene(3, 'ns-needs-fix · once', 64, 64, op, [
    layer('bar', [group('bar', [rect(4.5, 13, 2.25, [0, -6.5]), fill('accent')], tr({ p: st([0, 6.5]), s: anim([[10, [100, 0], 'enter'], [24, [100, 100]]]) }))], op, { p: st([32, 28.5, 0]) }),
    layer('dot', [group('dot', [ellipse(5, [0, 9.5]), fill('accent')])], op, { p: st([32, 32, 0]), o: anim([[18, 0, 'enter'], [26, 100]]) }),
    layer('ring', [group('ring', [ellipse(44), trim(st(0), anim([[0, 0, 'enter'], [18, 100]]), st(-90)), stroke('accent', 3.5)])], op, { p: st([32, 32, 0]) }),
    layer('halo', [group('halo', [ellipse(44), stroke('accent', 2)], tr({ s: anim([[22, [100, 100], 'settle'], [46, [134, 134]]]), o: anim([[22, 55, 'settle'], [46, 0]]) }))], op, { p: st([32, 32, 0]) }),
  ]);
}

// 4 · roster — seamless 96f loop: a 3×3 panel assembles along the diagonal, phase-offset.
{
  const op = 96;
  const dots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const ph = (r + c) * 8;
    const k = [[0, 25], [ph, 25], [ph + 18, 100], [ph + 48, 100], [ph + 66, 25], [op, 25]]
      .filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]).map(([t, v]) => [Math.min(t, op), v, 'travel']);
    dots.push(layer(`dot ${r}${c}`, [group('d', [ellipse(9), fill('ink')])], op,
      { p: st([14 + c * 18, 14 + r * 18, 0]), o: anim(k) }));
  }
  scene(4, 'ns-roster · loop', 64, 64, op, dots);
}

// 5 · saving — seamless 60f loop: three dots, one travelling highlight.
{
  const op = 60;
  const ls = [0, 1, 2].map(i => {
    const ph = i * 10;
    return layer(`dot ${i}`, [group('d', [ellipse(7), fill('ink')])], op, {
      p: st([16 + i * 16, 32, 0]),
      o: anim([[0, 30, 'travel'], [ph, 30, 'travel'], [ph + 15, 100, 'travel'], [ph + 30, 30, 'travel'], [op, 30]].filter((x, j, a) => j === 0 || x[0] > a[j - 1][0])),
    });
  });
  scene(5, 'ns-saving · loop', 64, 64, op, ls);
}

// 6 · awaiting responses — one-shot 120f empty state: horizon draws, the north star rises and turns once.
{
  const op = 120;
  const R = 13, r = 3.2;
  const star = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    star.push([+(Math.cos(a) * rad).toFixed(2), +(Math.sin(a) * rad).toFixed(2)]);
  }
  scene(6, 'ns-awaiting-responses · once', 160, 96, op, [
    layer('star', [group('star', [pathShape(star, true), fill('accent')], tr({
      s: anim([[30, [60, 60], 'settle'], [72, [100, 100]]]),
      r: anim([[72, 0, 'travel'], [118, 45]]),
    }))], op, {
      p: anim([[30, [80, 70, 0], 'settle'], [72, [80, 40, 0]]]),
      o: anim([[30, 0, 'enter'], [44, 100]]),
    }),
    layer('horizon', [group('h', [pathShape([[-60, 0], [60, 0]]), trim(st(0), anim([[0, 0, 'enter'], [40, 100]])), stroke('muted', 2)])], op, { p: st([80, 66, 0]) }),
  ]);
}

console.log('wrote', out);
