/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar world: the global frame in agent-stars → <player>/public/projects/northstar-world{,-day}/scene-N/
// node build-lottie-world.js <player-dir>
//
// Scenes (960 × 540, 60 fps):
//   1 ns-world            once 300 f  Equal Earth world rises from the equator as an agent-star field; borders trace on;
//                                     graticule fades in; MarketStatus marks land (FI, JP filled north stars; US hollow ring)
//   2 ns-world-focus      once 300 f  camera push into Finland; the world dims; Finland's own LAEA star map cross-dissolves in
//   3 ns-world-focus-jp   once 300 f  the same into Japan, with Ryukyu and Ogasawara insets at the map's scale
//   4 ns-earth            loop 720 f  orthographic globe of land-only agent stars turning 360° about the polar axis
//
// Geometry: Natural Earth 1:50m admin-0 (public domain) via world-atlas 2.0.2 (ISC); ISO 3166-1 codes via
// i18n-iso-countries 7.14.0 (MIT). Boundaries are Natural Earth de facto lines, drawn for orientation. They are not a
// political statement.
// Market status (the marks) from backend/app/services/citizen/population.py: FI and JP roster_ready, US registered and
// not roster-ready, every other country has no panel. Composition is not drawn anywhere in this set: every star field
// is the shape of the place, not where people live or the panel size.
//
// The scenes carry no text. An artboard that embeds them must print the key, provenance, disclaimer and star caption;
// the generator writes them to canvas/project/lottie/world{,-day}/captions.json.
const fs = require('fs');
const path = require('path');
const { equalEarth, EE_W, EE_H, fitCountry, laea, D2R } = require('./geo-proj.js');

if (!process.argv[2]) { console.error('usage: node build-lottie-world.js <player-dir>'); process.exit(1); }
const PLAYER = process.argv[2];
const GEO = path.join(__dirname, '..', 'geo');
const CANVAS_LOTTIE = path.join(__dirname, '..', 'canvas', 'project', 'lottie');
const WORLD = JSON.parse(fs.readFileSync(path.join(GEO, 'world-geo.world.json'), 'utf8')).countries;
const FULL = JSON.parse(fs.readFileSync(path.join(GEO, 'world-geo.json'), 'utf8')).countries;
const FR = 60, W = 960, H = 540, SEED = 20261025, TAU = 2 * Math.PI, LIMIT = 600000;
const THEMES = {
  night: { dir: 'northstar-world', canvas: 'world', name: 'Night', bg: '#08090C', accent: '#93B4E0', ink: '#E8EAEE', muted: '#7D838F', floor: 16 },
  day: { dir: 'northstar-world-day', canvas: 'world-day', name: 'Day', bg: '#FFFFFF', accent: '#2F5D9A', ink: '#06080C', muted: '#656A75', floor: 22 },
};
const MARKETS = [{ key: 'FI', status: 'roster' }, { key: 'JP', status: 'roster' }, { key: 'US', status: 'registered' }];
const TIER = Object.fromEntries(FULL.map(c => [c.key, c.tier]));
const AREA = Object.fromEntries(FULL.map(c => [c.key, c.areaDeg2]));
const NAME = Object.fromEntries(FULL.map(c => [c.key, c.name]));
// hairline opacities (percent of the muted slot): coast and the globe limb carry the shape (about 3:1), borders
// are secondary (about 2.2:1), the graticule is decorative
const OP_COAST = 72, OP_BORDER = 52, OP_LIMB = 72, OP_GRAT = 22, OP_OUTLINE = 40;

// ---------- lottie helpers (style of build-lottie-geo.js / build-lottie-3d.js) ----------
const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const E = { settle: [0, 0.65, 0.51, 0.99], enter: [0.2, 0.75, 0.34, 0.94], travel: [1, 0.49, 0, 0.55], exit: [1, 0.02, 0.54, 0.42], rise: [0.45, 0, 0.12, 1], linear: [0, 0, 1, 1] };
const r1 = v => Math.round(v * 10) / 10;
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
const LO = { x: [0], y: [0] }, LI = { x: [1], y: [1] };
// linear keys from samples [[t, value], ...]; drops samples that linear interpolation reproduces within tol
function linKeys(samples, tol, round = r2) {
  const keep = [0];
  for (let i = 1; i < samples.length - 1; i++) {
    const a = samples[keep[keep.length - 1]], b = samples[i + 1];
    let ok = true;
    for (let j = keep[keep.length - 1] + 1; j <= i && ok; j++) {
      const u = (samples[j][0] - a[0]) / (b[0] - a[0]), va = [].concat(a[1]), vb = [].concat(b[1]), vj = [].concat(samples[j][1]);
      ok = vj.every((v, d) => Math.abs(va[d] + (vb[d] - va[d]) * u - v) <= tol);
    }
    if (!ok) keep.push(i);
  }
  keep.push(samples.length - 1);
  const ks = keep.map(i => samples[i]);
  if (ks.every(k => JSON.stringify([].concat(k[1]).map(round)) === JSON.stringify([].concat(ks[0][1]).map(round)))) return st([].concat(ks[0][1]).map(round));
  return { a: 1, k: ks.map(([t, v], i) => (i < ks.length - 1 ? { t, s: [].concat(v).map(round), o: LO, i: LI } : { t, s: [].concat(v).map(round) })) };
}
// every shape transform goes through tr(): p, a, s, r, o, sk, sa always present (strict runtimes decode it as is)
const tr = (o = {}) => ({ ty: 'tr', p: o.p || st([0, 0]), a: o.a || st([0, 0]), s: o.s || st([100, 100]), r: o.r || st(0), o: o.o || st(100), sk: st(0), sa: st(0) });
const prop = v => (v && typeof v === 'object' && 'k' in v ? v : st(v));
const poly = (v, c = true, round = r2) => ({ ty: 'sh', d: 1, ks: st({ i: v.map(() => [0, 0]), o: v.map(() => [0, 0]), v: v.map(p => p.map(round)), c }) });
const ellipse = (d, p = [0, 0]) => ({ ty: 'el', p: st(p.map(r2)), s: st([r2(d), r2(d)]), d: 1 });
const rect = (w, h, p = [0, 0]) => ({ ty: 'rc', p: st(p.map(r2)), s: st([r2(w), r2(h)]), r: st(0), d: 1 });
const stroke = (sid, w, o = 100) => ({ ty: 'st', c: { sid }, o: prop(o), w: prop(w), lc: 2, lj: 2 });
const fill = (sid, o = 100) => ({ ty: 'fl', c: { sid }, o: prop(o), r: 1 });
const trim = (s, e) => ({ ty: 'tm', s, e, o: st(0), m: 1 });
const group = (items, t) => ({ ty: 'gr', nm: 'g', it: [...items, t || tr()] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([0, 0, 0]), a: ks.a || st([0, 0, 0]), s: ks.s || st([100, 100, 100]) },
  shapes,
});
const pol = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
const starPts = (R, r = R * 0.27, cx = 0, cy = 0) => Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(i % 2 ? r : R, i * 45); return [cx + x, cy + y]; });
// The system's 4-point star, compact form for agents at world and globe scale (R ≤ 3.5 px): the same four tips with
// the same tip angle (tangents run along the straight edges toward the 0.27 R waist vertices), joined by cubics whose
// control points sit 1.184 × the way to those vertices. That keeps the straight star's area (0.764 R²) in 4 vertices
// instead of 8 — 30 % fewer bytes per agent, so every scene stays under 600 kB with all its agents.
const CS = 0.27 * Math.SQRT1_2, KS = 1.184;
const STAR_V = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const STAR_O = [[CS, 1 - CS], [CS - 1, CS], [-CS, CS - 1], [1 - CS, -CS]];
const STAR_I = [[-CS, 1 - CS], [CS - 1, -CS], [CS, CS - 1], [1 - CS, CS]];
const starC = (cx, cy, R, round = r1) => ({ ty: 'sh', d: 1, ks: st({
  i: STAR_I.map(p => p.map(v => r1(v * KS * R))), o: STAR_O.map(p => p.map(v => r1(v * KS * R))),
  v: STAR_V.map(([x, y]) => [round(cx + x * R), round(cy + y * R)]), c: true,
}) });
const background = op => layer('background', [group([rect(W * 2, H * 2), fill('bgColor')])], op, { p: st([W / 2, H / 2, 0]) });
function ease(name, x) {
  const [x1, y1, x2, y2] = E[name];
  const bx = t => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = t => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; }
  return by((lo + hi) / 2);
}
const clamp01 = v => Math.max(0, Math.min(1, v));

