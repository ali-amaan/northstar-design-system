/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar geo — Finland in stars → <player>/public/projects/northstar-geo/scene-N/
// node build-lottie-geo.js <player-dir>
// Scenes: 1 ns-finland (once), 2 ns-persona (once), 3 ns-finland-pulse (loop). 960 × 540, 60 fps, 240 f.
// The geo core below is copied verbatim into canvas/project/Geo.dc.html — keep the two in step.
const fs = require('fs');
const path = require('path');

const out = path.join(process.argv[2], 'public', 'projects', 'northstar-geo');
fs.rmSync(out, { recursive: true, force: true });
const FR = 60, W = 960, H = 540;

// ---------- helpers (style of build-lottie-hero.js) ----------
const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const SLOTS = {
  bgColor: { p: { a: 0, k: rgba('#08090C') } },
  accent: { p: { a: 0, k: rgba('#93B4E0') } },
  ink: { p: { a: 0, k: rgba('#E8EAEE') } },
  muted: { p: { a: 0, k: rgba('#7D838F') } },
};
const CONTROLS = [
  { sid: 'bgColor', label: 'Background (Night)' },
  { sid: 'accent', label: 'Glacier (north star)' },
  { sid: 'ink', label: 'Ink (agents)' },
  { sid: 'muted', label: 'Hairlines' },
];
// settle / enter / travel / exit are the motion-taste anchors; rise is settle-soft with a gentle lift-off
const E = { settle: [0, 0.65, 0.51, 0.99], enter: [0.2, 0.75, 0.34, 0.94], travel: [1, 0.49, 0, 0.55], exit: [1, 0.02, 0.54, 0.42], rise: [0.45, 0, 0.12, 1], linear: [0, 0, 1, 1] };
const r2 = v => Math.round(v * 100) / 100;
const st = v => ({ a: 0, k: v });
function anim(keys) {
  keys = keys.filter((x, i, a) => i === 0 || Math.round(x[0]) > Math.round(a[i - 1][0]));
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
function scene(n, nm, op, layers) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  const json = { v: '5.12.0', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, assets: [], slots: SLOTS, layers };
  fs.writeFileSync(path.join(dir, 'lottie.json'), JSON.stringify(json));
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS }, null, 2));
  console.log(`scene-${n}`, nm, (JSON.stringify(json).length / 1024).toFixed(0) + ' KB', layers.length + ' layers');
}
// cubic-bezier easing value at progress x (for baked, sampled motion)
function ease(name, x) {
  const [x1, y1, x2, y2] = E[name];
  const bx = t => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = t => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; }
  return by((lo + hi) / 2);
}

