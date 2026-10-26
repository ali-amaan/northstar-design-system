/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar illustrations → <player>/public/projects/northstar-illustrations/scene-N/
// node build-lottie-illus.js <player-dir>
// Geometry is shared with canvas/project/Illustrations.dc.html: the same seeds and the
// same construction produce the artboard previews and these scenes.
const fs = require('fs');
const path = require('path');

if (!process.argv[2]) { console.error('usage: node build-lottie-illus.js <player-dir>'); process.exit(1); }
const out = path.join(process.argv[2], 'public', 'projects', 'northstar-illustrations');
fs.rmSync(out, { recursive: true, force: true });
const FR = 60;

// ---------- helpers (after build-lottie-hero.js)
const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const SLOTS = {
  bgColor: { p: { a: 0, k: rgba('#08090C') } },
  accent: { p: { a: 0, k: rgba('#93B4E0') } },
  ink: { p: { a: 0, k: rgba('#E8EAEE') } },
  muted: { p: { a: 0, k: rgba('#7D838F') } },
};
// controls.json lists only the slots a scene actually binds (all four slots stay in every file)
const CONTROLS = [
  { sid: 'bgColor', label: 'Background (Night)' },
  { sid: 'accent', label: 'Glacier (north star)' },
  { sid: 'ink', label: 'Ink (agents, horizon)' },
  { sid: 'muted', label: 'Hairlines' },
];
const E = { settle: [0, 0.65, 0.51, 0.99], enter: [0.2, 0.75, 0.34, 0.94], travel: [1, 0.49, 0, 0.55], exit: [1, 0.02, 0.54, 0.42], linear: [0, 0, 1, 1] };
const r2 = v => Math.round(v * 100) / 100;
const st = v => ({ a: 0, k: v });
function anim(keys) {
  keys = keys.map(k => [Math.round(k[0]), k[1], k[2]]).filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]);
  if (keys.length === 1) return st(keys[0][1]);
  return { a: 1, k: keys.map(([t, s, e], i) => {
    const k = { t, s: (Array.isArray(s) ? s : [s]).map(r2) };
    if (i < keys.length - 1) { const [x1, y1, x2, y2] = E[e || 'settle']; k.o = { x: [x1], y: [y1] }; k.i = { x: [x2], y: [y2] }; }
    return k;
  }) };
}
// y of a CSS-style cubic-bezier at progress u (bisection on x); used to bake eased envelopes as samples
const bez = ([x1, y1, x2, y2], u) => {
  const c = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0, hi = 1, t = u;
  for (let k = 0; k < 60; k++) { t = (lo + hi) / 2; if (c(t, x1, x2) < u) lo = t; else hi = t; }
  return c(t, y1, y2);
};
const tr = (o = {}) => ({ ty: 'tr', p: o.p || st([0, 0]), a: st([0, 0]), s: o.s || st([100, 100]), r: o.r || st(0), o: o.o || st(100), sk: st(0), sa: st(0) });
const poly = (v, c = true) => ({ ty: 'sh', d: 1, ks: st({ i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v: v.map(p => p.map(r2)), c }) });
const K = 0.5523;
// closed circle starting at 12 o'clock, clockwise, so trim paths draw from north
const circle = (r, cx = 0, cy = 0) => ({ ty: 'sh', d: 1, ks: st({
  v: [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]].map(p => p.map(r2)),
  i: [[-K * r, 0], [0, -K * r], [K * r, 0], [0, K * r]].map(p => p.map(r2)),
  o: [[K * r, 0], [0, K * r], [-K * r, 0], [0, -K * r]].map(p => p.map(r2)),
  c: true }) });