// ---------- planar geometry ----------
const lcg = s => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const segD = ([px, py], [ax, ay], [bx, by]) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - ax - t * dx, py - ay - t * dy); };
const bboxOf = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }); return [x0, y0, x1, y1]; };
const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a) / 2; };
const pathLen = l => l.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - l[i][0], q[1] - l[i][1]), 0);
const mean = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let md = -1, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = segD(pts[i], pts[a], pts[b]); if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// A region is a list of countries, each a list of rings in px. Point-in-country is crossing parity over ALL of a
// country's rings (even-odd), so holes and multi-part countries need no special case.
function makeRegion(countries) {
  countries.forEach(c => { c.rings.forEach(r => { r.bb = bboxOf(r.pts); }); c.bb = bboxOf(c.rings.flatMap(r => r.pts)); });
  const parity = ([x, y], c) => {
    let inside = false;
    for (const r of c.rings) {
      if (y < r.bb[1] || y > r.bb[3] || x < r.bb[0] || x > r.bb[2]) continue;   // a closed ring that misses the point adds an even count
      const pg = r.pts;
      for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const [xi, yi] = pg[i], [xj, yj] = pg[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; }
    }
    return inside;
  };
  return { countries, inside(p) { for (const c of countries) { if (p[0] < c.bb[0] || p[0] > c.bb[2] || p[1] < c.bb[1] || p[1] > c.bb[3]) continue; if (parity(p, c)) return c.key; } return null; }, parity };
}
// segment index for "distance to the nearest drawn hairline", exact below `reach`
function segIndex(segs, reach, cell = 16) {
  const grid = new Map(), key = (i, j) => i * 65536 + j;
  segs.forEach((s, n) => {
    const x0 = Math.min(s[0], s[2]) - reach, x1 = Math.max(s[0], s[2]) + reach, y0 = Math.min(s[1], s[3]) - reach, y1 = Math.max(s[1], s[3]) + reach;
    for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) for (let j = Math.floor(y0 / cell); j <= Math.floor(y1 / cell); j++) { const k = key(i, j); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(n); }
  });
  return { d(p) { const l = grid.get(key(Math.floor(p[0] / cell), Math.floor(p[1] / cell))); if (!l) return Infinity; let m = Infinity; for (const n of l) { const s = segs[n]; m = Math.min(m, segD(p, [s[0], s[1]], [s[2], s[3]])); } return m; } };
}
const segsOf = lines => lines.flatMap(l => l.slice(1).map((q, i) => [l[i][0], l[i][1], q[0], q[1]]));
// The staggered lattice of Geo.dc.html's lattice(), generalised from one polygon to a region of countries:
// rows offset by half a pitch, seeded jitter (same RNG call order), keep-out from the hairlines, and the same
// second pass for narrow features.
function lattice(region, bb, pitch, edge, jit = 0.18, keep = 0.35, seed = SEED) {
  const rnd = lcg(seed), h = pitch * Math.sqrt(3) / 2, acc = [], rej = [];
  const [x0, y0, x1, y1] = bb;
  for (let j = 0, y = y0 + h / 2; y < y1; j++, y += h) for (let x = x0 + (j % 2 ? pitch * 3 / 4 : pitch / 4); x < x1; x += pitch) {
    const jx = (rnd() * 2 - 1) * jit * pitch, jy = (rnd() * 2 - 1) * jit * pitch, s = rnd(), p = [x + jx, y + jy];
    const pt = { x: p[0], y: p[1], gx: x, gy: y, row: j, s };
    const c = region.inside(p);
    if (!c) continue;
    pt.c = c;
    if (edge.d(p) < keep * pitch) rej.push(pt); else acc.push(pt);
  }
  rej.forEach(p => {
    const g = [p.gx, p.gy], q = edge.d([p.x, p.y]) >= 0.2 * pitch ? [p.x, p.y] : region.inside(g) && edge.d(g) >= 0.2 * pitch ? g : null;
    if (q && acc.filter(a => Math.abs(a.x - q[0]) < 1.5 * pitch && Math.hypot(a.x - q[0], a.y - q[1]) < 1.5 * pitch).length <= 1) { p.x = q[0]; p.y = q[1]; p.c = region.inside(q) || p.c; p.fill = true; acc.push(p); }
  });
  return { acc, rowH: h, y0 };
}
// pole of inaccessibility, by grid search then refinement, inside one country (parity) against its own edges
function interiorPoint(region, c, segs, ring) {
  const idx = segIndex(segs, 60, 12), bb = bboxOf(ring);
  let best = null, bd = -1;
  const tryP = p => { if (!region.parity(p, c)) return; const d = Math.min(idx.d(p), 60); if (d > bd) { bd = d; best = p; } };
  const step = Math.max(0.25, Math.min(bb[2] - bb[0], bb[3] - bb[1]) / 40);
  for (let x = bb[0]; x <= bb[2]; x += step) for (let y = bb[1]; y <= bb[3]; y += step) tryP([x, y]);
  if (!best) return { p: null, d: 0 };
  for (let s = step / 2; s > 0.05; s /= 2) { const b = best; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) tryP([b[0] + dx * s, b[1] + dy * s]); }
  return { p: best, d: bd };
}

// ---------- land rings ----------
// Land-test rings of a world-tier country (lon/lat). Antarctica is stored as a pole ring at -89.999° (traced out and
// back, zero area) with its coastline as a "hole" whose ring closes along a chord at about -84.3°. For parity the pole
// ring is dropped and the coast ring is closed along the antimeridian and the pole instead, so land reaches -90°.
function landRings(c) {
  const out = [];
  c.rings.forEach(({ r }) => {
    if (r.every(p => p[1] <= -89.99)) return;
    const pts = r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1] ? r.slice(0, -1) : r.slice();
    const n = pts.length, j = pts.findIndex((p, i) => Math.abs(pts[(i + 1) % n][0] - p[0]) > 180);
    if (j < 0) { out.push(pts); return; }
    const seq = pts.slice(j + 1).concat(pts.slice(0, j + 1));            // starts after the chord, ends before it
    const S = seq[0], Ee = seq[seq.length - 1], east = Ee[0] > 0 ? 180 : -180;
    out.push(seq.concat([[east, S[1]], [east, -90], [-east, -90]]));
  });
  return out;
}