// ---------- geo core (identical in Geo.dc.html) ----------
// Finland, hand-authored lon/lat, clockwise from the Treriksröset tripoint along the Norway border.
const FI = [[20.55,69.06],[20.95,69.2],[21.27,69.31],[21.65,69.26],[22,69.1],[22.4,68.9],[22.85,68.76],[23.35,68.7],[23.9,68.64],[24.5,68.62],[24.92,68.58],[25.2,68.8],[25.5,68.98],[25.75,69.18],[25.85,69.4],[26.3,69.62],[26.7,69.8],[27.03,69.91],[27.5,70.03],[27.95,70.09],[28.4,69.93],[28.85,69.8],[29.15,69.68],[29.22,69.45],[29.05,69.22],[28.93,69.05],[28.55,68.88],[28.42,68.55],[28.75,68.25],[29.32,68.07],[29.75,67.8],[29.6,67.45],[29.1,67.05],[29.05,66.8],[29.6,66.25],[29.85,65.95],[29.75,65.6],[29.65,65.25],[29.85,64.9],[30.05,64.55],[30.5,64.25],[30.55,63.95],[31.25,63.35],[31.58,62.91],[31.25,62.62],[30.95,62.38],[30.65,62.16],[30.15,61.88],[29.75,61.58],[29.25,61.33],[28.85,61.17],[28.55,60.95],[28.15,60.75],[27.85,60.57],[27.78,60.52],[27.4,60.5],[27.05,60.44],[26.6,60.4],[26.2,60.38],[25.7,60.24],[25.25,60.18],[24.95,60.12],[24.6,60.06],[24.38,59.98],[24,60.02],[23.5,59.94],[22.95,59.81],[22.62,59.97],[22.42,60.1],[22.1,60.22],[21.75,60.38],[21.45,60.58],[21.33,60.8],[21.43,61.05],[21.45,61.3],[21.45,61.6],[21.55,61.85],[21.3,62.1],[21.15,62.4],[21.25,62.7],[21.35,62.98],[21.55,63.12],[21.85,63.28],[22.25,63.42],[22.65,63.66],[23.1,63.86],[23.55,64.05],[24,64.28],[24.35,64.55],[24.55,64.72],[24.95,64.8],[25.4,64.86],[25.45,65.02],[25.33,65.2],[25.37,65.35],[25.2,65.58],[25,65.66],[24.55,65.73],[24.15,65.85],[23.7,66.35],[23.95,66.8],[23.75,67.35],[23.55,67.95],[23.15,68.18],[22.5,68.44],[21.9,68.62],[21.4,68.82],[20.95,68.98]];
// Åland main island outline, and the Åland cluster (fixed stars: four on the main island, five islets)
const AL = [[19.52,60.18],[19.62,60.33],[19.85,60.42],[20.1,60.37],[20.28,60.25],[20.25,60.1],[20.05,60.02],[19.93,60.05],[19.75,60.1]];
const ALS = [[19.68,60.2],[19.97,60.13],[19.9,60.33],[20.15,60.24],[20.42,60.05],[20.62,60.17],[20.85,60.3],[21.02,60.42],[20.88,59.95]];
// a profile bust facing west (toward the map it came from), local units; P is the persona star (every fact-card leader starts there),
// CH the outline chain that the neighbours trace as hairline vertices
const BUST = { P: [104, 72], CH: [[20,222],[60,180],[88,142],[68,118],[48,86],[64,64],[72,40],[108,16],[146,50],[132,120],[176,166],[204,222]] };
const PERSONA_AT = [25.9, 62.7]; // where the lifted agent is drawn from (lon, lat) — illustrative
const C64 = Math.cos(64 * Math.PI / 180);
const lcg = s => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const proj = (k, cx, cy) => ([lo, la]) => [cx + (lo - 26) * C64 * k, cy - (la - 65) * k];
const inPoly = ([x, y], pg) => { let c = false; for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const [xi, yi] = pg[i], [xj, yj] = pg[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const segD = ([px, py], [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const edgeD = (p, pg) => { let m = 1e9; for (let i = 0; i < pg.length; i++) m = Math.min(m, segD(p, pg[i], pg[(i + 1) % pg.length])); return m; };
// staggered lattice inside a projected polygon: rows offset by half a pitch, seeded jitter, keep-out from the hairline
function lattice(pg, pitch, jit = 0.18, keep = 0.35, seed = 20261025) {
  const rnd = lcg(seed), h = pitch * Math.sqrt(3) / 2, acc = [], rej = [];
  const xs = pg.map(p => p[0]), ys = pg.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let j = 0, y = y0 + h / 2; y < y1; j++, y += h) for (let x = x0 + (j % 2 ? pitch * 3 / 4 : pitch / 4); x < x1; x += pitch) {
    const jx = (rnd() * 2 - 1) * jit * pitch, jy = (rnd() * 2 - 1) * jit * pitch, s = rnd(), p = [x + jx, y + jy];
    const pt = { x: p[0], y: p[1], gx: x, gy: y, row: j, s };
    if (!inPoly(p, pg)) rej.push({ ...pt, why: 'out' });
    else if (edgeD(p, pg) < keep * pitch) rej.push({ ...pt, why: 'edge' });
    else acc.push(pt);
  }
  // second pass: narrow features (the arm, headlands) — an edge point with at most one star within 1.5 pitch is kept,
  // at its jittered place if that clears 0.2 p of the hairline, else back on its lattice node if that does
  rej.forEach(p => {
    if (p.why !== 'edge') return;
    const g = [p.gx, p.gy], q = edgeD([p.x, p.y], pg) >= 0.2 * pitch ? [p.x, p.y] : inPoly(g, pg) && edgeD(g, pg) >= 0.2 * pitch ? g : null;
    if (q && acc.filter(a => Math.hypot(a.x - q[0], a.y - q[1]) < 1.5 * pitch).length <= 1) { p.x = q[0]; p.y = q[1]; p.why = 'fill'; acc.push(p); }
  });
  return { acc, rej: rej.filter(p => p.why !== 'fill'), rowH: h, y0 };
}
// everything a Finland star-map needs at scale k, with 26°E at x = cx and 65°N at y = cy; q = pitch in degrees of latitude
function finland(k, cx, cy, q) {
  const P = proj(k, cx, cy), pg = FI.map(P), al = AL.map(P);
  const L = lattice(pg, q * k);
  const als = ALS.map((ll, i) => { const [x, y] = P(ll); return { x, y, row: -1, s: ((i * 7) % 9) / 9, aland: true }; });
  return { P, pg, al, stars: L.acc.concat(als), lat: L, k, cx, cy };
}
// unproject (for labels)
const unproj = (k, cx, cy) => ([x, y]) => [26 + (x - cx) / (C64 * k), 65 - (y - cy) / k];
// the lifted cluster: the star nearest PERSONA_AT and its n nearest neighbours, persona first
function cluster(stars, P, n = 12) {
  const [px, py] = P(PERSONA_AT), main = stars.filter(s => !s.aland);
  const p0 = main.reduce((b, s) => Math.hypot(s.x - px, s.y - py) < Math.hypot(b.x - px, b.y - py) ? s : b, main[0]);
  const near = main.filter(s => s !== p0).sort((a, b) => Math.hypot(a.x - p0.x, a.y - p0.y) - Math.hypot(b.x - p0.x, b.y - p0.y)).slice(0, n);
  return [p0, ...near];
}
// match neighbours to bust chain points by bearing (both clockwise from north); persona → P
function assign(cl, bustPts, bustP) {
  const bear = (x, y, ox, oy) => (Math.atan2(x - ox, -(y - oy)) * 180 / Math.PI + 360) % 360;
  const [p0, ...nb] = cl;
  const bc = bustPts.reduce((a, p) => [a[0] + p[0] / bustPts.length, a[1] + p[1] / bustPts.length], [0, 0]);
  const so = nb.map(s => ({ s, b: bear(s.x, s.y, p0.x, p0.y) })).sort((a, b) => a.b - b.b);
  const to = bustPts.map((p, i) => ({ i, b: bear(p[0], p[1], bc[0], bc[1]) })).sort((a, b) => a.b - b.b);
  const pairs = [{ s: p0, to: bustP, i: -1 }];
  so.forEach((o, j) => pairs.push({ s: o.s, to: bustPts[to[j].i], i: to[j].i }));
  return pairs;
}
// rotate a closed ring so that vertex `peak` sits at exactly half the perimeter (two-way trim from it)
function ringFrom(pg, peak) {
  const n = pg.length, seg = i => Math.hypot(pg[(i + 1) % n][0] - pg[i][0], pg[(i + 1) % n][1] - pg[i][1]);
  let per = 0; for (let i = 0; i < n; i++) per += seg(i);
  let target = per / 2, i = peak;                       // walk backwards half a perimeter from the peak
  while (target > seg((i - 1 + n) % n)) { i = (i - 1 + n) % n; target -= seg(i); }
  const a = pg[(i - 1 + n) % n], b = pg[i], t = 1 - target / seg((i - 1 + n) % n);
  const start = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const ring = [start]; for (let k = 0; k < n; k++) ring.push(pg[(i + k) % n]);
  return ring;
}
// adult population by the official municipality grouping, capital region folded into urban
// source: Statistics Finland, StatFin Population structure, table 11re (population 31 Dec 2025, ages 18+), official municipality grouping 2026;
//         summed from backend/data/marginals/vaesto_ika_sukupuoli_kuntatyyppi.csv (fetched 2026-07-16)
const MUNI = [['Urban', 3388127], ['Semi-urban', 711390], ['Rural', 549328]];
// regional centres (lon, lat, weight): where the illustration places each type. Illustrative placement, not a measured density.
const CEN = [[24.94,60.17,1],[23.76,61.5,.62],[22.27,60.45,.55],[25.47,65.01,.5],[25.75,62.24,.45],[27.68,62.89,.4],[25.66,60.98,.4],[21.8,61.48,.34],[29.76,62.6,.3],[28.19,61.06,.3],[21.62,63.1,.3],[22.84,62.79,.28],[25.73,66.5,.3],[26.94,60.47,.26],[24.46,61,.26],[27.27,61.69,.22],[23.13,63.84,.22],[27.73,64.23,.2],[19.94,60.1,.12]];
const COMP = { N: 320, A: 2.1, S: 1.5 };  // stars on the composition card; urban radius factor; semi-urban ring as a multiple of it
// composition: N stars split by the MUNI shares (largest remainder); each type is spread evenly (farthest point) over its own pool:
// urban within ru of a centre, semi-urban within S·ru, rural beyond
function composition(stars, P, N, A, S) {
  const tot = MUNI.reduce((a, q) => a + q[1], 0), share = MUNI.map(q => q[1] / tot);
  const cen = CEN.map(([lo, la, w]) => ({ c: P([lo, la]), ru: A * (0.06 + 0.2 * w) }));
  const cls = s => { let best = 2; cen.forEach(e => { const d = Math.hypot(s.x - e.c[0], s.y - e.c[1]); if (d < e.ru) best = 0; else if (d < S * e.ru && best > 1) best = 1; }); return best; };
  const pools = [[], [], []]; stars.forEach(s => pools[cls(s)].push(s));
  const raw = share.map(q => N * q), want = raw.map(Math.floor);
  raw.map((r, i) => ({ i, f: r - want[i] })).sort((a, b) => b.f - a.f).slice(0, N - want.reduce((a, b) => a + b, 0)).forEach(o => want[o.i]++);
  const spread = (pool, n) => {
    const md = pool.map(() => Infinity), out = [];
    for (let cur = 0; out.length < Math.min(n, pool.length) && cur >= 0;) {
      out.push(pool[cur]); md[cur] = -1;
      let bi = -1, bd = -1;
      pool.forEach((s, i) => { if (md[i] < 0) return; md[i] = Math.min(md[i], Math.hypot(s.x - pool[cur].x, s.y - pool[cur].y)); if (md[i] > bd) { bd = md[i]; bi = i; } });
      cur = bi;
    }
    return out;
  };
  const drawn = pools.map((pool, i) => spread(pool, want[i]));
  const n = drawn.reduce((a, d) => a + d.length, 0);
  return { share, want, pools: pools.map(q => q.length), drawn, n, drawnShare: drawn.map(d => d.length / n) };
}
// ---------- end geo core ----------

const iTop = FI.reduce((b, p, i) => p[1] > FI[b][1] ? i : b, 0);  // Nuorgam, the northern tip
const K = 40, CX = 480, CY = 70 + (70.09 - 65) * K, Q = 0.3, HOR = 500;
const M = finland(K, CX, CY, Q);
const starR = s => (2.3 + s.s * 0.6) * (s.aland ? 0.8 : 1);  // Åland is drawn as its cluster only at this scale (no outline)
const yTop = Math.min(...M.pg.map(p => p[1])), yBot = Math.max(...M.pg.map(p => p[1]));
const outlineRing = ringFrom(M.pg, iTop);
const gratY = [60, 65, 70].map(la => CY - (la - 65) * K);
const GX0 = 318, GX1 = 642;
const graticule = (t0, op) => {
  const g = gratY.map((y, i) => group([poly([[GX0, y], [GX1, y]], false), trim(st(0), t0 == null ? st(100) : anim([[t0 + i * 6, 0, 'enter'], [t0 + 40 + i * 6, 100]])), stroke('muted', 1, 32)]));
  let ticks = [];
  for (let la = 60; la <= 70; la++) { const y = CY - (la - 65) * K, w = la % 5 ? 4 : 8; ticks.push(group([poly([[GX0 - w, y], [GX0, y]], false), stroke('muted', 1, la % 5 ? 45 : 80)])); }
  return [layer('graticule', g, op), layer('lat ticks', ticks, op, t0 == null ? {} : { o: anim([[t0 + 10, 0, 'enter'], [t0 + 40, 100]]) })];
};
const NORTH_Y = 34, MER = [[CX, NORTH_Y + 14], [CX, 86]];

// 1 · ns-finland — stars rise from the horizon and settle into Finland; the outline traces from the northern tip; north lands.
{
  const op = 240, ls = [];
  const rnd = lcg(7);
  ls.push(layer('north', [group([poly(starPts(11)), fill('accent')], tr({
    s: anim([[178, [0, 0], 'enter'], [194, [112, 112], 'settle'], [212, [100, 100]]]),
    r: anim([[178, -45, 'settle'], [212, 0]]),
  }))], op, { p: st([CX, NORTH_Y, 0]) }));
  ls.push(layer('meridian', [group([poly(MER, false), trim(st(0), anim([[168, 0, 'enter'], [192, 100]])), stroke('muted', 1, 55)])], op));
  ls.push(layer('outline', [
    group([poly(outlineRing), trim(anim([[118, 50, 'enter'], [176, 0]]), anim([[118, 50, 'enter'], [176, 100]])), stroke('muted', 1, 100)]),
  ], op));
  M.stars.forEach((s, i) => {
    const v = (HOR - s.y) / (HOR - yTop), t0 = 22 + rnd() * 10, t1 = t0 + 58 + 66 * v;
    ls.push(layer(`a${i}`, [group([poly(starPts(starR(s))), fill('ink')])], op, {
      p: anim([[t0, [s.x, HOR, 0], 'rise'], [t1, [s.x, s.y, 0]]]),
      o: anim([[t0, 0, 'enter'], [t0 + 12, 100]]),
    }));
  });
  ls.push(...graticule(8, op));
  ls.push(layer('horizon', [group([poly([[-300, 0], [300, 0]], false), trim(anim([[0, 50, 'enter'], [30, 0]]), anim([[0, 50, 'enter'], [30, 100]])), stroke('ink', 1.5)])], op, { p: st([CX, HOR, 0]) }));
  ls.push(background(op));
  scene(1, 'ns-finland · Finland in stars · once', op, ls);
}

// 2 · ns-persona — from the settled map one agent lifts with its neighbours and assembles a bust; hairlines join it, fact-card leaders draw.
{
  const op = 240, ls = [], DX = -164, BS = 1.18, BX = 516, BY = HOR - 222 * BS;
  const B = ([x, y]) => [BX + x * BS, BY + y * BS];
  const chain = BUST.CH.map(B), bp = B(BUST.P);
  const cl = cluster(M.stars, M.P, BUST.CH.length);
  const pairs = assign(cl, chain, bp);
  const inCl = new Set(cl);
  // the map, as one body, drifts west to make room
  const DRIFT = 40, drift = anim([[0, [0, 0, 0], 'travel'], [DRIFT, [DX, 0, 0]]]);
  const rest = M.stars.filter(s => !inCl.has(s));
  const mapShapes = [
    group([poly(starPts(11, undefined, CX, NORTH_Y)), fill('accent')]),
    group([poly(MER, false), stroke('muted', 1, 55)]),
    group([poly(M.pg), stroke('muted', 1, 100)]),
    group([...rest.map(s => poly(starPts(starR(s), undefined, s.x, s.y))), fill('ink')]),
    ...gratY.map(y => group([poly([[GX0, y], [GX1, y]], false), stroke('muted', 1, 32)])),
  ];
  for (let la = 60; la <= 70; la++) { const y = CY - (la - 65) * K, w = la % 5 ? 4 : 8; mapShapes.push(group([poly([[GX0 - w, y], [GX0, y]], false), stroke('muted', 1, la % 5 ? 45 : 80)])); }
  // fact-card leaders, all from the persona: a trunk to the spine at x 780, the spine both ways, a branch to each label row,
  // then the label-slot bars (lines only, no text). Every attribute hangs off the one persona, none off a neighbour.
  const rows = [257, 316, 375, 434], JX = 780, py = bp[1];
  const line = (pts, t0, t1, w = 1, o = 100) => group([poly(pts, false), trim(st(0), anim([[t0, 0, 'enter'], [t1, 100]])), stroke('muted', w, o)]);
  ls.push(layer('leaders', [
    line([[bp[0] + 8, py], [JX, py]], 164, 182),
    line([[JX, py], [JX, rows[0]]], 180, 192),
    line([[JX, py], [JX, rows[3]]], 180, 196),
    ...rows.map((yl, j) => line([[JX, yl], [800, yl]], 192 + j * 3, 202 + j * 3)),
    ...rows.map((yl, j) => line([[806, yl], [866, yl]], 198 + j * 3, 212 + j * 3, 2, 70)),
    ...rows.map((yl, j) => line([[806, yl + 8], [840, yl + 8]], 202 + j * 3, 214 + j * 3, 1, 45)),
  ], op));
  // constellation hairlines along the profile chain
  ls.push(layer('constellation', [group([poly(chain, false), trim(st(0), anim([[142, 0, 'enter'], [178, 100]])), stroke('muted', 1, 100)])], op));
  // the cluster: lift, fly on a sampled arc (keys every 6 f, linear between), land
  const order = pairs.map((p, j) => ({ ...p, j }));
  order.forEach(({ s, to, j }) => {
    const x0 = s.x + DX, y0 = s.y, lift = 12, tl = 66 + Math.round(j * 1.2), tf0 = tl + 18, dur = 48;
    const A = [x0, y0 - lift], Cc = [(A[0] + to[0]) / 2, Math.min(A[1], to[1]) - 70 - j * 3];
    const keys = [[0, [s.x, s.y, 0], 'travel'], [DRIFT, [x0, y0, 0], 'linear'], [tl, [x0, y0, 0], 'enter'], [tl + 16, [A[0], A[1], 0], 'linear']];
    for (let f = 0; f <= dur; f += 6) {
      const u = ease('travel', f / dur), a = 1 - u;
      keys.push([tf0 + f, [a * a * A[0] + 2 * a * u * Cc[0] + u * u * to[0], a * a * A[1] + 2 * a * u * Cc[1] + u * u * to[1], 0], 'linear']);
    }
    const tLand = tf0 + dur;
    // the persona grows to 200 %; each neighbour lands as a hollow hairline vertex of the bust (a ring knocking out the chain),
    // so the persona is the only star, the only person, in the figure
    ls.unshift(j === 0
      ? layer('persona', [group([poly(starPts(starR(s))), fill('ink')])], op, { p: anim(keys), s: anim([[tf0, [100, 100, 100], 'settle'], [tLand, [200, 200, 100]]]) })
      : layer(`n${j}`, [
        group([ellipse(5), stroke('muted', 1, 100), fill('bgColor')], tr({ o: anim([[tLand - 2, 0, 'enter'], [tLand + 12, 100]]) })),
        group([poly(starPts(starR(s))), fill('ink')], tr({ o: anim([[tLand - 4, 100, 'exit'], [tLand + 8, 0]]) })),
      ], op, { p: anim(keys) }));
  });
  // reticle on the chosen agent, then sockets where the cluster was
  const p0 = cl[0];
  ls.push(layer('reticle', [group([ellipse(20), stroke('muted', 1, 100)]), group([poly([[0, -10], [0, -16]], false), stroke('muted', 1, 100)])], op, {
    p: st([p0.x + DX, p0.y, 0]),
    s: anim([[42, [140, 140, 100], 'settle'], [62, [100, 100, 100]]]),
    o: anim([[42, 0, 'enter'], [54, 100, 'linear'], [80, 100, 'exit'], [96, 0]]),
  }));
  ls.push(layer('sockets', cl.map(s => group([ellipse(3.2), stroke('muted', 1, 70)], tr({ p: st([s.x + DX, s.y]) }))), op, { o: anim([[72, 0, 'enter'], [92, 100]]) }));
  ls.push(layer('map', mapShapes, op, { p: drift }));
  ls.push(layer('horizon', [group([poly([[-300, 0], [300, 0]], false), stroke('ink', 1.5)])], op, { p: st([CX, HOR, 0]) }));
  ls.push(background(op));
  scene(2, 'ns-persona · a persona is drawn from a place · once', op, ls);
  console.log('persona cluster', pairs.length, 'landing by f', 66 + Math.round((pairs.length - 1) * 1.2) + 18 + 48, 'persona at', [r2(cl[0].x), r2(cl[0].y)], 'lonlat', unproj(K, CX, CY)([cl[0].x, cl[0].y]).map(r2));
}

// 3 · ns-finland-pulse — the settled map; a slow brightness sweep runs north to south through the stars. Seamless.
{
  const op = 240, ls = [], BASE = 60, PEAK = 100, WID = 0.28, SPAN = 0.72;  // rests at 60 %: start it from the map at rest, not on ns-finland's last frame
  ls.push(layer('north', [group([poly(starPts(11)), fill('accent')])], op, { p: st([CX, NORTH_Y, 0]) }));
  ls.push(layer('meridian', [group([poly(MER, false), stroke('muted', 1, 55)])], op));
  ls.push(layer('outline', [group([poly(M.pg), stroke('muted', 1, 100)])], op));
  const rowH = M.lat.rowH, rows = new Map();
  M.stars.forEach(s => { const r = Math.round((s.y - yTop) / rowH); if (!rows.has(r)) rows.set(r, []); rows.get(r).push(s); });
  [...rows.keys()].sort((a, b) => a - b).forEach(r => {
    const list = rows.get(r), yr = list.reduce((a, s) => a + s.y, 0) / list.length, u = SPAN * (yr - yTop) / (yBot - yTop);
    const val = t => { const ph = (((t / op - u) % 1) + 1) % 1; return ph < WID ? BASE + (PEAK - BASE) * 0.5 * (1 - Math.cos(2 * Math.PI * ph / WID)) : BASE; };
    let keys = []; for (let t = 0; t <= op; t += 6) keys.push([t, r2(val(t)), 'linear']);
    keys = keys.filter((k, i, a) => i === 0 || i === a.length - 1 || !(a[i - 1][1] === k[1] && a[i + 1][1] === k[1]));
    ls.push(layer(`row ${r}`, [group([...list.map(s => poly(starPts(starR(s), undefined, s.x, s.y))), fill('ink')])], op, { o: anim(keys) }));
  });
  ls.push(...graticule(null, op));
  ls.push(layer('horizon', [group([poly([[-300, 0], [300, 0]], false), stroke('ink', 1.5)])], op, { p: st([CX, HOR, 0]) }));
  ls.push(background(op));
  scene(3, 'ns-finland-pulse · the population as one body · loop', op, ls);
}

console.log('stars', M.stars.length, 'outline vertices', FI.length, 'aland vertices', AL.length, 'aland stars', ALS.length);

// self-check for the artboard's composition card (Geo.dc.html, variant b): drawn class shares against the published margins they follow
{
  const UP = finland(1, 0, 0, 0.13), C = composition(UP.stars, UP.P, COMP.N, COMP.A, COMP.S);
  console.log('composition card', C.n, 'stars ·', MUNI.map((q, i) => `${q[0]} drawn ${(100 * C.drawnShare[i]).toFixed(2)} % vs bar ${(100 * C.share[i]).toFixed(2)} % (${C.drawn[i].length} of a pool of ${C.pools[i]})`).join(' · '));
  if (C.n !== COMP.N || C.drawnShare.some((x, i) => Math.abs(x - C.share[i]) > 1 / C.n)) throw new Error('composition card drifts from its margins');
}