const rect = (w, h, x = 0, y = 0) => ({ ty: 'rc', p: st([x, y]), s: st([w, h]), r: st(0), d: 1 });
const stroke = (sid, w, o = 100) => ({ ty: 'st', c: { sid }, o: st(o), w: st(w), lc: 1, lj: 1, ml: 4 });
const dashed = (sid, w, o, dash, gap) => ({ ...stroke(sid, w, o), d: [{ n: 'd', nm: 'dash', v: st(dash) }, { n: 'g', nm: 'gap', v: st(gap) }] });
const fill = (sid, o = 100) => ({ ty: 'fl', c: { sid }, o: st(o), r: 1 });
const trim = (s, e) => ({ ty: 'tm', s, e, o: st(0), m: 1 });
const group = (items, t, nm = 'g') => ({ ty: 'gr', nm, it: [...items, t || tr()] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([0, 0, 0]), a: st([0, 0, 0]), s: ks.s || st([100, 100, 100]) },
  shapes,
});
const pol = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
const starPts = (R, r = R * 0.27, cx = 0, cy = 0) => Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(i % 2 ? r : R, i * 45); return [cx + x, cy + y]; });
const seg = (a, b) => poly([a, b], false);
const background = (op, W, H) => layer('background', [group([rect(W * 2, H * 2), fill('bgColor')])], op, { p: st([W / 2, H / 2, 0]) });
const report = [];
function scene(n, nm, op, W, H, layers) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  const json = { v: '5.12.0', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, assets: [], slots: SLOTS, layers };
  const s = JSON.stringify(json);
  const used = new Set([...s.matchAll(/"sid":"(\w+)"/g)].map(m => m[1]));
  fs.writeFileSync(path.join(dir, 'lottie.json'), s);
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS.filter(c => used.has(c.sid)) }, null, 2));
  report.push(`scene-${n} ${nm} · ${W}×${H} · ${op}f · ${(s.length / 1024).toFixed(1)} KB · ${layers.length} layers · controls ${[...used].join(', ')}`);
}

// ---------- 1 · ns-empty-brief — the horizon draws, the north star rises and settles above it (once)
{
  const op = 120, W = 240, H = 160, ls = [];
  // north star: opacity leads, scale follows, position carries the long settle
  ls.push(layer('north star', [group([poly(starPts(10)), fill('accent')])], op, {
    p: anim([[30, [120, 112, 0], 'settle'], [92, [120, 56, 0]]]),
    s: anim([[30, [30, 30, 100], 'settle'], [80, [100, 100, 100]]]),
    o: anim([[30, 0, 'enter'], [44, 100]]),
  }));
  ls.push(layer('north tick', [group([seg([120.5, 35], [120.5, 29]), trim(st(0), anim([[94, 0, 'enter'], [106, 100]])), stroke('ink', 1)])], op));
  // cardinal ticks sit on half pixels so the 1 px hairlines stay crisp (6 o'clock shares x 120.5 with the meridian)
  ls.push(layer('rim', [
    group([circle(20, 120, 56), trim(st(0), anim([[74, 0, 'enter'], [100, 100]])), stroke('muted', 1)]),
    group([seg([137, 56.5], [140, 56.5]), seg([120.5, 73], [120.5, 76]), seg([103, 56.5], [100, 56.5]), stroke('muted', 1)], tr({ o: anim([[90, 0, 'enter'], [102, 100]]) })),
  ], op));
  ls.push(layer('meridian', [group([seg([120.5, 112], [120.5, 77]), trim(st(0), anim([[34, 0, 'settle'], [84, 100]])), dashed('muted', 1, 100, 2, 3)])], op));
  const ticks = [];
  for (let x = 40; x <= 200; x += 16) {
    const d = Math.abs(x - 120) / 80;
    ticks.push(group([seg([x + 0.5, 113], [x + 0.5, x === 120 ? 120 : 117]), stroke('muted', 1)], tr({ o: anim([[14 + d * 16, 0, 'enter'], [26 + d * 16, 100]]) })));
  }
  ls.push(layer('graduations', ticks, op));
  ls.push(layer('horizon', [group([seg([40, 112.5], [200, 112.5]), trim(anim([[0, 50, 'enter'], [34, 0]]), anim([[0, 50, 'enter'], [34, 100]])), stroke('ink', 1)])], op));
  scene(1, 'ns-empty-brief · decision above the horizon · once', op, W, H, ls);
}