// ================================================================================================
// World view, Equal Earth: 866 × 422 px, centred at (480, 272)
const KW = 160, CXW = 480, CYW = 272;
const PE = (lo, la) => { const [x, y] = equalEarth(lo, la); return [CXW + x * KW, CYW + y * KW]; };
// hairlines: every ring edge once. An edge two countries share is a land border, an edge one country owns is coast.
// Construction edges are never drawn: the antimeridian cut, Antarctica's pole ring (lat ≤ -89.99°) and any edge that
// jumps more than 180° of longitude (Antarctica's wrap chord).
const ptKey = p => p[0] + ',' + p[1];
const edgeMap = new Map();
let dropped = { meridian: 0, pole: 0, wrap: 0 };
WORLD.forEach(c => c.rings.forEach(({ r }) => {
  for (let i = 0; i < r.length - 1; i++) {
    const a = r[i], b = r[i + 1];
    if (Math.abs(a[0]) >= 179.9999 && Math.abs(b[0]) >= 179.9999 && Math.abs(a[0] - b[0]) < 1e-6) { dropped.meridian++; continue; }
    if (a[1] <= -89.99 && b[1] <= -89.99) { dropped.pole++; continue; }
    if (Math.abs(a[0] - b[0]) > 180) { dropped.wrap++; continue; }
    const ka = ptKey(a), kb = ptKey(b); if (ka === kb) continue;
    const k = ka < kb ? ka + '|' + kb : kb + '|' + ka;
    if (!edgeMap.has(k)) edgeMap.set(k, { a: ka, b: kb, pa: a, pb: b, n: 0, ks: new Set() });
    const e = edgeMap.get(k); e.n++; e.ks.add(c.key);
  }
}));
function chain(edges) {
  const adj = new Map(), pts = new Map();
  edges.forEach((e, i) => { [e.a, e.b].forEach(k => { if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); }); pts.set(e.a, e.pa); pts.set(e.b, e.pb); });
  const used = new Uint8Array(edges.length), out = [];
  const walk = (start, ei) => {
    const line = [start], keys = new Set(); let cur = start, e = ei;
    while (e != null && !used[e]) {
      used[e] = 1; const ed = edges[e], nxt = ed.a === cur ? ed.b : ed.a; line.push(nxt); cur = nxt; ed.ks.forEach(k => keys.add(k));
      const l = adj.get(cur); if (l.length !== 2) break; e = l[0] === e ? l[1] : l[0];
    }
    const L = line.map(k => pts.get(k)); L.keys = keys; return L;
  };
  for (const [node, l] of adj) if (l.length !== 2) l.forEach(ei => { if (!used[ei]) out.push(walk(node, ei)); });
  edges.forEach((e, i) => { if (!used[i]) out.push(walk(e.a, i)); });
  return out;
}
const allEdges = [...edgeMap.values()];
const simplifyLines = (lines, tol, minSize) => lines.map(l => { const q = dp(l.map(([lo, la]) => PE(lo, la)), tol); q.keys = l.keys; return q; }).filter(l => { const b = bboxOf(l); return Math.max(b[2] - b[0], b[3] - b[1]) >= minSize && l.length >= 2; });
const COAST = simplifyLines(chain(allEdges.filter(e => e.n === 1)), 0.8, 3.5);
const BORDER = simplifyLines(chain(allEdges.filter(e => e.n >= 2)), 0.8, 2);
const nV = ls => ls.reduce((a, l) => a + l.length, 0);
const longest = ls => { let m = { d: 0 }; ls.forEach(l => l.slice(1).forEach((q, i) => { const d = Math.hypot(q[0] - l[i][0], q[1] - l[i][1]); if (d > m.d) m = { d, a: l[i], b: q, keys: [...l.keys].join('+') }; })); return m; };
const LC = longest(COAST), LB = longest(BORDER);
console.log(`world hairlines · ${allEdges.filter(e => e.n === 1).length} coast edges, ${allEdges.filter(e => e.n >= 2).length} shared · construction dropped: ${dropped.meridian} antimeridian, ${dropped.pole} pole, ${dropped.wrap} wrap · drawn ${COAST.length} coast lines (${nV(COAST)} v), ${BORDER.length} borders (${nV(BORDER)} v)`);
console.log(`  longest coast segment ${r1(LC.d)} px (${LC.keys}, (${LC.a.map(r1)}) → (${LC.b.map(r1)})) · longest border segment ${r1(LB.d)} px (${LB.keys})`);
const WREG = makeRegion(WORLD.map(c => ({ key: c.key, rings: landRings(c).map(r => ({ pts: r.map(([lo, la]) => PE(lo, la)) })) })));
{
  // Antarctica's islands must not fall inside the pole-closed coast ring (parity would turn them into holes)
  const aq = WREG.countries.find(c => c.key === 'AQ'), main = aq.rings.reduce((a, r) => (ringArea(r.pts) > ringArea(a.pts) ? r : a));
  const one = makeRegion([{ key: 'm', rings: [{ pts: main.pts }] }]);
  const inside = aq.rings.filter(r => r !== main && one.inside(mean(r.pts))).length;
  console.log(`  Antarctica · ${aq.rings.length} land rings · main ring closed along the pole, y ${r1(bboxOf(main.pts)[1])}…${r1(bboxOf(main.pts)[3])} · islands inside it: ${inside}`);
}
// graticule (30°), the projection outline, the equator
const merid = (lo, step = 5) => Array.from({ length: 180 / step + 1 }, (_, i) => PE(lo, 90 - i * step));
const GRAT = [
  ...[-60, -30, 30, 60].map(la => [PE(-180, la), PE(180, la)]),
  ...[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lo => merid(lo, 10)),   // 10° chords: at most 0.66 px off the curve
];
const OUTLINE = [...merid(-180), ...merid(180).reverse()];
const EQ = [PE(-180, 0), PE(180, 0)], YEQ = EQ[0][1];
const PW = 7.5;                                       // world pitch, px
// keep-out 0.35 pitch from the coast and from the projection outline (Antarctica's pole edge is the outline), and
// 0.2 pitch from land borders, so small countries keep agents
const WCOAST = segIndex(segsOf(COAST).concat(segsOf([OUTLINE.concat([OUTLINE[0]])])), 0.35 * PW + 0.5), WBORD = segIndex(segsOf(BORDER), 0.35 * PW + 0.5);
const WEDGE = { d: p => Math.min(WCOAST.d(p), WBORD.d(p) + 0.15 * PW) };
const WBB = [CXW - EE_W / 2 * KW, CYW - EE_H / 2 * KW, CXW + EE_W / 2 * KW, CYW + EE_H / 2 * KW];
const WL = lattice(WREG, WBB, PW, WEDGE);
const WSTARS = WL.acc.slice();
const latticeKeys = new Set(WSTARS.map(s => s.c));
// Dot mode at world scale. Every standard and small country the lattice leaves empty gets one agent at its pole of
// inaccessibility; every micro feature gets one locator dot (its largest part). A dot closer than MIN_SEP to an agent
// already placed is not drawn: that is the cap, so a dense archipelago does not merge into a blob.
const MIN_SEP = 2.2;
const FILLS = [], SKIP = [];
{
  const rank = { standard: 0, small: 1, micro: 2 };
  const todo = WREG.countries.filter(c => !latticeKeys.has(c.key)).sort((a, b) => rank[TIER[a.key]] - rank[TIER[b.key]] || AREA[b.key] - AREA[a.key]);
  const placed = WSTARS.slice();
  todo.forEach(c => {
    const big = c.rings.reduce((a, r) => (ringArea(r.pts) > ringArea(a.pts) ? r : a)).pts;
    const ip = interiorPoint(WREG, c, segsOf(c.rings.map(r => r.pts.concat([r.pts[0]]))), big);
    const p = ip.p || mean(big);
    const clash = placed.find(s => Math.hypot(s.x - p[0], s.y - p[1]) < MIN_SEP);
    if (clash) { SKIP.push({ key: c.key, tier: TIER[c.key], by: clash.c, d: r1(Math.hypot(clash.x - p[0], clash.y - p[1])) }); return; }
    const j = Math.max(0, Math.round((p[1] - (WBB[1] + WL.rowH / 2)) / WL.rowH));
    const s = { x: p[0], y: p[1], gx: p[0], gy: WBB[1] + WL.rowH / 2 + j * WL.rowH, row: j, s: 0, c: c.key, dot: TIER[c.key] === 'micro' ? 'micro' : 'fill' };
    FILLS.push(s); placed.push(s);
  });
}
WSTARS.push(...FILLS);
const starRW = s => (s.dot === 'micro' ? 1.1 : s.dot ? 1.3 : 1.4 + 0.45 * s.s);
const byKey = {}; WSTARS.forEach(s => { byKey[s.c] = (byKey[s.c] || 0) + 1; });
const hairKeys = new Set(); COAST.concat(BORDER).forEach(l => l.keys.forEach(k => hairKeys.add(k)));
const tierCount = t => { const all = FULL.filter(c => c.tier === t); return `${t} ${all.filter(c => byKey[c.key]).length}/${all.length}`; };
const DARK = FULL.filter(c => !byKey[c.key] && !hairKeys.has(c.key)).map(c => c.key);
console.log(`world lattice · pitch ${PW} px · ${WL.acc.length} lattice agents in ${latticeKeys.size} features + ${FILLS.filter(s => s.dot === 'fill').length} dot-mode agents + ${FILLS.filter(s => s.dot === 'micro').length} micro locator dots · features with an agent: ${['standard', 'small', 'micro'].map(tierCount).join(' · ')} · FI ${byKey.FI || 0} · JP ${byKey.JP || 0} · US ${byKey.US || 0}`);
console.log(`  not drawn (within ${MIN_SEP} px of an agent): ${SKIP.map(s => `${s.key}(${s.tier[0]}, by ${s.by} ${s.d})`).join(' ')}`);
console.log(`  features with neither an agent nor a hairline: ${DARK.length ? DARK.join(' ') : 'none'}`);
// MarketStatus marks: pole of inaccessibility of each market's largest ring in the world view
const MARK = {};
MARKETS.forEach(m => {
  const c = WREG.countries.find(c => c.key === m.key);
  const big = c.rings.reduce((a, r) => (ringArea(r.pts) > ringArea(a.pts) ? r : a)).pts;
  const own = segsOf(c.rings.map(r => r.pts));
  MARK[m.key] = { ...m, ...interiorPoint(WREG, c, own, big) };
  console.log(`mark ${m.key} (${m.status}) at (${r1(MARK[m.key].p[0])}, ${r1(MARK[m.key].p[1])}) · clearance ${r1(MARK[m.key].d)} px`);
});
const MARK_R = 7, DISC_R = MARK_R + 2;
// Filled north star (roster-ready) or hollow ring (registered, not calibrated); no mark = not available.
// Shape carries the status, never hue: the ring is ink, the stars are the signal colour. The mark sits on top; its
// knockout disc is a separate layer UNDER the hairlines and over the agents, so it clears agents only and the
// country's coast and borders stay drawn through the mark.
const markStar = m => (m.status === 'roster' ? group([poly(starPts(MARK_R)), fill('accent')]) : group([ellipse(2 * (MARK_R - 1.5)), stroke('ink', 1.5)]));
const markDisc = () => group([ellipse(2 * DISC_R), fill('bgColor')]);

// ================================================================================================
// A country's own star map, LAEA framed on c.frame, north up (fitCountry), in final screen coordinates.
// Parts are drawn where they fall if they lie inside the canvas; parts beyond it go to insets at the map's own scale
// (each inset its own LAEA, north up), so nothing a panel's frame covers is silently left out.
const BOX = { x: 220, y: 94, w: 520, h: 412 };
const NORTH = [480, 42], MER = [[480, 56], [480, 80]];
const CANVAS_IN = [6, 6, W - 6, H - 8];
const inRect = (p, r, m = 0) => p[0] >= r[0] - m && p[0] <= r[2] + m && p[1] >= r[1] - m && p[1] <= r[3] + m;
function starField(key, parts, pitch) {
  const rings = parts.flatMap(pg => pg.map((r, k) => ({ r: dp(r, 0.4), raw: r, outer: k === 0, a: ringArea(pg[0]) })))
    .filter(q => { const b = bboxOf(q.r); return Math.max(b[2] - b[0], b[3] - b[1]) >= 1.2 || (q.outer && q.a >= 1.5); })
    .map(q => (q.r.length >= 4 ? q.r : q.raw));
  const reg = makeRegion([{ key, rings: parts.flat().map(pts => ({ pts })) }]);
  const edge = segIndex(segsOf(rings.map(r => r.concat([r[0]]))), 0.35 * pitch + 0.5);
  const L = lattice(reg, bboxOf(parts.flatMap(pg => pg[0])), pitch, edge);
  // dot mode for parts the lattice leaves empty: one star per island part, largest first, capped
  const dots = [];
  parts.map(pg => ({ pg, a: ringArea(pg[0]) })).sort((a, b) => b.a - a.a).forEach(({ pg, a }) => {
    if (dots.length >= 24 || a < 0.8) return;
    const one = makeRegion([{ key, rings: pg.map(pts => ({ pts })) }]);
    if (L.acc.some(s => one.inside([s.x, s.y]))) return;
    const ip = interiorPoint(one, one.countries[0], segsOf(pg), pg[0]);
    dots.push({ x: (ip.p || mean(pg[0]))[0], y: (ip.p || mean(pg[0]))[1], s: 0.3, dot: true });
  });
  return { rings, stars: L.acc.concat(dots), nLat: L.acc.length, nDot: dots.length };
}
function countryMap(key, pitch, parallels, opt = {}) {
  const c = FULL.find(q => q.key === key);
  const fit = fitCountry(c, BOX.w, BOX.h, 0);
  const P = (lo, la) => { const [x, y] = fit.project(lo, la); return [BOX.x + x, BOX.y + y]; };
  const src = c.parts.map(pg => ({ pg, from: key })).concat((opt.merge || []).flatMap(k => FULL.find(q => q.key === k).parts.map(pg => ({ pg, from: k }))));
  const all = src.map(o => ({ ...o, px: o.pg.map(r => r.map(([lo, la]) => P(lo, la))) }));
  const inView = all.filter(o => { const b = bboxOf(o.px[0]); return inRect([b[0], b[1]], CANVAS_IN) && inRect([b[2], b[3]], CANVAS_IN); });
  const beyond = all.filter(o => !inView.includes(o));
  const main = starField(key, inView.map(o => o.px), pitch);
  // insets: parts beyond the canvas, grouped by the inset rules, each re-projected north up at the map's scale k
  const insets = (opt.insets || []).map(spec => {
    const list = beyond.filter(o => spec.match(mean(o.pg[0])));
    if (!list.length) return null;
    const bb = bboxOf(list.flatMap(o => o.pg[0]));
    const Pi = laea((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2);
    const raw = list.map(o => o.pg.map(r => r.map(([lo, la]) => Pi(lo, la).map(v => v * fit.k))));
    const rb = bboxOf(raw.flatMap(pg => pg[0])), w = Math.max(spec.min, rb[2] - rb[0] + 2 * spec.pad), h = Math.max(spec.min, rb[3] - rb[1] + 2 * spec.pad);
    const box = [spec.at[0] - w / 2, spec.at[1] - h / 2, spec.at[0] + w / 2, spec.at[1] + h / 2];
    const dx = spec.at[0] - (rb[0] + rb[2]) / 2, dy = spec.at[1] - (rb[1] + rb[3]) / 2;
    const parts = raw.map(pg => pg.map(r => r.map(([x, y]) => [x + dx, y + dy])));
    const f = starField(key, parts, pitch);
    return { name: spec.name, box, parts: list.length, ring: spec.ring, ...f };
  }).filter(Boolean);
  const placed = new Set(insets.flatMap(i => beyond.filter(o => (opt.insets || []).find(s => s.name === i.name).match(mean(o.pg[0])))));
  const omitted = beyond.filter(o => !placed.has(o));
  // parallels: sampled every 0.5°, split into separate runs wherever a sample leaves the frame or meets an inset,
  // and a run shorter than 120 px is dropped (a parallel that only grazes the frame is not drawn)
  const excl = insets.map(i => i.box);
  const par = [];
  parallels.forEach(la => {
    const runs = []; let cur = [];
    for (let lo = fit.lon0 - 40; lo <= fit.lon0 + 40; lo += 0.5) {
      const p = P(lo, la);
      if (p[0] >= BOX.x - 60 && p[0] <= BOX.x + BOX.w + 60 && p[1] >= 62 && p[1] <= 530 && !excl.some(r => inRect(p, r, 10))) cur.push(p);
      else { if (cur.length > 1) runs.push(cur); cur = []; }
    }
    if (cur.length > 1) runs.push(cur);
    runs.forEach(r => { r.la = la; if (pathLen(r) >= 120) par.push(r); });
  });
  const kL = fit.k, Z = kL / KW;                      // both projections are equal-area: the scale ratio is exact
  const ctr = P(fit.lon0, fit.lat0), A = PE(fit.lon0 > 180 ? fit.lon0 - 360 : fit.lon0, fit.lat0);
  const bb = bboxOf(main.stars.map(s => [s.x, s.y]));
  const byFrom = k => inView.filter(o => o.from === k).length + '/' + all.filter(o => o.from === k).length;
  console.log(`map ${key} · LAEA λ0 ${r2(fit.lon0)} φ0 ${r2(fit.lat0)} · parts at true position ${[key, ...(opt.merge || [])].map(k => `${k} ${byFrom(k)}`).join(', ')} · ${main.rings.length} rings (${nV(main.rings)} v) · pitch ${pitch} · ${main.nLat} lattice + ${main.nDot} dot-mode agents · zoom ${r2(Z)}× · stars x ${r1(bb[0])}…${r1(bb[2])} y ${r1(bb[1])}…${r1(bb[3])}`);
  insets.forEach(i => console.log(`  inset ${i.name}: ${i.parts} parts · box x ${r1(i.box[0])}…${r1(i.box[2])} y ${r1(i.box[1])}…${r1(i.box[3])} · ${i.nLat} lattice + ${i.nDot} dot-mode agents · clear of the main map by ${r1(Math.min(...main.rings.flat().map(p => Math.max(i.box[0] - p[0], p[0] - i.box[2], i.box[1] - p[1], p[1] - i.box[3]))))} px`));
  console.log(`  parallels ${parallels.join(', ')}° → ${par.length} runs drawn (${par.map(r => `${r.la}° ${Math.round(pathLen(r))} px, max step ${r1(Math.max(...r.slice(1).map((q, i) => Math.hypot(q[0] - r[i][0], q[1] - r[i][1]))))} px`).join('; ')}) · omitted parts: ${omitted.length}`);
  return { key, rings: main.rings, stars: main.stars, par, Z, ctr, A, fit, insets, omitted: omitted.length, partsTotal: all.length };
}
const starRM = s => (s.dot ? 2.0 : 2.3 + 0.6 * s.s);
const MAPS = {
  FI: countryMap('FI', 12, [60, 65, 70], { merge: ['AX'] }),
  JP: countryMap('JP', 10, [30, 35, 40, 45], { insets: [
    { name: 'Ryukyu', match: ([lo, la]) => lo < 131.5 && la < 29.6, at: [150, 452], pad: 14, min: 44 },
    { name: 'Ogasawara', match: ([lo, la]) => lo > 140 && la < 28, at: [624, 494], pad: 14, min: 44, ring: 7 },
  ] }),
};

// ================================================================================================
// Globe: orthographic, polar axis tipped toward the viewer by ALPHA. Exact by construction, no sampled positions:
//   screen = c + (0, -R sinφ cosα) + S(1, sinα) · Rot(θ) · q,   q = R cosφ (sin λ', cos λ')
// Each latitude level is one rig: an outer group (position, vertical squash) around an inner group turning 0 → -360°;
// each agent inside sits at its q and turns +360° under a 1/sinα stretch, so its star stays upright and round. Two
// linear keys per turn: frame 0 and frame 720 are the same drawing.
const GC = [480, 284], GR = 210, ALPHA = 22 * D2R, KQ = Math.sin(ALPHA), CA = Math.cos(ALPHA), FACE = 20, OPG = 720;
const GPITCH = 4.3;                                    // degrees of arc (4.3, not 4.2: keeps ns-earth under 600 kB with canonical transforms and dot-mode fills)
const GROWS = [], G_EMIT = [];
let GFILL = [];
{
  // land test on the sphere: parity in lon/lat over each country's land rings (Antarctica closed along the pole)
  const LREG = makeRegion(WORLD.map(c => ({ key: c.key, rings: landRings(c).map(pts => ({ pts })) })));
  // The globe draws no coastline, so there is no hairline for a keep-out to clear: a 0.2-pitch coast keep-out
  // emptied Europe (56 → 19 agents), so the sphere lattice keeps every land node.
  const rnd = lcg(SEED), h = GPITCH * Math.sqrt(3) / 2;
  const nRows = Math.floor(180 / h);
  const rowLa = j => -90 + h / 2 + j * h + (180 - nRows * h) / 2;
  for (let j = 0; j < nRows; j++) {
    const la0 = rowLa(j);
    const n = Math.max(1, Math.round(360 * Math.cos(la0 * D2R) / GPITCH)), dl = 360 / n;
    for (let i = 0; i < n; i++) {
      const jx = (rnd() * 2 - 1) * 0.18, jy = (rnd() * 2 - 1) * 0.18, s = rnd();
      const la = la0 + jy * h, lo = -180 + (i + (j % 2 ? 0.75 : 0.25) + jx) * dl;
      const lon = lo > 180 ? lo - 360 : lo;
      const c = LREG.inside([lon, la]);
      if (!c) continue;
      GROWS.push({ row: j, la0, la, lon, s, c });
    }
  }
  // Dot mode on the sphere for standard-tier countries the lattice leaves empty: one agent at the pole of
  // inaccessibility (planar in lon·cosφ, lat), hung on the nearest rig row; skipped closer than 0.45 pitch to another.
  const have = new Set(GROWS.map(g => g.c)), ang = (a, b) => { const p1 = a.la * D2R, p2 = b.la * D2R, dl = (b.lon - a.lon) * D2R; return Math.acos(Math.min(1, Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl))) / D2R; };
  WORLD.filter(c => TIER[c.key] === 'standard' && !have.has(c.key)).forEach(c => {
    const rings = landRings(c), big = rings.reduce((a, r) => (ringArea(r) > ringArea(a) ? r : a)), k = Math.cos(mean(big)[1] * D2R);
    const reg = makeRegion([{ key: c.key, rings: rings.map(r => ({ pts: r.map(([lo, la]) => [lo * k, la]) })) }]);
    const ip = interiorPoint(reg, reg.countries[0], segsOf(rings.map(r => r.map(([lo, la]) => [lo * k, la]).concat([[r[0][0] * k, r[0][1]]]))), big.map(([lo, la]) => [lo * k, la]));
    if (!ip.p) return;
    const g = { lon: ip.p[0] / k, la: ip.p[1], s: 0.3, c: c.key, fill: true };
    if (GROWS.some(q => ang(q, g) < 0.45 * GPITCH)) return;
    const j = Math.max(0, Math.min(nRows - 1, Math.round((g.la - rowLa(0)) / h)));
    g.row = j; g.la0 = rowLa(j);
    GROWS.push(g); GFILL.push(g.c);
  });
}
console.log(`globe · pitch ${GPITCH}° · ${GROWS.length} land agents (${GFILL.length} dot-mode: ${GFILL.join(' ')}) · south of -84.3°: ${GROWS.filter(g => g.la < -84.3).length}`);