// ---------- shared onboarding marks (local units, origin on the horizon under the mark)
function markShapes(kind) {
  const g = [];
  if (kind === 0) {
    g.push(group([seg([0.5, -20], [0.5, -32]), dashed('muted', 1, 100, 2, 3)]));
    g.push(group([circle(11, 0, -44), stroke('muted', 1)]));
    g.push(group([seg([0.5, -57], [0.5, -62]), stroke('ink', 1)]));
    g.push(group([poly(starPts(6, 6 * 0.27, 0, -44)), fill('ink')]));
  } else if (kind === 1) {
    const stars = [];
    [[-22, 7], [-30, 6], [-38, 4], [-46, 2]].forEach(([y, c]) => { for (let j = 0; j < c; j++) stars.push(poly(starPts(1.8, 1.8 * 0.27, (j - (c - 1) / 2) * 8, y))); });
    g.push(group([...stars, fill('ink')]));
  } else if (kind === 2) {
    // spine and row ticks on half pixels (crisp 1 px)
    g.push(group([seg([-15.5, -20], [-15.5, -62]), stroke('ink', 1)]));
    const rows = [[-26, 30], [-36, 20], [-46, 34], [-56, 14]];
    g.push(group([...rows.map(([y]) => seg([-21, y + 0.5], [-16, y + 0.5])), stroke('muted', 1)]));
    g.push(group([...rows.map(([y, len]) => seg([-10, y + 0.5], [-10 + len, y + 0.5])), stroke('ink', 1.5)]));
  } else {
    const bands = [[-18, -34], [0, -46], [18, -38]], lines = [], nodes = [];
    bands.forEach(([x, c]) => {
      lines.push(seg([x, c - 7], [x, c + 7]), seg([x - 4, c - 7], [x + 4, c - 7]), seg([x - 4, c + 7], [x + 4, c + 7]));
      nodes.push(rect(4, 4, x, c));
    });
    g.push(group([...lines, stroke('ink', 1.5)]));
    g.push(group([...nodes, fill('ink')]));
  }
  return g;
}

// ---------- 2 · ns-onboarding — a north tick travels the horizon step to step; each mark lights in turn (loop)
// Mark states match the artboard: next 40 %, current 100 %, done 75 % with a filled node centre.
// Everything resets while the tick sinks into step 4's node; step 1 relights as it rises again (seam at 240 = 0).
// The tick is ink, like every north tick: Glacier is kept for the north star, measured nodes and primary actions.
{
  const op = 240, W = 640, H = 160, HZ = 112, xs = [80, 240, 400, 560], ls = [];
  ls.push(layer('north tick', [group([seg([0, -4], [0, -16]), stroke('ink', 2)], tr({
    s: anim([[0, [100, 100], 'linear'], [204, [100, 100], 'exit'], [216, [100, 0], 'linear'], [218, [100, 0], 'settle'], [240, [100, 100]]]),
  }))], op, {
    p: anim([[0, [xs[0], HZ, 0], 'travel'], [36, [xs[0], HZ, 0], 'travel'], [60, [xs[1], HZ, 0], 'travel'], [96, [xs[1], HZ, 0], 'travel'],
      [120, [xs[2], HZ, 0], 'travel'], [156, [xs[2], HZ, 0], 'travel'], [180, [xs[3], HZ, 0], 'linear'], [216, [xs[3], HZ, 0], 'linear'],
      [217, [xs[0], HZ, 0], 'linear'], [240, [xs[0], HZ, 0]]]),
  }));
  const lit = [
    [[0, 100], [36, 100, 'settle'], [52, 75], [216, 75, 'enter'], [234, 100], [240, 100]],
    [[0, 40], [48, 40, 'enter'], [64, 100], [96, 100, 'settle'], [112, 75], [204, 75, 'settle'], [222, 40], [240, 40]],
    [[0, 40], [108, 40, 'enter'], [124, 100], [156, 100, 'settle'], [172, 75], [204, 75, 'settle'], [222, 40], [240, 40]],
    [[0, 40], [168, 40, 'enter'], [184, 100], [204, 100, 'settle'], [222, 40], [240, 40]],
  ];
  const centre = [
    [[0, 100]],
    [[0, 0], [48, 0, 'enter'], [64, 100], [204, 100, 'settle'], [222, 0], [240, 0]],
    [[0, 0], [108, 0, 'enter'], [124, 100], [204, 100, 'settle'], [222, 0], [240, 0]],
    [[0, 0], [168, 0, 'enter'], [184, 100], [204, 100, 'settle'], [222, 0], [240, 0]],
  ];
  xs.forEach((x, k) => {
    // node: muted 7 × 7 outline with no fill (the horizon stops at its edges), ink 4 × 4 centre once reached
    ls.push(layer(`node ${k + 1}`, [
      group([rect(4, 4), fill('ink')], tr({ o: anim(centre[k]) })),
      group([rect(7, 7), stroke('muted', 1)]),
    ], op, { p: st([x, HZ, 0]) }));
    ls.push(layer(`mark ${k + 1}`, markShapes(k), op, { p: st([x, HZ, 0]), o: anim(lit[k]) }));
  });
  const hz = [[24, 76.5], [83.5, 236.5], [243.5, 396.5], [403.5, 556.5], [563.5, 616]];
  ls.push(layer('horizon', [group([...hz.map(([a, b]) => seg([a, HZ + 0.5], [b, HZ + 0.5])), stroke('muted', 1)])], op));
  scene(2, 'ns-onboarding · Brief → Population → Research → Responses · loop', op, W, H, ls);
}