// ================================================================================================
// Captions the embedding artboard must print (the scenes carry no text)
const CAP = {
  key: 'Roster-ready / Registered · not calibrated / Not available — from population.py',
  marks: [
    { mark: 'filled north star (Glacier)', status: 'Roster-ready', markets: ['FI', 'JP'] },
    { mark: 'hollow ring (ink)', status: 'Registered · not calibrated', markets: ['US'] },
    { mark: 'no mark', status: 'Not available', markets: 'every other country and territory' },
  ],
  provenance: 'Natural Earth 1:50m admin-0 (public domain) via world-atlas 2.0.2 (ISC); ISO 3166-1 codes via i18n-iso-countries 7.14.0 (MIT)',
  disclaimer: 'Boundaries are Natural Earth de facto lines, drawn for orientation. They are not a political statement.',
  stars: 'Agent-stars show the shape of the place, not where people live or the panel size. Illustrative.',
  north: 'The large north star above a map or on the pole is the frame\'s north; the small filled north star on a country is the roster-ready mark.',
};
const MICRO_NOTE = `Small countries the lattice misses carry one dot-mode agent; micro territories carry one locator dot each, except where a dot would sit within ${MIN_SEP} px of another agent (${SKIP.length} features: ${SKIP.map(s => s.key).join(', ')}).`;
const SCENE_CAP = {
  1: { file: 'ns-world.json', title: 'ns-world', caption: `The world in agent-stars, Equal Earth. ${MICRO_NOTE}`, mustPrint: ['key', 'provenance', 'disclaimer', 'stars'] },
  2: { file: 'ns-world-focus.json', title: 'ns-world-focus', caption: 'Into Finland (roster-ready). The Finland map is its own Lambert azimuthal equal-area framing and includes Åland. The map shows the frame, not composition: margins are drawn only on the Population card.', mustPrint: ['key', 'provenance', 'disclaimer', 'stars', 'north'] },
  3: { file: 'ns-world-focus-jp.json', title: 'ns-world-focus-jp', caption: `Into Japan (roster-ready). Own LAEA framing; the Ryukyu Islands (Amami to Yaeyama) and Ogasawara (Hahajima) are drawn in insets at the map's scale, displaced from their true position; the Ōsumi Islands are at true position. ${MAPS.JP.omitted ? MAPS.JP.omitted + ' parts are not drawn.' : 'All ' + MAPS.JP.partsTotal + ' Natural Earth parts are drawn.'}`, mustPrint: ['key', 'provenance', 'disclaimer', 'stars', 'north'] },
  4: { file: 'ns-earth.json', title: 'ns-earth', caption: 'Land-only agent-stars on an orthographic globe, one turn per loop; depth by size and opacity. No coastlines or borders are drawn on the globe, and no market status.', mustPrint: ['provenance', 'disclaimer', 'stars', 'north'] },
};

// ================================================================================================
// Build both themes
const stats = {};
const OP1 = 300;
for (const th of Object.values(THEMES)) {
  const out = path.join(PLAYER, 'public', 'projects', th.dir);
  fs.rmSync(out, { recursive: true, force: true });
  const SLOTS = { bgColor: { p: st(rgba(th.bg)) }, accent: { p: st(rgba(th.accent)) }, ink: { p: st(rgba(th.ink)) }, muted: { p: st(rgba(th.muted)) } };
  const CONTROLS = [
    { sid: 'bgColor', label: `Background (${th.name})` },
    { sid: 'accent', label: th.name === 'Night' ? 'Glacier (north star, roster-ready mark)' : 'Glacier ink (north star, roster-ready mark)' },
    { sid: 'ink', label: 'Ink (agents, registered ring)' },
    { sid: 'muted', label: 'Hairlines' },
  ];
  const scene = (n, nm, op, layers) => {
    const dir = path.join(out, `scene-${n}`);
    fs.mkdirSync(dir, { recursive: true });
    const meta = { g: 'build-lottie-world.js', d: [CAP.provenance + '.', CAP.disclaimer, `Market status from population.py: ${CAP.key.split(' — ')[0]} (filled north star / hollow ring / no mark).`, CAP.stars, SCENE_CAP[n].caption].join(' ') };
    const txt = JSON.stringify({ v: '5.12.0', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, meta, assets: [], slots: SLOTS, layers });
    fs.writeFileSync(path.join(dir, 'lottie.json'), txt);
    fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS }, null, 2));
    stats[`${th.dir}/scene-${n}`] = { nm, kb: txt.length / 1000, layers: layers.length };
  };
  const starPoly = (s, R) => poly(starPts(R, R * 0.27, s.x, s.y), true, r1);
  const worldStar = s => starC(s.x, s.y, starRW(s));
  const r0 = v => Math.round(v);
  const lineShapes = ls => ls.map(l => poly(l, false, r0));
  const worldGrat = () => [group([...lineShapes(GRAT), stroke('muted', 1, OP_GRAT)]), group([poly(OUTLINE, true, r1), stroke('muted', 1, OP_OUTLINE)]), group([poly(EQ, false, r1), stroke('muted', 1, 30)])];

  // 1 · ns-world ------------------------------------------------------------------------------
  {
    const op = OP1, stars = [], discs = [], rowsL = [], rnd = lcg(7);
    const t0Mark = { FI: 176, JP: 186, US: 198 };
    MARKETS.forEach(m => {
      const M = MARK[m.key], t = t0Mark[m.key];
      const inner = () => (m.status === 'roster'
        ? tr({ s: anim([[t, [0, 0], 'enter'], [t + 14, [114, 114], 'settle'], [t + 30, [100, 100]]]), r: anim([[t, -45, 'settle'], [t + 30, 0]]) })
        : tr({ s: anim([[t, [60, 60], 'settle'], [t + 26, [100, 100]]]), o: anim([[t, 0, 'enter'], [t + 12, 100]]) }));
      const lab = m.status === 'roster' ? 'roster-ready' : 'registered, not calibrated';
      stars.push(layer(`mark ${m.key} · ${lab}`, [group([markStar(m)], inner())], op, { p: st([r2(M.p[0]), r2(M.p[1]), 0]) }));
      discs.push(layer(`mark ${m.key} · knockout`, [group([markDisc()], inner())], op, { p: st([r2(M.p[0]), r2(M.p[1]), 0]) }));
    });
    // the field: one layer per lattice row, rising from the equator; far rows take longer, like ns-finland's horizon
    const rows = new Map(); WSTARS.forEach(s => { if (!rows.has(s.row)) rows.set(s.row, []); rows.get(s.row).push(s); });
    const maxD = Math.max(...WSTARS.map(s => Math.abs(s.y - YEQ)));
    [...rows.keys()].sort((a, b) => a - b).forEach(j => {
      const list = rows.get(j), yr = list.reduce((a, s) => a + s.gy, 0) / list.length, v = Math.abs(yr - YEQ) / maxD;
      const t0 = 22 + rnd() * 8, t1 = t0 + 54 + 84 * v;
      rowsL.push(layer(`row ${j}`, [group([...list.map(worldStar), fill('ink')])], op, {
        p: anim([[t0, [0, r2(YEQ - yr), 0], 'rise'], [t1, [0, 0, 0]]]),
        o: anim([[t0, 0, 'enter'], [t0 + 14, 100]]),
      }));
    });
    const ls = [
      ...stars,
      // the equator line the field rises from; it hands over to the graticule's equator
      layer('equator line', [group([poly([[-433, 0], [433, 0]], false), trim(anim([[0, 50, 'enter'], [30, 0]]), anim([[0, 50, 'enter'], [30, 100]])), stroke('ink', 1.5)])], op, { p: st([CXW, YEQ, 0]), o: anim([[150, 100, 'exit'], [186, 0]]) }),
      layer('borders', [
        group([...lineShapes(COAST), trim(anim([[112, 50, 'enter'], [176, 0]]), anim([[112, 50, 'enter'], [176, 100]])), stroke('muted', 1, OP_COAST)]),
        group([...lineShapes(BORDER), trim(anim([[124, 50, 'enter'], [184, 0]]), anim([[124, 50, 'enter'], [184, 100]])), stroke('muted', 1, OP_BORDER)]),
      ], op),
      ...discs,
      ...rowsL,
      layer('graticule', worldGrat(), op, { o: anim([[48, 0, 'enter'], [112, 100]]) }),
      background(op),
    ];
    scene(1, 'ns-world · the world in agent-stars · once', op, ls);
  }

  // 2, 3 · ns-world-focus ------------------------------------------------------------------------
  const focus = (n, key, nm, ownKeys) => {
    const op = 300, M = MAPS[key], ls = [];
    const TZ0 = 30, TZ1 = 196, TP1 = 182;
    const zAt = t => Math.pow(M.Z, ease('travel', clamp01((t - TZ0) / (TZ1 - TZ0))));
    const pAt = t => { const u = ease('travel', clamp01((t - TZ0) / (TP1 - TZ0))); return [M.A[0] + (M.ctr[0] - M.A[0]) * u, M.A[1] + (M.ctr[1] - M.A[1]) * u]; };
    const sampleT = []; for (let t = TZ0; t < TZ1; t += 3) sampleT.push(t); sampleT.push(TZ1);
    const cam = (f, tol) => linKeys([[0, f(0)], ...sampleT.map(t => [t, f(t)]), [op, f(op)]], tol);
    // the north star lands; the meridian draws down to the map
    ls.push(layer('north', [group([poly(starPts(11)), fill('accent')], tr({ s: anim([[198, [0, 0], 'enter'], [214, [112, 112], 'settle'], [232, [100, 100]]]), r: anim([[198, -45, 'settle'], [232, 0]]) }))], op, { p: st([...NORTH, 0]) }));
    ls.push(layer('meridian', [group([poly(MER, false), trim(st(0), anim([[188, 0, 'enter'], [210, 100]])), stroke('muted', 1, 55)])], op));
    // the world's MarketStatus marks ride with the camera at constant size and leave with the world
    const markKs = m => {
      const Mk = MARK[m.key], P = t => { const z = zAt(t), p = pAt(t); return [p[0] + z * (Mk.p[0] - M.A[0]), p[1] + z * (Mk.p[1] - M.A[1]), 0]; };
      const own = m.key === key, tEnd = own ? 142 : 100;
      return { p: linKeys([[0, P(0)], ...sampleT.filter(t => t <= tEnd).map(t => [t, P(t)])], 0.15), o: own ? anim([[96, 100, 'exit'], [124, 0]]) : anim([[44, 100, 'exit'], [88, 0]]) };
    };
    MARKETS.forEach(m => ls.push(layer(`mark ${m.key}`, [markStar(m)], op, markKs(m))));
    // the country's own map, LAEA framed, scaled with the same camera so it lands matched, then fully
    const lst = [
      group([...M.par.map(l => poly(l, false, r1)), stroke('muted', 1, 26)]),
      group([...M.rings.map(r => poly(r, true, r1)), stroke('muted', 1, 100)]),
      group([...M.stars.map(s => starPoly(s, starRM(s))), fill('ink')]),
    ];
    ls.push(layer(`${key} · LAEA star map`, lst, op, {
      a: st([r2(M.ctr[0]), r2(M.ctr[1]), 0]),
      p: cam(t => [...pAt(t), 0], 0.15),
      s: cam(t => { const v = 100 * zAt(t) / M.Z; return [v, v, 100]; }, 0.08),
      o: anim([[96, 0, 'enter'], [148, 100]]),
    }));
    // insets, at the map's scale and displaced: they arrive once the camera has landed, without the camera
    if (M.insets.length) {
      const ins = M.insets.flatMap(i => [
        group([rect(i.box[2] - i.box[0], i.box[3] - i.box[1], [(i.box[0] + i.box[2]) / 2, (i.box[1] + i.box[3]) / 2]), stroke('muted', 1, 46)]),
        group([...i.rings.map(r => poly(r, true, r1)), stroke('muted', 1, 100)]),
        ...(i.ring ? [group([...i.stars.map(s => ellipse(2 * i.ring, [s.x, s.y])), stroke('muted', 1, 40)])] : []),
        group([...i.stars.map(s => starPoly(s, starRM(s))), fill('ink')]),
      ]);
      ls.push(layer(`${key} · insets (same scale, displaced)`, ins, op, { o: anim([[200, 0, 'enter'], [236, 100]]) }));
    }
    // the world under the camera; hairlines keep 1 px while it zooms (stroke width = 1 / zoom)
    // sampled only until the stroke has faded out; after that its width is never seen
    const wInv = (w0, tEnd) => linKeys([[0, [w0]], ...sampleT.filter(t => t <= tEnd).map(t => [t, [w0 / zAt(t)]])], 0.02);
    const rest = WSTARS.filter(s => !ownKeys.includes(s.c)), own = WSTARS.filter(s => ownKeys.includes(s.c));
    const camKs = { a: st([r2(M.A[0]), r2(M.A[1]), 0]), p: cam(t => [...pAt(t), 0], 0.15), s: cam(t => { const v = 100 * zAt(t); return [v, v, 100]; }, 0.08), o: anim([[50, 100, 'exit'], [96, 100, 'exit'], [124, 0]]) };
    ls.push(layer('world · hairlines', [
      group([...lineShapes(COAST), stroke('muted', wInv(1, 112), anim([[80, OP_COAST, 'exit'], [112, 0]]))]),
      group([...lineShapes(BORDER), stroke('muted', wInv(1, 104), anim([[72, OP_BORDER, 'exit'], [104, 0]]))]),
      // the world graticule leaves first
      group([...lineShapes(GRAT), stroke('muted', wInv(1, 100), anim([[50, OP_GRAT, 'exit'], [100, 0]]))]),
      group([poly(OUTLINE, true, r1), stroke('muted', wInv(1, 100), anim([[50, OP_OUTLINE, 'exit'], [100, 0]]))]),
      group([poly(EQ, false, r1), stroke('muted', wInv(1, 100), anim([[50, 30, 'exit'], [100, 0]]))]),
    ], op, camKs));
    MARKETS.forEach(m => ls.push(layer(`mark ${m.key} · knockout`, [markDisc()], op, markKs(m))));
    ls.push(layer('world · agents', [
      group([...own.map(worldStar), fill('ink', anim([[92, 100, 'exit'], [116, 0]]))]),
      group([...rest.map(worldStar), fill('ink', anim([[40, 100, 'settle'], [86, 32, 'exit'], [88, 32, 'exit'], [112, 0]]))]),
    ], op, camKs));
    ls.push(background(op));
    scene(n, nm, op, ls);
    if (th.name === 'Night') console.log(`focus ${key}: zoom at f104 ${r2(zAt(104))}× (map at ${r1(100 * zAt(104) / M.Z)} %), f156 ${r2(zAt(156))}× (map ${r1(100 * zAt(156) / M.Z)} %), end ${r2(M.Z)}× · camera keys ${cam(t => [zAt(t)], 0.0005).k.length} · own world agents ${own.length} (${ownKeys.join('+')})`);
  };
  focus(2, 'FI', 'ns-world-focus · into Finland · once', ['FI', 'AX']);
  focus(3, 'JP', 'ns-world-focus-jp · into Japan · once', ['JP']);

  // 4 · ns-earth ------------------------------------------------------------------------------
  {
    const op = OPG, ls = [], om = TAU / op;
    const floor = th.floor, oOf = d => floor + (96 - floor) * d, sOf = d => 0.78 + 0.22 * d;
    // f(t) = A + B cos(ψ + ωt) as Hermite cubic keys at the extrema and the loop ends (exact values and slopes)
    const cosKeys = (A, B, psi, map, dims) => {
      const v = t => map(A + B * Math.cos(psi + om * t)), m = t => (map(A + B * Math.cos(psi + om * (t + 0.01))) - map(A + B * Math.cos(psi + om * (t - 0.01)))) / 0.02;
      const ext = [((-psi % TAU) + TAU) % TAU / om, (((Math.PI - psi) % TAU) + TAU) % TAU / om].map(Math.round).filter(t => t > 2 && t < op - 2).sort((a, b) => a - b);
      const ts = [0, ...ext, op];
      return { a: 1, k: ts.map((t, i) => {
        const val = Array(dims).fill(Math.round(v(t)));
        if (i === ts.length - 1) return { t, s: val };
        const t1 = ts[i + 1], dt = t1 - t, dv = v(t1) - v(t);
        if (Math.abs(dv) < 1e-3) return { t, s: val, o: LO, i: LI };
        const oy = r2(m(t) * dt / 3 / dv), iy = r2(1 - m(t1) * dt / 3 / dv);
        return { t, s: val, o: { x: [0.33], y: [oy] }, i: { x: [0.67], y: [iy] } };
      }) };
    };
    const ROT = s => ({ a: 1, k: [{ t: 0, s: [0], o: LO, i: LI }, { t: op, s: [s] }] });
    const rigs = new Map();
    // one rig per lattice row (its latitude la0); an agent's own latitude offset is its plan radius (exact) plus a
    // screen offset carried in its star's vertices (scaled by the cell's depth size: under 1.4 px of drift)
    GROWS.forEach(g => { if (!rigs.has(g.row)) rigs.set(g.row, { la: g.la0, list: [] }); rigs.get(g.row).list.push(g); });
    const rigShapes = [];
    let nCells = 0;
    // rigs north first: the first group paints on top, and a row's mean depth rises with latitude on this tilt, so
    // northern (nearer) rows cover southern (farther) ones where they overlap
    for (const { la, list } of [...rigs.values()].sort((a, b) => b.la - a.la)) {
      const r = GR * Math.cos(la * D2R), y0 = -GR * Math.sin(la * D2R) * CA;
      list.forEach(g => { g.psi = ((g.lon - FACE) * D2R + TAU) % TAU; });
      list.sort((a, b) => a.psi - b.psi);
      // cells: runs of up to 3 neighbours along the row; each cell carries its depth cue (opacity, size) as a cosine
      const cells = []; let cur = [];
      const dl = GPITCH / Math.max(0.05, Math.cos(la * D2R)) * D2R;
      list.forEach(g => { if (cur.length && (cur.length >= 3 || g.psi - cur[cur.length - 1].psi > 1.7 * dl)) { cells.push(cur); cur = []; } cur.push(g); });
      if (cur.length) cells.push(cur);
      const cellShapes = cells.map(cell => {
        const sx = cell.reduce((a, g) => a + Math.sin(g.psi), 0), sy = cell.reduce((a, g) => a + Math.cos(g.psi), 0), pc = Math.atan2(sx, sy);
        const qc = [r * Math.sin(pc), r * Math.cos(pc)];
        // depth d = (z' + R) / 2R, z' = R sinφ sinα + cosα · r cos ψ
        const A = (GR * Math.sin(la * D2R) * Math.sin(ALPHA) + GR) / (2 * GR), B = CA * r / (2 * GR);
        if (th.name === 'Night') cell.forEach(g => G_EMIT.push(g));
        const agents = cell.map(g => {
          const ri = GR * Math.cos(g.la * D2R), dy = -GR * (Math.sin(g.la * D2R) - Math.sin(la * D2R)) * CA;
          return { ty: 'gr', it: [starC(0, dy, 3.0 + 0.45 * g.s), tr({ p: st([r1(ri * Math.sin(g.psi)), r1(ri * Math.cos(g.psi))]), s: st([100, r2(100 / KQ)]), r: ROT(360) })] };
        });
        nCells++;
        return { ty: 'gr', it: [...agents, tr({ a: st(qc.map(r1)), p: st(qc.map(r1)), s: cosKeys(A, B, pc, d => 100 * sOf(d), 2), o: cosKeys(A, B, pc, oOf, 1) })] };
      });
      rigShapes.push({ ty: 'gr', it: [{ ty: 'gr', it: [...cellShapes, tr({ r: ROT(-360) })] }, fill('ink'), tr({ p: st([GC[0], r1(GC[1] + y0)]), s: st([100, r2(100 * KQ)]) })] });
    }
    // Fixed hairlines: the limb, one meridian on the sphere, the polar axis above the north pole. The meridian lies on
    // the surface, so its front run is nearer than every far agent and its back run farther than every near agent:
    // front run over all agents, back run under all of them, is depth-correct for the meridian (agents exactly on the
    // front run tie with it). Near-over-far between agents is not sorted (see the verify note).
    const rotXv = ([x, y, z]) => [x, y * CA - z * Math.sin(ALPHA), y * Math.sin(ALPHA) + z * CA];
    const MU = -38 * D2R, mer = Array.from({ length: 241 }, (_, i) => { const v = TAU * i / 240; return rotXv([GR * Math.sin(v) * Math.sin(MU), GR * Math.cos(v), GR * Math.sin(v) * Math.cos(MU)]); });
    const runs = { f: [], b: [] }; let curR = null, side = null;
    mer.forEach(p => { const sd = p[2] >= 0 ? 'f' : 'b', q = [GC[0] + p[0], GC[1] - p[1]]; if (sd !== side) { if (curR) { curR.push(q); runs[side].push(curR); } curR = []; side = sd; } curR.push(q); });
    if (curR && curR.length > 1) runs[side].push(curR);
    const pole = [GC[0], GC[1] - GR * CA];
    ls.push(layer('north star · pole', [group([poly(starPts(11)), fill('accent')]), group([ellipse(26), fill('bgColor')])], op, { p: st([pole[0], r2(pole[1]), 0]) }));
    ls.push(layer('axis', [group([poly([[GC[0], pole[1] - 16], [GC[0], GC[1] - GR - 18]], false), stroke('muted', 1, 70)])], op));
    ls.push(layer('meridian · front', [group([...runs.f.map(l => poly(l, false, r1)), stroke('muted', 1, 46)])], op));
    ls.push(layer('agents', rigShapes, op));
    ls.push(layer('meridian · far', [group([...runs.b.map(l => poly(l, false, r1)), stroke('muted', 1, 16)])], op));
    ls.push(layer('limb', [group([ellipse(2 * GR, GC), stroke('muted', 1, OP_LIMB)])], op));
    ls.push(background(op));
    scene(4, 'ns-earth · land-only agents, one turn · loop', op, ls);
    if (th.name === 'Night') console.log(`earth: ${GROWS.length} agents in ${rigs.size} latitude rigs, ${nCells} depth cells · tilt ${ALPHA / D2R}° · R ${GR} · facing ${FACE}°E at f0`);
  }

  // captions for the embedding artboard
  const cdir = path.join(CANVAS_LOTTIE, th.canvas);
  fs.mkdirSync(cdir, { recursive: true });
  fs.writeFileSync(path.join(cdir, 'captions.json'), JSON.stringify({
    generator: 'build-lottie-world.js', theme: th.name,
    requirement: 'These scenes carry no text. An artboard that embeds one must print, next to it, every caption listed in that scene\'s mustPrint. Until it does, the scene is not shippable.',
    ...CAP,
    scenes: Object.values(SCENE_CAP),
  }, null, 2));
}
Object.entries(stats).forEach(([k, v]) => console.log(`${k.padEnd(32)} ${v.kb.toFixed(1).padStart(6)} kB  ${String(v.layers).padStart(3)} layers  ${v.nm}`));
// ================================================================================================
// Verify, from the baked JSON (independent of the generator's own numbers): Skottie-safe lint, canonical transforms,
// slots, size, scene-2/3 start = scene-1 end, layer order of the marks, the ns-earth seam (f0 vs f720), and the globe
// rig against the analytic orthographic projection.
{
  const bez = (x1, y1, x2, y2, u) => { if (x1 === y1 && x2 === y2) return u; let lo = 0, hi = 1, s = u; for (let i = 0; i < 60; i++) { s = (lo + hi) / 2; const x = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s; if (x < u) lo = s; else hi = s; } return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s; };
  const val = (p, t, def) => {
    if (!p) return def;
    if (!p.a) return p.k;
    const k = p.k; if (t <= k[0].t) return k[0].s;
    for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1].t) { if (k[i].h) return k[i].s; const w = bez(k[i].o.x[0], k[i].o.y[0], k[i].i.x[0], k[i].i.y[0], (t - k[i].t) / (k[i + 1].t - k[i].t)); return k[i].s.map((v, d) => v + (k[i + 1].s[d] - v) * w); }
    return k[k.length - 1].s;
  };
  const num = v => (Array.isArray(v) ? v[0] : v);
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const mat = (q, t) => {
    const p = val(q.p, t, [0, 0]), a = val(q.a, t, [0, 0]), s = val(q.s, t, [100, 100]), r = num(val(q.r, t, 0)) * Math.PI / 180, c = Math.cos(r), n = Math.sin(r);
    const sx = s[0] / 100, sy = s[1] / 100;
    return mul([c, n, -n, c, p[0], p[1]], [sx, 0, 0, sy, -sx * a[0], -sy * a[1]]);
  };
  const ap = (M, [x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
  // paints apply to every path in their group and in nested groups (AE / Skottie semantics); the nearest one is used
  const frameOf = (json, t) => {
    const stars = [], lines = [], discs = [];
    json.layers.forEach((L, li) => {
      if (t < L.ip || t > L.op) return;
      const walk = (it, M, op, fills, strokes) => {
        const ti = it.find(i => i.ty === 'tr');
        if (ti) { M = mul(M, mat(ti, t)); op *= num(val(ti.o, t, 100)) / 100; }
        const fl = it.filter(i => i.ty === 'fl').concat(fills), sk = it.filter(i => i.ty === 'st').concat(strokes);
        const tm = it.find(i => i.ty === 'tm'), cut = tm && Math.abs(num(val(tm.e, t, 100)) - num(val(tm.s, t, 0))) < 1e-6;
        it.forEach(i => {
          if (i.ty === 'gr') walk(i.it, M, op, fl, sk);
          if (i.ty === 'sh') {
            const v = i.ks.k.v.map(q => ap(M, q));
            if (fl.length && i.ks.k.c && !cut) { const x = v.reduce((s, q) => s + q[0], 0) / v.length, y = v.reduce((s, q) => s + q[1], 0) / v.length; stars.push({ L: L.nm, li, x, y, r: Math.max(...v.map(q => Math.hypot(q[0] - x, q[1] - y))), op: op * num(val(fl[0].o, t, 100)) / 100, c: fl[0].c.sid }); }
            if (sk.length && !cut) lines.push({ L: L.nm, li, v, op: op * num(val(sk[0].o, t, 100)) / 100, w: num(val(sk[0].w, t, 1)) * Math.hypot(M[0], M[1]) });
          }
          if (i.ty === 'el' && fl.length && fl[0].c.sid === 'bgColor') { const p = ap(M, i.p.k); discs.push({ L: L.nm, li, x: p[0], y: p[1], r: i.s.k[0] / 2 * Math.hypot(M[0], M[1]), op }); }
        });
      };
      const lk = L.ks, p3 = val(lk.p, t), a3 = val(lk.a, t), s3 = val(lk.s, t);
      walk(L.shapes, mat({ p: st(p3.slice(0, 2)), a: st(a3.slice(0, 2)), s: st(s3.slice(0, 2)), r: lk.r }, t), num(val(lk.o, t, 100)) / 100, [], []);
    });
    return { stars, lines, discs };
  };
  const load = (dir, n) => { const f = path.join(PLAYER, 'public', 'projects', dir, `scene-${n}`, 'lottie.json'); return { j: JSON.parse(fs.readFileSync(f, 'utf8')), bytes: fs.statSync(f).size }; };
  console.log('\n--- verify (from the baked JSON) ---');
  const OKT = ['gr', 'sh', 'el', 'rc', 'fl', 'st', 'tm', 'tr'], TRK = ['p', 'a', 's', 'r', 'o', 'sk', 'sa'];
  Object.values(THEMES).forEach(th => [1, 2, 3, 4].forEach(n => {
    const { j, bytes } = load(th.dir, n), errs = [], tys = new Set(), sids = new Set();
    let nKeys = 0, nTr = 0;
    ['v', 'fr', 'ip', 'op', 'w', 'h', 'nm', 'ddd', 'assets', 'layers', 'slots'].forEach(k => { if (!(k in j)) errs.push('missing ' + k); });
    if (j.w !== W || j.h !== H || j.fr !== FR) errs.push('size/fps');
    if (j.layers[j.layers.length - 1].nm !== 'background') errs.push('background not last');
    if (bytes > LIMIT) errs.push(`size ${bytes} B > ${LIMIT}`);
    const scan = (o, where) => {
      if (Array.isArray(o)) { o.forEach(x => scan(x, where)); return; }
      if (!o || typeof o !== 'object') return;
      if ('x' in o && typeof o.x === 'string') errs.push('expression at ' + where);
      ['ef', 'masksProperties', 'tt', 'td', 'refId', 'hasMask'].forEach(k => { if (k in o) errs.push(k + ' at ' + where); });
      if (o.ty === 'tr') { nTr++; const miss = TRK.filter(k => !(k in o)); if (miss.length) errs.push(`tr without ${miss.join(',')} at ${where}`); }
      if (o.ty === 'sh') { const k = o.ks.k; if (!(k.i.length === k.v.length && k.o.length === k.v.length)) errs.push('sh i/o/v length at ' + where); }
      if (o.a === 1 && Array.isArray(o.k)) o.k.forEach((k, i, a) => {
        nKeys++;
        if (!Number.isInteger(k.t) || k.t > j.op || (i && k.t <= a[i - 1].t)) errs.push('bad key t ' + k.t + ' at ' + where);
        if (i < a.length - 1 && !k.h && (!k.o || !k.i)) errs.push('key without tangents at ' + where);
      });
      if (typeof o.ty === 'string') tys.add(o.ty);
      if (o.sid && typeof o.sid === 'string') sids.add(o.sid);
      Object.keys(o).forEach(k => scan(o[k], where + '.' + k));
    };
    j.layers.forEach(L => { if (L.ty !== 4) errs.push('layer type ' + L.ty); scan(L.shapes, L.nm); scan(L.ks, L.nm + '.ks'); });
    [...sids].forEach(sd => { if (!j.slots[sd]) errs.push('no slot ' + sd); });
    const bad = [...tys].filter(t => !OKT.includes(t));
    console.log(`lint ${th.dir}/scene-${n}: ${errs.length + bad.length ? 'FAIL ' + [...new Set(errs)].slice(0, 4).join('; ') + ' ' + bad.join(',') : 'ok'} · ${bytes} B (${LIMIT - bytes} under the cap) · ${j.layers.length} layers · items ${[...tys].sort().join(' ')} · ${nTr} transforms, all canonical · slots ${[...sids].sort().join(' ')} · ${nKeys} keys`);
  }));
  const key4 = s => `${s.x.toFixed(1)},${s.y.toFixed(1)}`;
  Object.values(THEMES).forEach(th => {
    const j1 = load(th.dir, 1).j, A = frameOf(j1, OP1 - 1), Bs = [2, 3].map(n => frameOf(load(th.dir, n).j, 0));
    const ink = F => F.stars.filter(s => s.c === 'ink' && s.op > 0.01 && s.r > 0.05), acc = F => F.stars.filter(s => s.c === 'accent' && s.op > 0.01 && s.r > 0.05);
    Bs.forEach((B, i) => {
      const a = ink(A).map(key4).sort(), b = ink(B).map(key4).sort();
      const same = a.length === b.length && a.every((k, q) => k === b[q]);
      const ma = acc(A).map(key4).sort().join(' '), mb = acc(B).map(key4).sort().join(' ');
      const da = A.discs.filter(d => d.op > 0.01).map(key4).sort().join(' '), db = B.discs.filter(d => d.op > 0.01).map(key4).sort().join(' ');
      const la = A.lines.filter(l => l.op > 0.01).length, lb = B.lines.filter(l => l.op > 0.01).length;
      console.log(`continuity ${th.dir} scene-1 f${OP1 - 1} → scene-${i + 2} f0: ${a.length}/${b.length} agents ${same ? 'identical' : 'DIFFER'} · roster marks ${ma === mb ? 'identical' : 'DIFFER'} · knockouts ${da === db ? 'identical' : 'DIFFER'} · visible hairlines ${la}/${lb}`);
    });
    if (th.name !== 'Night') return;
    const R = ink(A);
    console.log(`scene-1 f${OP1 - 1}: ${R.length} agents settled, x ${Math.min(...R.map(s => s.x)).toFixed(1)}…${Math.max(...R.map(s => s.x)).toFixed(1)} y ${Math.min(...R.map(s => s.y)).toFixed(1)}…${Math.max(...R.map(s => s.y)).toFixed(1)} · visible at f20: ${ink(frameOf(j1, 20)).length} · marks settled by f${Math.max(...Object.values({ FI: 206, JP: 216, US: 224 }))}, held ${OP1 - 1 - 224} frames`);
    // knockouts: every disc layer sits under the hairline layer and over every agent layer; what each disc clears
    const iB = j1.layers.findIndex(l => l.nm === 'borders'), iD = j1.layers.map((l, i) => (l.nm.endsWith('knockout') ? i : -1)).filter(i => i >= 0), iR = j1.layers.map((l, i) => (l.nm.startsWith('row') ? i : -1)).filter(i => i >= 0);
    const order = iD.every(i => i > iB && i < Math.min(...iR));
    A.discs.forEach(d => {
      const under = R.filter(s => Math.hypot(s.x - d.x, s.y - d.y) < d.r).length;
      const hair = A.lines.filter(l => l.L === 'borders' && l.op > 0.01).reduce((a, l) => a + l.v.filter(q => Math.hypot(q[0] - d.x, q[1] - d.y) < d.r).length, 0);
      console.log(`  ${d.L}: r ${r1(d.r)} px at (${r1(d.x)}, ${r1(d.y)}) · clears ${under} agents · ${hair} hairline vertices inside it stay drawn above it · layer order ${order ? 'ok (under borders, over agents)' : 'WRONG'}`);
    });
    [2, 3].forEach(n => {
      const j = load('northstar-world', n).j;
      [100, 112, 124, 150, 210, 299].forEach(t => {
        const Fr = frameOf(j, t), w = Fr.stars.filter(s => s.L === 'world · agents' && s.op > 0.005), m = Fr.stars.filter(s => s.L.includes('LAEA') && s.op > 0.005), ins = Fr.stars.filter(s => s.L.includes('insets') && s.op > 0.005);
        const wl = Fr.lines.filter(l => l.L === 'world · hairlines' && l.op > 0.005), mb = m.length ? bboxOf(m.map(s => [s.x, s.y])) : null;
        console.log(`  scene-${n} f${t}: world agents ${w.length} (max op ${w.length ? Math.max(...w.map(s => s.op)).toFixed(2) : 0}, max r ${w.length ? Math.max(...w.map(s => s.r)).toFixed(1) : 0} px) · world hairlines ${wl.length} (w ${wl.length ? Math.max(...wl.map(l => l.w)).toFixed(2) : 0} px) · map agents ${m.length} at op ${m.length ? m[0].op.toFixed(2) : 0}${mb ? ` in x ${mb[0].toFixed(0)}…${mb[2].toFixed(0)} y ${mb[1].toFixed(0)}…${mb[3].toFixed(0)}` : ''}${ins.length ? ` · inset agents ${ins.length} at op ${ins[0].op.toFixed(2)}` : ''}`);
      });
      // every drawn segment of the held map: nothing longer than the sampling step except the map's own coast
      const Fe = frameOf(j, 299), mapL = Fe.lines.filter(l => l.L.includes('LAEA') && l.op > 0.005);
      const parL = mapL.filter(l => l.op < 0.3), segMax = l => Math.max(...l.v.slice(1).map((q, i) => Math.hypot(q[0] - l.v[i][0], q[1] - l.v[i][1])));
      console.log(`  scene-${n} f299: ${parL.length} parallel runs, longest step ${parL.length ? r1(Math.max(...parL.map(segMax))) : 0} px, lowest y ${parL.length ? r1(Math.max(...parL.flatMap(l => l.v.map(q => q[1])))) : '-'} · map rings ${mapL.length - parL.length}`);
    });
  });
  {
    // ns-earth: seam and rig accuracy
    const j = load('northstar-world', 4).j, om = TAU / OPG, F0 = frameOf(j, 0), F1 = frameOf(j, OPG);
    const ag = F => F.stars.filter(s => s.L === 'agents');
    const a0 = ag(F0), a1 = ag(F1);
    let dp0 = 0, dop = 0, dr = 0;
    a0.forEach((s, i) => { const q = a1[i]; dp0 = Math.max(dp0, Math.hypot(s.x - q.x, s.y - q.y)); dop = Math.max(dop, Math.abs(s.op - q.op)); dr = Math.max(dr, Math.abs(s.r - q.r)); });
    console.log(`ns-earth seam f0 vs f${OPG}: ${a0.length}/${a1.length} agents · max |Δposition| ${dp0.toExponential(2)} px · max |Δopacity| ${dop.toExponential(2)} · max |Δradius| ${dr.toExponential(2)} px`);
    const floor = THEMES.night.floor;
    const iF = j.layers.findIndex(l => l.nm === 'meridian · front'), iA = j.layers.findIndex(l => l.nm === 'agents'), iK = j.layers.findIndex(l => l.nm === 'meridian · far');
    console.log(`  layer order: meridian front (${iF}) over agents (${iA}) over meridian far (${iK}) · ${iF < iA && iA < iK ? 'ok' : 'WRONG'} · limb ${OP_LIMB} %`);
    [0, 137, 360, 611].forEach(t => {
      const A = ag(frameOf(j, t));
      let eN = 0, eF = 0, eO = 0, nN = 0, oLo = 1, oHi = 0, over = 0;
      A.forEach((s, i) => {
        const g = G_EMIT[i], ri = GR * Math.cos(g.la * D2R), ps = g.psi + om * t;
        const X = GC[0] + ri * Math.sin(ps), Y = GC[1] - GR * Math.sin(g.la * D2R) * CA + KQ * ri * Math.cos(ps);
        const z = GR * Math.sin(g.la * D2R) * Math.sin(ALPHA) + CA * ri * Math.cos(ps), d = (z + GR) / (2 * GR), e = Math.hypot(s.x - X, s.y - Y);
        if (z >= 0) { eN = Math.max(eN, e); nN++; } else eF = Math.max(eF, e);
        eO = Math.max(eO, Math.abs(100 * s.op - (floor + (96 - floor) * d)));
        oLo = Math.min(oLo, s.op); oHi = Math.max(oHi, s.op);
      });
      // unsorted near-over-far: far agents drawn above an overlapping near agent
      const pos = A.map((s, i) => ({ s, i, z: (() => { const g = G_EMIT[i], ri = GR * Math.cos(g.la * D2R); return GR * Math.sin(g.la * D2R) * Math.sin(ALPHA) + CA * ri * Math.cos(g.psi + om * t); })() }));
      pos.forEach(a => { if (a.z >= 0) return; if (pos.some(b => b.z >= 0 && b.i > a.i && Math.hypot(a.s.x - b.s.x, a.s.y - b.s.y) < 0.8 * (a.s.r + b.s.r))) over++; });
      console.log(`  f${t}: ${nN} near / ${A.length - nN} far · position error vs analytic: near ≤ ${eN.toFixed(2)} px, far ≤ ${eF.toFixed(2)} px · opacity ${(100 * oLo).toFixed(0)}…${(100 * oHi).toFixed(0)} %, error ≤ ${eO.toFixed(1)} pts · far agents painted over an overlapping near one: ${over}`);
    });
  }
}
module.exports = { GROWS, GC, GR, ALPHA, FACE, OPG, MARK, MAPS };