// ---------- shared seeded constellation (identical to the artboard)
const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; };
const side = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
const crosses = (a, b, c, d) => side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
const tangled = o => { for (let i = 0; i < o.length - 3; i++) for (let j = i + 2; j < o.length - 1; j++) if (crosses(o[i], o[i + 1], o[j], o[j + 1])) return true; return false; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
// smallest gap between any thread and any star it does not join, beyond that star's 28 px radius (R × 1.15) + 1.5
const clearance = (o, R) => { let m = Infinity; for (let i = 0; i < o.length - 1; i++) o.forEach((p, k) => { if (k !== i && k !== i + 1) m = Math.min(m, segDist(p, o[i], o[i + 1]) - (R[k] * 1.15 + 1.5)); }); return m; };
const threadLen = o => o.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - o[i][0], p[1] - o[i][1]), 0);
function constellation(name) {
  let sd = fnv(name);
  const rn = () => ((sd = (sd * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const n = 4 + Math.floor(rn() * 3), pts = [];
  for (let k = 0; k < 400 && pts.length < n; k++) {
    const [x, y] = pol(3 + rn() * 11.5, rn() * 360), p = [20 + x, 20 + y];
    if (p[1] < 9 && Math.abs(p[0] - 20) < 4) continue;
    if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) >= 7)) pts.push(p);
  }
  // radii belong to thread positions: the first (northmost) star is the brightest
  const R = pts.map((_, i) => i ? 1.7 + rn() * 1.1 : 3.4);
  pts.sort((a, b) => a[1] - b[1]);
  let order = [pts.shift()];
  while (pts.length) { const l = order[order.length - 1]; let bi = 0, bd = 1e9; pts.forEach((q, j) => { const d = Math.hypot(q[0] - l[0], q[1] - l[1]); if (d < bd) { bd = d; bi = j; } }); order.push(pts.splice(bi, 1)[0]); }
  // 2-opt: untangle any crossing threads (the northmost star stays first)
  for (let pass = 0, changed = true; changed && pass < 8; pass++) { changed = false; for (let i = 0; i < order.length - 3; i++) for (let j = i + 2; j < order.length - 1; j++) if (crosses(order[i], order[i + 1], order[j], order[j + 1])) { order.splice(i + 1, j - i, ...order.slice(i + 1, j + 1).reverse()); changed = true; } }
  // clearance: no thread may pass through a star it does not join; otherwise take the shortest clear, untangled ordering
  let rethreaded = false;
  if (tangled(order) || clearance(order, R) < 0) {
    const perms = [], permute = (a, acc) => { if (!a.length) perms.push(acc); a.forEach((q, j) => permute([...a.slice(0, j), ...a.slice(j + 1)], [...acc, q])); };
    permute(order.slice(1), [order[0]]);
    const ok = perms.filter(o => !tangled(o) && clearance(o, R) >= 0).sort((a, b) => threadLen(a) - threadLen(b));
    order = ok.length ? ok[0] : perms.sort((a, b) => clearance(b, R) - clearance(a, R))[0];
    rethreaded = true;
  }
  return { pts: order, R, rethreaded, clear: clearance(order, R), tangled: tangled(order) };
}
// self-check: every seeded mark on the artboard threads clear of the stars it does not join
const selfCheck = ['owner-1', 'owner-2', 'owner-3', 'owner-4', 'owner-5', 'workspace-1'].map(nm => {
  const c = constellation(nm);
  if (c.tangled || !(c.clear >= 0)) { console.error(`constellation ${nm} fails: clearance ${c.clear.toFixed(2)}, tangled ${c.tangled}`); process.exit(1); }
  return `${nm}: ${c.pts.length} stars, clearance +${c.clear.toFixed(2)}${c.rethreaded ? ' (re-threaded)' : ''}`;
});

// ---------- 3 · ns-avatar — a seeded constellation (owner-1) draws point by point, threaded by hairlines (once)
// The owner-1 40 px avatar at 1.6×: same rim colour (muted at 30 %), thread 45 %; the north tick snaps to x 32.5.
{
  const op = 90, W = 64, H = 64, S = 64 / 40, c = constellation('owner-1'), ls = [];
  const P = c.pts.map(([x, y]) => [x * S, y * S]), T = P.map((_, i) => 18 + i * 9);
  P.forEach(([x, y], i) => {
    ls.push(layer(`star ${i + 1}`, [group([poly(starPts(c.R[i] * S)), fill('ink')])], op, {
      p: st([r2(x), r2(y), 0]),
      s: anim([[T[i], [0, 0, 100], 'settle'], [T[i] + 16, [100, 100, 100]]]),
      o: anim([[T[i], 0, 'enter'], [T[i] + 5, 100]]),
    }));
  });
  const threads = [];
  for (let i = 1; i < P.length; i++) threads.push(group([seg(P[i - 1], P[i]), trim(st(0), anim([[T[i - 1] + 4, 0, 'enter'], [T[i] + 2, 100]])), stroke('ink', 1, 45)]));
  ls.push(layer('thread', threads, op));
  ls.push(layer('north tick', [group([seg([32.5, 1.6], [32.5, 6.4]), stroke('muted', 1)], tr({ o: anim([[16, 0, 'enter'], [26, 100]]) }))], op));
  ls.push(layer('rim', [group([circle(31.2, 32, 32), trim(st(0), anim([[0, 0, 'enter'], [30, 100]])), stroke('muted', 1, 30)])], op));
  scene(3, 'ns-avatar · owner-1 constellation · once', op, W, H, ls);
}

// ---------- 4 · ns-signin — the field turns about a fixed north star; each agent fades in, drifts 2.4° and fades out on its own phase (loop)
{
  const op = 240, W = 960, H = 540, P = [676, 128], HZ = 432, DR = -2.4, ls = [];
  let seed = 20261025;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const rotY = (x, y) => { const a = DR * Math.PI / 180; return P[1] + (x - P[0]) * Math.sin(a) + (y - P[1]) * Math.cos(a); };
  // one smooth density and brightness ramp under the sign-in form (no seam): 0.35 at x 200 → 1 at x 560
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const ramp = x => 0.35 + 0.65 * sstep(200, 560, x);
  const field = [];
  for (let k = 0; k < 20000 && field.length < 260; k++) {
    const x = -16 + rnd() * 992, y = 12 + rnd() * 412, m = rnd(), keep = rnd(), ph = rnd();
    if (Math.hypot(x - P[0], y - P[1]) < 56) continue;
    if (keep > ramp(x)) continue;
    if (Math.max(y, rotY(x, y)) > HZ - 10) continue;
    if (field.some(s => (s.x - x) ** 2 + (s.y - y) ** 2 < 100)) continue;
    // phases on a 5-frame lattice (47 cohorts, scattered across the field) so agents sharing a phase share one layer
    field.push({ x, y, R: 0.9 + 2.5 * m ** 3, o: Math.round((0.3 + 0.62 * m ** 0.8) * ramp(x) * 100), tau: 5 + 5 * Math.floor(ph * 47) });
  }
  // life envelope (local frames): 'enter' fade-in 0–58, hold, 'exit' fade-out 182–240, baked as samples every 8–10 frames
  // with linear interpolation between them; the artboard's CSS @keyframes carry the same samples
  const LIFE = [
    ...[0, 8, 16, 24, 32, 40, 48, 58].map(l => [l, bez(E.enter, l / 58)]),
    ...[182, 192, 200, 208, 216, 224, 232, 240].map(l => [l, 1 - bez(E.exit, (l - 182) / 58)]),
  ].map(([l, v]) => [l, Math.round(v * 1000) / 1000]);
  const env = l => { for (let j = 1; j < LIFE.length; j++) if (l <= LIFE[j][0]) { const [a, va] = LIFE[j - 1], [b, vb] = LIFE[j]; return va + (vb - va) * (l - a) / (b - a); } return 0; };
  ls.push(layer('north star', [group([poly(starPts(13)), fill('accent')])], op, { p: st([P[0], P[1], 0]) }));
  ls.push(layer('north tick', [group([seg([P[0] + 0.5, 90], [P[0] + 0.5, 78]), stroke('ink', 1.5)])], op));
  const minor = [], card = [];
  for (let a = 0; a < 360; a += 15) {
    const [x0, y0] = pol(30, a);
    if (a % 90) { const [x1, y1] = pol(33, a); minor.push(seg([x0, y0], [x1, y1])); }
    else if (a) {
      // cardinal ticks on half pixels: 6 o'clock shifts in x, 3 and 9 o'clock in y
      const [x1, y1] = pol(36, a), dx = a === 180 ? 0.5 : 0, dy = a === 180 ? 0 : 0.5;
      card.push(seg([x0 + dx, y0 + dy], [x1 + dx, y1 + dy]));
    }
  }
  ls.push(layer('rim', [
    group([circle(30), stroke('muted', 1, 60)]),
    group([...minor, stroke('muted', 1, 45)]),
    group([...card, stroke('muted', 1, 45)]),
  ], op, { p: st([P[0], P[1], 0]) }));
  const phases = [...new Set(field.map(s => s.tau))].sort((a, b) => a - b);
  phases.forEach(tau => {
    const u0 = (240 - tau) / 240, v0 = env(240 - tau) * 100;
    const ok = [[0, v0], [240, v0]];
    LIFE.forEach(([l, v]) => { let t = tau + l; if (t >= 240) t -= 240; ok.push([t, v * 100]); });
    ok.sort((a, b) => a[0] - b[0]);
    const okD = ok.filter((x, j, a) => j === 0 || x[0] > a[j - 1][0]).map(([t, v]) => [t, v, 'linear']);
    // rotation is continuous linear drift; it wraps at the phase start, where the agent is at zero opacity
    const rk = [[0, DR * u0, 'linear'], [tau, DR, 'linear'], [tau + 1, DR / 240, 'linear'], [240, DR * u0]];
    const members = field.map((s, i) => [s, i]).filter(([s]) => s.tau === tau);
    ls.push(layer(`agents · phase ${tau}`, members.map(([s, i]) => group([poly(starPts(s.R, s.R * 0.27, s.x - P[0], s.y - P[1])), fill('ink', s.o)], null, `agent ${i + 1}`)), op, {
      p: st([P[0], P[1], 0]), r: anim(rk), o: anim(okD),
    }));
  });
  // graticule: the 170 circle and the visible span of the 340 arc (clockwise from -41.2° to 150.5°)
  const arcPts = [];
  for (let a = -41.2; a <= 150.5 + 1e-6; a += (150.5 + 41.2) / 64) { const [x, y] = pol(340, a); arcPts.push([x, y]); }
  ls.push(layer('graticule', [group([circle(170), stroke('muted', 1, 14)]), group([poly(arcPts, false), stroke('muted', 1, 14)])], op, { p: st([P[0], P[1], 0]) }));
  ls.push(layer('meridian', [group([seg([P[0] + 0.5, 172], [P[0] + 0.5, HZ]), stroke('muted', 1, 35)])], op));
  const hzt = [];
  for (let x = 0; x <= 960; x += 48) hzt.push(seg([x + 0.5, 433], [x + 0.5, 437]));
  ls.push(layer('horizon', [group([seg([0, HZ + 0.5], [960, HZ + 0.5]), stroke('muted', 1, 60)]), group([...hzt, stroke('muted', 1, 30)])], op));
  ls.push(background(op, W, H));
  scene(4, 'ns-signin · field turning about north · loop', op, W, H, ls);
  report.push(`scene-4 field: ${field.length} agents in ${phases.length} phase layers`);
  report.push(`scene-4 life samples (CSS drift stops): ${LIFE.map(([l, v]) => `${l}:${v}`).join(' ')}`);
}

console.log(report.concat(selfCheck).join('\n'));
