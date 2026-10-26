/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar 3D star-field forms → <player>/public/projects/northstar-3d/scene-N/
// node build-lottie-3d.js <player-dir>
//
// Every form is a point cloud of agent-stars, projected in perspective per frame and baked to
// keyframes. Depth is carried by size and opacity only (ink, never a second hue). Glacier marks the
// north star alone. Projection is sampled on a 10-frame grid with linear keys; a grid key is dropped
// only when linear interpolation between its neighbours reproduces every per-frame sample within tol.
// Each scene is a 240 f seamless loop: rotations advance by one symmetry step of the form per loop.
// Draw order follows true depth every frame: where an agent or cube edge changes side during the loop
// it has one copy per layer, switched by hold-key opacity (toggle()), so f0 and f240 draw identically.
// node build-lottie-3d.js <player-dir> --verify re-reads the baked JSON and checks seams, lint, extents.
const fs = require('fs');
const path = require('path');

if (!process.argv[2]) { console.error('usage: node build-lottie-3d.js <player-dir>'); process.exit(1); }
const out = path.join(process.argv[2], 'public', 'projects', 'northstar-3d');
fs.rmSync(out, { recursive: true, force: true });
const FR = 60, W = 960, H = 540, OP = 240, STEP = 10, D2R = Math.PI / 180, TAU = 2 * Math.PI;

// ---- helpers (style of build-lottie-hero.js) --------------------------------------------------
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
const E = { settle: [0, 0.65, 0.51, 0.99], enter: [0.2, 0.75, 0.34, 0.94], travel: [1, 0.49, 0, 0.55], exit: [1, 0.02, 0.54, 0.42], linear: [0, 0, 1, 1] };
const r1 = v => Math.round(v * 10) / 10;
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
const ellipse = (d, p = [0, 0]) => ({ ty: 'el', p: st(p.map(r2)), s: st([r2(d), r2(d)]), d: 1 });
const rect = (w, h) => ({ ty: 'rc', p: st([0, 0]), s: st([w, h]), r: st(0), d: 1 });
const stroke = (sid, w, o = 100) => ({ ty: 'st', c: { sid }, o: st(o), w: st(w), lc: 1, lj: 1, ml: 4 });
const fill = (sid, o = 100) => ({ ty: 'fl', c: { sid }, o: st(o), r: 1 });
const group = (items, t) => ({ ty: 'gr', nm: 'g', it: [...items, t || tr()] });
const layer = (nm, shapes, op, ks = {}) => ({
  ddd: 0, ty: 4, nm, sr: 1, ip: 0, op, st: 0, bm: 0,
  ks: { o: ks.o || st(100), r: ks.r || st(0), p: ks.p || st([0, 0, 0]), a: st([0, 0, 0]), s: ks.s || st([100, 100, 100]) },
  shapes,
});
const pol = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
const starPts = (R, r = R * 0.27, cx = 0, cy = 0) => Array.from({ length: 8 }, (_, i) => { const [x, y] = pol(i % 2 ? r : R, i * 45); return [cx + x, cy + y]; });
const background = op => layer('background', [group([rect(W * 2, H * 2), fill('bgColor')])], op, { p: st([W / 2, H / 2, 0]) });
const stats = {};
function scene(n, nm, op, layers, note) {
  const dir = path.join(out, `scene-${n}`);
  fs.mkdirSync(dir, { recursive: true });
  const json = { v: '5.12.0', fr: FR, ip: 0, op, w: W, h: H, nm, ddd: 0, assets: [], slots: SLOTS, layers };
  const txt = JSON.stringify(json);
  fs.writeFileSync(path.join(dir, 'lottie.json'), txt);
  fs.writeFileSync(path.join(dir, 'controls.json'), JSON.stringify({ controls: CONTROLS }, null, 2));
  console.log(`scene-${n}`, nm, (txt.length / 1024).toFixed(0) + ' KB', layers.length + ' layers', note || '');
}

// ---- 3D: same conventions as CSS transforms (x right, y down, z toward the viewer) --------------
const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]; };
const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]]; };
const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] - s * p[1], s * p[0] + c * p[1], p[2]]; };
const project = (p, cx, cy, D) => { const s = D / (D - p[2]); return [cx + p[0] * s, cy + p[1] * s, s]; };
const clamp01 = v => Math.max(0, Math.min(1, v));
// Depth cue, shared with the canvas previews: d = 0 far … 1 near.
const cue = (z, R) => { const d = clamp01((z + R) / (2 * R)); return { k: 0.7 + 0.3 * d, o: 16 + 80 * d }; };

// Linear keys on the 10-frame grid; drop a grid key when interpolation reproduces all samples within tol.
const LO = { x: [0], y: [0] }, LI = { x: [1], y: [1] };
function gridKeys(samples, tol) {
  const keys = [0]; let i = 0;
  while (i < OP) {
    let best = Math.min(i + STEP, OP);
    for (let j = i + STEP; j <= OP; j += STEP) {
      let ok = true;
      for (let t = i + 1; t < j && ok; t++) {
        const u = (t - i) / (j - i);
        for (let d = 0; d < samples[t].length; d++) {
          if (Math.abs(samples[i][d] + (samples[j][d] - samples[i][d]) * u - samples[t][d]) > tol) { ok = false; break; }
        }
      }
      if (ok) best = j; else break;
    }
    keys.push(best); i = best;
  }
  return keys;
}
let keyCount = 0, propCount = 0;
const r0 = v => Math.round(v);
function sampled(samples, tol, scalar = false, round = r1) {
  const ks = gridKeys(samples, tol);
  const vals = ks.map(t => samples[t].map(round));
  propCount++;
  if (vals.every(v => v.every((x, d) => x === vals[0][d]))) { keyCount += 1; return st(scalar ? vals[0][0] : vals[0]); }
  keyCount += ks.length;
  return { a: 1, k: ks.map((t, i) => (i < ks.length - 1 ? { t, s: vals[i], o: LO, i: LI } : { t, s: vals[i] })) };
}
const frames = Array.from({ length: OP + 1 }, (_, t) => t);
// Layer membership that follows true depth. Lottie cannot re-order layers, so an element whose side
// changes during the loop gets one copy in each layer; a 0/100 hold-key opacity shows the copy on its
// current side. Membership is a pure function of position, so f0 and f240 draw identically even though
// the loop swaps identities.
function toggle(vis) {
  if (vis.every(v => v === vis[0])) return st(vis[0] ? 100 : 0);
  const k = [{ t: 0, s: [vis[0] ? 100 : 0], h: 1 }];
  for (let t = 1; t <= OP; t++) if (vis[t] !== vis[t - 1]) k.push({ t, s: [vis[t] ? 100 : 0], h: 1 });
  if (k[k.length - 1].t !== OP) k.push({ t: OP, s: [vis[OP] ? 100 : 0] });
  delete k[k.length - 1].h;
  return { a: 1, k };
}
// While a copy is hidden for whole 10-frame cells, replace its samples by the straight line between the
// bordering grid keys: the hidden stretch then costs no extra keys, and visible frames are untouched.
function holdHidden(samples, vis) {
  if (!vis) return samples;
  const out = samples.map(s => s.slice()), nCell = OP / STEP;
  const hidden = m => { for (let t = m * STEP; t <= (m + 1) * STEP; t++) if (vis[t]) return false; return true; };
  for (let m = 0; m < nCell;) {
    if (!hidden(m)) { m++; continue; }
    let e = m; while (e + 1 < nCell && hidden(e + 1)) e++;
    const A = m * STEP, B = (e + 1) * STEP;
    for (let t = A + 1; t < B; t++) { const u = (t - A) / (B - A); out[t] = samples[A].map((v, d) => v + (samples[B][d] - v) * u); }
    m = e + 1;
  }
  return out;
}
// One agent-star: shape at origin, transform carries projected position, depth scale and depth opacity.
// Scale and opacity keys are whole percent (0.5 % of a 3 px star is 0.02 px); position keeps 0.1 px.
// With vis, the star is one side's copy and sits inside a group carrying its hold-key toggle.
function agent(R0, track, tol = { p: 0.2, s: 0.6, o: 0.9 }, vis = null) {
  const P = holdHidden(track.map(f => [f.x, f.y]), vis), S = holdHidden(track.map(f => [f.k, f.k]), vis), O = holdHidden(track.map(f => [f.o]), vis);
  const g = { ty: 'gr', nm: 'a', it: [poly(starPts(R0)), fill('ink'), { ty: 'tr', p: sampled(P, tol.p), a: st([0, 0]), s: sampled(S, tol.s, false, r0), r: st(0), o: sampled(O, tol.o, true, r0), sk: st(0), sa: st(0) }] };
  return vis ? { ty: 'gr', nm: 'side', it: [g, tr({ o: toggle(vis) })] } : g;
}
// Split by the sign of a per-frame depth value: [near copies], [far copies], and how many have both.
function bySide(track, z, tol) {
  const vis = z.map(v => v >= 0);
  if (vis.every(v => v)) return { near: [agent(track.R0, track.f, tol)], far: [], cross: 0 };
  if (vis.every(v => !v)) return { near: [], far: [agent(track.R0, track.f, tol)], cross: 0 };
  return { near: [agent(track.R0, track.f, tol, vis)], far: [agent(track.R0, track.f, tol, vis.map(v => !v))], cross: 1 };
}
const bounds = () => ({ x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, add(x, y, r) { this.x0 = Math.min(this.x0, x - r); this.x1 = Math.max(this.x1, x + r); this.y0 = Math.min(this.y0, y - r); this.y1 = Math.max(this.y1, y + r); }, str() { return `bbox x ${r1(this.x0)}…${r1(this.x1)} y ${r1(this.y0)}…${r1(this.y1)}`; } });
// Split a closed/open 3D polyline into front (z >= 0) and back runs, projected.
function splitRuns(pts3, cx, cy, D, closed = true) {
  const runs = { front: [], back: [] };
  let cur = null, side = null;
  const n = pts3.length, lim = closed ? n + 1 : n;
  for (let i = 0; i < lim; i++) {
    const p = pts3[i % n], sd = p[2] >= 0 ? 'front' : 'back', q = project(p, cx, cy, D);
    if (sd !== side) { if (cur) { cur.push([q[0], q[1]]); runs[side].push(cur); } cur = []; side = sd; }
    cur.push([q[0], q[1]]);
  }
  if (cur && cur.length > 1) runs[side].push(cur);
  return runs;
}
const runShapes = runs => runs.filter(r => r.length > 1).map(r => poly(r, false));
// Fibonacci sphere restricted to one longitude sector, copied k times: a k-fold symmetric, near-even
// sphere, so a turn of 360/k degrees per loop seams invisibly.
function sectorFib(N, k, cap) {
  const ga = Math.PI * (3 - Math.sqrt(5)), sec = TAU / k, pts = [];
  for (let i = 0; i < N; i++) {
    const yv = 1 - 2 * (i + 0.5) / N;
    if (yv > cap.north || yv < -cap.south) continue;
    const lon = (i * ga) % TAU;
    if (lon >= sec) continue;
    for (let j = 0; j < k; j++) pts.push([lon + j * sec, yv]);
  }
  return pts;
}
function nnStats(p3) {
  const d = p3.map((a, i) => Math.min(...p3.map((b, j) => (i === j ? 1e9 : Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])))));
  return `nn min ${r1(Math.min(...d))} mean ${r1(d.reduce((s, v) => s + v, 0) / d.length)}`;
}

// ================================================================================================
// 1 · ns-globe — the frame of reference. A Fibonacci sphere of agents turns about the polar axis
//     under a fixed meridian, equator and bezel; the north star holds the pole.
{
  keyCount = 0; propCount = 0;
  const cx = 480, cy = 286, R = 184, D = 1300, tilt = -16 * D2R, R0 = 3.5, ls = [], bb = bounds();
  const pts = sectorFib(208, 8, { north: 0.955, south: 0.985 }).map(([lon, yv]) => { const r = Math.sqrt(1 - yv * yv); return [R * r * Math.sin(lon), -R * yv, R * r * Math.cos(lon)]; });
  const at = (p, t) => rotX(rotY(p, (TAU / 8) * t / OP), tilt);
  // Near (z >= 0) agents draw over the near hairlines, far ones under them, decided every frame.
  const groups = { front: [], back: [] };
  let nCross = 0, zSeam = 1e9;
  pts.forEach(p0 => {
    const z = [];
    const track = frames.map(t => { const p = at(p0, t), [x, y, s] = project(p, cx, cy, D), c = cue(p[2], R); z.push(p[2]); bb.add(x, y, R0 * s * c.k); return { x, y, k: 100 * s * c.k, o: c.o }; });
    zSeam = Math.min(zSeam, Math.abs(z[0]), Math.abs(z[OP]));
    const sd = bySide({ R0, f: track }, z);
    groups.front.push(...sd.near); groups.back.push(...sd.far); nCross += sd.cross;
  });
  const fixed = p => rotX(p, tilt);
  const ring = f => Array.from({ length: 120 }, (_, i) => fixed(f(TAU * i / 120)));
  const eq = splitRuns(ring(u => [R * Math.cos(u), 0, R * Math.sin(u)]), cx, cy, D);
  const mu = 38 * D2R;
  const mer = splitRuns(ring(v => [R * Math.sin(v) * Math.sin(mu), -R * Math.cos(v), R * Math.sin(v) * Math.cos(mu)]), cx, cy, D);
  const pole = project(fixed([0, -R, 0]), cx, cy, D), south = project(fixed([0, R, 0]), cx, cy, D);
  const rSil = R * D / Math.sqrt(D * D - R * R), rB = rSil + 16;
  const ticks = [];
  for (let a = 0; a < 360; a += 10) { const L = a % 90 ? 4 : 9; const [x0, y0] = pol(rB, a), [x1, y1] = pol(rB + L, a); ticks.push(poly([[cx + x0, cy + y0], [cx + x1, cy + y1]], false)); }
  ls.push(layer('north star', [group([poly(starPts(12)), fill('accent')])], OP, { p: st([r2(pole[0]), r2(pole[1]), 0]) }));
  ls.push(layer('agents · near', groups.front, OP));
  // The polar axis runs inside the sphere: in front of the far agents, behind the near ones.
  ls.push(layer('axis', [group([poly([[cx, cy], [pole[0], pole[1]]], false), poly([[cx, pole[1] - 16], [cx, cy - rB - 14]], false), stroke('muted', 1, 70)]), group([poly([[cx, cy], [south[0], south[1]]], false), stroke('muted', 1, 22)])], OP));
  ls.push(layer('hairlines · near', [group([...runShapes(eq.front), ...runShapes(mer.front), stroke('muted', 1, 55)])], OP));
  ls.push(layer('agents · far', groups.back, OP));
  ls.push(layer('hairlines · far', [group([...runShapes(eq.back), ...runShapes(mer.back), stroke('muted', 1, 22)])], OP));
  ls.push(layer('bezel', [group([ellipse(2 * rB, [cx, cy]), stroke('muted', 1, 30)]), group([...ticks, stroke('muted', 1, 55)])], OP));
  ls.push(background(OP));
  scene(1, 'ns-globe · frame of reference · loop', OP, ls, `${pts.length} agents (${nCross} cross the limb and have a copy per side: near layer ${groups.front.length}, far layer ${groups.back.length}) · min |z| at seam ${r2(zSeam)} · ${nnStats(pts)} · keys/prop ${(keyCount / propCount).toFixed(1)} · ${bb.str()} · bezel r ${r1(rB)}`);
  stats.globe = { n: pts.length };
}

// ================================================================================================
// 2 · ns-lattice — the quota-exact roster. A 6 × 6 × 6 lattice turns 90° per loop about its vertical
//     axis (one symmetry step) and nods ±10° about the horizontal axis; hairline bounding cube.
{
  keyCount = 0; propCount = 0;
  const n = 6, sp = 38, half = (n - 1) * sp / 2, cube = half + 20, cx = 480, cy = 292, D = 1400, R0 = 3.3, ls = [], bb = bounds();
  const Rd = Math.sqrt(3) * half;
  const at = (p, t) => rotX(rotY(p, 24 * D2R + (TAU / 4) * t / OP), (-20 + 10 * Math.sin(TAU * t / OP)) * D2R);
  const stars = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    const p0 = [i * sp - half, j * sp - half, k * sp - half];
    const track = frames.map(t => { const p = at(p0, t), [x, y, s] = project(p, cx, cy, D), c = cue(p[2], Rd); bb.add(x, y, R0 * s * c.k); return { x, y, k: 100 * s * c.k, o: c.o }; });
    stars.push(agent(R0, track, { p: 0.35, s: 0.8, o: 1.2 }));
  }
  const C = [-cube, cube], corners = [];
  C.forEach(x => C.forEach(y => C.forEach(z => corners.push([x, y, z]))));
  const edges = [];
  corners.forEach((a, i) => corners.forEach((b, j) => { if (j > i && [0, 1, 2].filter(d => a[d] !== b[d]).length === 1) edges.push([a, b]); }));
  // An edge lies in front of the lattice when at least one of its two faces turns toward the eye
  // (a convex cube: a front face is nearer than every interior point behind it). Decided every frame.
  const eye = [0, 0, D];
  const faceFront = (n, t) => { const nn = at(n, t), f = at(n.map(v => v * cube), t); return nn[0] * (eye[0] - f[0]) + nn[1] * (eye[1] - f[1]) + nn[2] * (eye[2] - f[2]); };
  const edgeFront = { front: [], back: [] };
  let nSwitch = 0, faceSeam = 1e9;
  const edgeShape = (smp, vis) => {
    const s2 = holdHidden(smp, vis), ks = gridKeys(s2, 0.25);
    const sh = { ty: 'sh', d: 1, ks: { a: 1, k: ks.map((t, i) => { const v = s2[t].map(r1), shp = [{ i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]], v: [[v[0], v[1]], [v[2], v[3]]], c: false }]; return i < ks.length - 1 ? { t, s: shp, o: LO, i: LI } : { t, s: shp }; }) } };
    return group([sh, stroke('muted', 1, 38)], tr({ o: toggle(vis) }));
  };
  edges.forEach(([a, b]) => {
    const smp = frames.map(t => { const pa = project(at(a, t), cx, cy, D), pb = project(at(b, t), cx, cy, D); bb.add(pa[0], pa[1], 0); return [pa[0], pa[1], pb[0], pb[1]]; });
    const faces = [0, 1, 2].filter(d => a[d] === b[d]).map(d => { const n = [0, 0, 0]; n[d] = Math.sign(a[d]); return n; });
    const vis = frames.map(t => faces.some(n => { const v = faceFront(n, t); if (t === 0 || t === OP) faceSeam = Math.min(faceSeam, Math.abs(v)); return v > 0; }));
    if (vis.some(v => v)) edgeFront.front.push(edgeShape(smp, vis));
    if (vis.some(v => !v)) edgeFront.back.push(edgeShape(smp, vis.map(v => !v)));
    if (vis.some(v => v) && vis.some(v => !v)) nSwitch++;
  });
  ls.push(layer('north star', [group([poly(starPts(11)), fill('accent')])], OP, { p: st([cx, 40, 0]) }));
  ls.push(layer('meridian', [group([poly([[cx, 58], [cx, 84]], false), stroke('muted', 1, 55)])], OP));
  ls.push(layer('cube · front edges', edgeFront.front, OP));
  ls.push(layer('agents', stars, OP));
  ls.push(layer('cube · back edges', edgeFront.back, OP));
  ls.push(background(OP));
  scene(2, 'ns-lattice · quota-exact roster · loop', OP, ls, `${stars.length} agents · 12 edges (${nSwitch} change side; front layer ${edgeFront.front.length}, back layer ${edgeFront.back.length}) · min |face test| at seam ${r1(faceSeam)} · keys/prop ${(keyCount / propCount).toFixed(1)} · ${bb.str()}`);
  stats.lattice = { n: stars.length };
}

// ================================================================================================
// 3 · ns-gyroscope — instrument calibration. Three tilted rings of agents turn in their own planes
//     around a fixed hub; each ring advances exactly one star-step per loop.
{
  keyCount = 0; propCount = 0;
  const cx = 480, cy = 272, D = 1400, R0 = 3.4, ls = [], bb = bounds();
  const rings = [
    { r: 122, n: 18, dir: 1, o: p => rotX(p, 68 * D2R) },
    { r: 168, n: 24, dir: -1, o: p => rotY(rotX(p, 16 * D2R), 62 * D2R) },
    { r: 214, n: 30, dir: 1, o: p => rotZ(rotX(p, 62 * D2R), -32 * D2R) },
  ];
  const Rd = 214;
  // Every agent sits on its own orbit, so all orbit hairlines draw under all agents: a star always
  // covers its ring, and agent-over-agent order is moot (one ink, and same-colour alpha commutes).
  const agents = [], hair = { front: [], back: [] };
  rings.forEach(g => {
    for (let k = 0; k < g.n; k++) {
      const u0 = TAU * k / g.n;
      const track = frames.map(t => { const u = u0 + g.dir * (TAU / g.n) * t / OP, p = g.o([g.r * Math.cos(u), g.r * Math.sin(u), 0]), [x, y, s] = project(p, cx, cy, D), c = cue(p[2], Rd); bb.add(x, y, R0 * s * c.k); return { x, y, k: 100 * s * c.k, o: c.o }; });
      agents.push(agent(R0, track));
    }
    const runs = splitRuns(Array.from({ length: 144 }, (_, i) => { const u = TAU * i / 144; return g.o([g.r * Math.cos(u), g.r * Math.sin(u), 0]); }), cx, cy, D);
    hair.front.push(...runShapes(runs.front)); hair.back.push(...runShapes(runs.back));
  });
  const hubTicks = [];
  for (let a = 0; a < 360; a += 30) { const [x0, y0] = pol(30, a), [x1, y1] = pol(a ? 34 : 40, a); hubTicks.push(poly([[x0, y0], [x1, y1]], false)); }
  ls.push(layer('north star', [group([poly(starPts(13)), fill('accent')], tr({ s: anim([[0, [100, 100], 'travel'], [120, [110, 110], 'travel'], [OP, [100, 100]]]) }))], OP, { p: st([cx, cy, 0]) }));
  ls.push(layer('hub', [group([ellipse(60), stroke('muted', 1, 55)]), group([...hubTicks, stroke('muted', 1, 70)])], OP, { p: st([cx, cy, 0]) }));
  ls.push(layer('agents', agents, OP));
  ls.push(layer('orbits · near', [group([...hair.front, stroke('muted', 1, 42)])], OP));
  ls.push(layer('orbits · far', [group([...hair.back, stroke('muted', 1, 18)])], OP));
  ls.push(layer('meridian', [group([poly([[cx, 18], [cx, cy - 44]], false), stroke('muted', 1, 45)])], OP));
  ls.push(background(OP));
  const total = agents.length;
  scene(3, 'ns-gyroscope · calibration · loop', OP, ls, `${total} agents in one layer over the orbits · keys/prop ${(keyCount / propCount).toFixed(1)} · ${bb.str()}`);
  stats.gyro = { n: total };
}

// ================================================================================================
// 4 · ns-terrain — the population as one continuous body. A 30 × 16 surface of agents with a gentle
//     height field; a swell travels toward the viewer one wavelength per loop while the camera drifts
//     on a small ellipse. Each row shares one depth, so each row is one layer carrying its own
//     projected drift and swell (parallax: near rows travel further than far rows).
{
  const cols = 30, rows = 16, dx = 22, dy = 30, alpha = 50 * D2R, D = 900, cx = 480, cy = 300, R0 = 3.1, ls = [], bb = bounds();
  const hw = (cols - 1) * dx / 2, hd = (rows - 1) * dy / 2, Zr = Math.sin(alpha) * hd, lambda = 8 * dy, A = 6;
  const g2 = (x, y, mx, my, sx, sy) => Math.exp(-((x - mx) ** 2) / (2 * sx * sx) - ((y - my) ** 2) / (2 * sy * sy));
  // The height field is defined on a ±362.5 × ±225 grid, shared with the canvas preview; the bake
  // samples it on a narrower grid so the drifting field keeps a clear margin to both frame edges.
  const hF = (x, y) => 34 * g2(x, y, -110, -30, 150, 110) + 20 * g2(x, y, 200, 70, 120, 90) - 10 * g2(x, y, 60, -120, 140, 70) + 4 * Math.sin(x / 70 + y / 110);
  const h0 = (x, y) => hF(x * 362.5 / hw, y);
  const rowBox = [];
  const swell = (y, t) => A * Math.sin(TAU * t / OP - TAU * y / lambda);
  const cam = t => [24 * Math.sin(TAU * t / OP), 6 * Math.cos(TAU * t / OP)];
  // local (x, y = depth, h = height) → rotateX(alpha) → camera shift → project
  const place = (x, y, h, c = [0, 0]) => { const p = rotX([x, y, h], alpha); return project([p[0] - c[0], p[1] - c[1], p[2]], cx, cy, D); };
  for (let r = 0; r < rows; r++) {
    const y = r * dy - hd;                          // r = 0 far … rows-1 near
    const zRow = rotX([0, y, 0], alpha)[2], c0 = cue(zRow, Zr);
    const hs = Array.from({ length: cols }, (_, c) => h0(c * dx - hw, y)), hMean = hs.reduce((s, v) => s + v, 0) / cols;
    const base = place(0, y, hMean);
    const bands = new Map(), rb = bounds();
    hs.forEach((h, c) => {
      const x = c * dx - hw, [px, py, s] = place(x, y, h), R = R0 * s * c0.k;
      bb.add(px, py, R); rb.add(px, py, R);
      // Fill floor 24 % × row-wave trough 72 % keeps every agent at 17 % or more: dim, never gone.
      const o = Math.max(24, Math.round(Math.min(98, c0.o + 0.5 * (h - hMean)) / 6) * 6);
      if (!bands.has(o)) bands.set(o, []);
      bands.get(o).push(poly(starPts(R, R * 0.27, px, py)));
    });
    const P = frames.map(t => { const q = place(0, y, hMean + swell(y, t), cam(t)); return [q[0] - base[0], q[1] - base[1], 0]; });
    const O = frames.map(t => [86 + 14 * Math.sin(TAU * t / OP - TAU * y / lambda)]);
    rowBox.push({ rb, P });
    let maxShift = 0; P.forEach(v => { maxShift = Math.max(maxShift, Math.abs(v[0]), Math.abs(v[1])); });
    const shapes = [...bands.entries()].map(([o, list]) => group([...list, fill('ink', o)]));
    ls.push(layer(`row ${r}`, shapes, OP, { p: sampled(P, 0.15), o: sampled(O, 0.6, true, r0) }));
    if (r === 0 || r === rows - 1) console.log(`  terrain row ${r}: y ${r1(base[1])} · star R ${r1(R0 * base[2] * c0.k)} · drift ±${r1(maxShift)} px`);
  }
  ls.reverse();                                      // near rows on top
  ls.unshift(layer('meridian', [group([poly([[cx, 88], [cx, 128]], false), stroke('muted', 1, 50)])], OP));
  ls.unshift(layer('north star', [group([poly(starPts(12)), fill('accent')])], OP, { p: st([cx, 66, 0]) }));
  ls.push(background(OP));
  const nStars = ls.reduce((s, l) => s + (l.nm.startsWith('row') ? l.shapes.reduce((a, g) => a + g.it.length - 2, 0) : 0), 0);
  // Per-frame extent with each row's drift applied: the field must clear both edges by 24 px always.
  let mL = 1e9, mR = 1e9;
  frames.forEach(t => rowBox.forEach(({ rb, P }) => { mL = Math.min(mL, rb.x0 + P[t][0]); mR = Math.min(mR, W - (rb.x1 + P[t][0])); }));
  if (mL < 24 || mR < 24) throw new Error(`terrain margin ${r1(mL)} / ${r1(mR)} px < 24`);
  scene(4, 'ns-terrain · one continuous body · loop', OP, ls, `${nStars} agents in ${rows} rows · ${bb.str()} (static) · min edge margin over the loop L ${r1(mL)} R ${r1(mR)} px`);
  stats.terrain = { n: nStars };
}
console.log(JSON.stringify(stats));

// ================================================================================================
// --verify: re-read the baked JSON and evaluate it frame by frame (hold, linear and bezier keys,
// nested group transforms), independently of the generator's own samples. Prints the numbers the
// check-frame expectations are written from.
if (process.argv[3] === '--verify') {
  const bez = (e, u) => { const [x1, y1, x2, y2] = e; if (x1 === y1 && x2 === y2) return u; let lo = 0, hi = 1, s = u; for (let i = 0; i < 60; i++) { s = (lo + hi) / 2; const x = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s; if (x < u) lo = s; else hi = s; } return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s; };
  const lerp = (a, b, w) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], w)) : typeof a === 'object' ? { ...a, v: lerp(a.v, b.v, w) } : a + (b - a) * w);
  const val = (p, t) => { if (!p.a) return p.k; const k = p.k; if (t <= k[0].t) return k[0].s; for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1].t) { if (k[i].h) return k[i].s; return lerp(k[i].s, k[i + 1].s, bez([k[i].o.x[0], k[i].o.y[0], k[i].i.x[0], k[i].i.y[0]], (t - k[i].t) / (k[i + 1].t - k[i].t))); } return k[k.length - 1].s; };
  const num = v => (Array.isArray(v) ? v[0] : v);
  const frameOf = (json, t) => {
    const stars = [], lines = [];
    json.layers.forEach(L => {
      const lp = val(L.ks.p, t), lsc = val(L.ks.s, t);
      const walk = (it, M, op) => {
        const ti = it.find(i => i.ty === 'tr');
        if (ti) { const p = val(ti.p, t), s = val(ti.s, t); M = { tx: M.tx + M.sx * p[0], ty: M.ty + M.sy * p[1], sx: M.sx * s[0] / 100, sy: M.sy * s[1] / 100 }; op *= num(val(ti.o, t)) / 100; }
        const fl = it.find(i => i.ty === 'fl'), sk = it.find(i => i.ty === 'st');
        it.forEach(i => {
          if (i.ty === 'gr') walk(i.it, M, op);
          if (i.ty === 'sh') {
            const sh = val(i.ks, t), v = (Array.isArray(sh) ? sh[0] : sh).v.map(q => [M.tx + M.sx * q[0], M.ty + M.sy * q[1]]);
            if (fl) { const x = v.reduce((s, q) => s + q[0], 0) / v.length, y = v.reduce((s, q) => s + q[1], 0) / v.length; stars.push({ L: L.nm, x, y, r: Math.max(...v.map(q => Math.hypot(q[0] - x, q[1] - y))), op: op * num(val(fl.o, t)) / 100, c: fl.c.sid }); }
            if (sk) lines.push({ L: L.nm, v, op: op * num(val(sk.o, t)) / 100 });
          }
          if (i.ty === 'el' && sk) { const p = val(i.p, t), s = val(i.s, t); lines.push({ L: L.nm, el: [M.tx + M.sx * p[0], M.ty + M.sy * p[1], M.sx * s[0] / 2], op: op * num(val(sk.o, t)) / 100 }); }
        });
      };
      walk(L.shapes, { tx: lp[0], ty: lp[1], sx: lsc[0] / 100, sy: lsc[1] / 100 }, num(val(L.ks.o, t)) / 100);
    });
    return { stars: stars.filter(s => s.op > 0.001), lines: lines.filter(l => l.op > 0.001) };
  };
  const pc = v => Math.round(v * 100);
  const box = S => { const b = bounds(); S.forEach(s => b.add(s.x, s.y, s.r)); return b.str(); };
  const ink = F => F.stars.filter(s => s.c === 'ink');
  const ext = S => [S.reduce((a, s) => (s.r > a.r ? s : a)), S.reduce((a, s) => (s.r < a.r ? s : a))];
  const count = S => { const m = {}; S.forEach(s => { m[s.L] = (m[s.L] || 0) + 1; }); return JSON.stringify(m); };
  // Seam: every visible star at f0 must have a twin at f240 in the same layer (within 0.3 px, 1 % opacity,
  // 0.05 px radius), and so must every visible hairline (same layer and opacity, vertices within 0.3 px
  // in either direction: a 90° turn can map an edge onto another edge reversed).
  const near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.3;
  const sameLine = (a, b) => a.L === b.L && Math.abs(a.op - b.op) < 0.01 && (a.el ? b.el && near(a.el, b.el) && Math.abs(a.el[2] - b.el[2]) < 0.05
    : b.v && a.v.length === b.v.length && (a.v.every((p, i) => near(p, b.v[i])) || a.v.every((p, i) => near(p, b.v[b.v.length - 1 - i]))));
  const seam = json => {
    const F0 = frameOf(json, 0), F1 = frameOf(json, OP);
    let miss = 0; const pool = F1.stars.slice();
    F0.stars.forEach(s => { const j = pool.findIndex(q => q.L === s.L && q.c === s.c && Math.hypot(q.x - s.x, q.y - s.y) < 0.3 && Math.abs(q.op - s.op) < 0.01 && Math.abs(q.r - s.r) < 0.05); if (j < 0) miss++; else pool.splice(j, 1); });
    let lmiss = 0; const lpool = F1.lines.slice();
    F0.lines.forEach(l => { const j = lpool.findIndex(q => sameLine(l, q)); if (j < 0) lmiss++; else lpool.splice(j, 1); });
    return `seam f0/f${OP}: ${F0.stars.length}/${F1.stars.length} visible stars, ${miss} without a same-layer twin · ${F0.lines.length}/${F1.lines.length} hairlines, ${lmiss} without a twin`;
  };
  const load = n => JSON.parse(fs.readFileSync(path.join(out, `scene-${n}`, 'lottie.json'), 'utf8'));
  const perFrame = (j, fn) => { let lo = 1e9, hi = -1e9; for (let t = 0; t < OP; t++) { const v = fn(frameOf(j, t)); lo = Math.min(lo, v); hi = Math.max(hi, v); } return `${lo}…${hi}`; };
  console.log('\n--- verify (from the baked JSON) ---');
  // Skottie-safe lint: shape layers only, whitelisted shape items, no expressions/effects/masks/mattes,
  // keyframe times integer, strictly increasing and within op; slots present; background layer last.
  [1, 2, 3, 4].forEach(n => {
    const j = load(n), errs = [], tys = new Set(); let nKeys = 0, nHold = 0;
    ['v', 'fr', 'ip', 'op', 'w', 'h', 'nm', 'ddd', 'assets', 'layers', 'slots'].forEach(k => { if (!(k in j)) errs.push('missing ' + k); });
    ['bgColor', 'accent', 'ink', 'muted'].forEach(k => { if (!j.slots[k]) errs.push('slot ' + k); });
    if (j.layers[j.layers.length - 1].nm !== 'background') errs.push('background not last');
    const scan = (o, where) => {
      if (Array.isArray(o)) { o.forEach((x, i) => scan(x, where)); return; }
      if (!o || typeof o !== 'object') return;
      if ('x' in o && typeof o.x === 'string') errs.push('expression at ' + where);
      ['ef', 'masksProperties', 'tt', 'td', 'refId'].forEach(k => { if (k in o) errs.push(k + ' at ' + where); });
      if (o.a === 1 && Array.isArray(o.k)) o.k.forEach((k, i, a) => { nKeys++; if (k.h) nHold++; if (!Number.isInteger(k.t) || k.t > j.op || (i && k.t <= a[i - 1].t)) errs.push('bad key t ' + k.t + ' at ' + where); });
      if (typeof o.ty === 'string') tys.add(o.ty);
      Object.keys(o).forEach(k => scan(o[k], where + '.' + k));
    };
    j.layers.forEach(L => { if (L.ty !== 4) errs.push('layer type ' + L.ty); scan(L.shapes, L.nm); scan(L.ks, L.nm + '.ks'); });
    const bad = [...tys].filter(t => !['gr', 'sh', 'el', 'rc', 'fl', 'st', 'tr'].includes(t));
    console.log(`lint scene-${n}: ${errs.length + bad.length ? 'FAIL ' + errs.slice(0, 5).join('; ') + ' ' + bad.join(',') : 'ok'} · shape items ${[...tys].sort().join(' ')} · ${nKeys} keys (${nHold} hold)`);
  });
  {
    const j = load(1); console.log('scene-1', seam(j), '· visible agents per frame', perFrame(j, F => ink(F).length));
    [0, 60, 120, 239].forEach(t => { const F = frameOf(j, t), S = ink(F), [n, f] = ext(S), N = F.stars.find(s => s.c === 'accent'); console.log(`  f${t}: ${count(S)} ${box(S)} · nearest (${r1(n.x)}, ${r1(n.y)}) ${pc(n.r / 3.5)} % / ${pc(n.op)} % · farthest ${pc(f.r / 3.5)} % / ${pc(f.op)} % · north (${r1(N.x)}, ${r1(N.y)}) R ${r1(N.r)}`); });
    console.log('  layers:', j.layers.map(l => l.nm).join(' > '));
  }
  {
    const j = load(2); console.log('scene-2', seam(j), '· visible edges per frame', perFrame(j, F => F.lines.filter(l => l.L.startsWith('cube')).length));
    [0, 60, 120, 180, 239].forEach(t => { const F = frameOf(j, t), S = ink(F), [n, f] = ext(S), E = F.lines.filter(l => l.L.startsWith('cube')), eb = bounds(); E.forEach(l => l.v.forEach(q => eb.add(q[0], q[1], 0))); console.log(`  f${t}: agents ${box(S)} · near ${pc(n.r / 3.3)} % / ${pc(n.op)} % · far ${pc(f.r / 3.3)} % / ${pc(f.op)} % · edges front ${E.filter(l => l.L.includes('front')).length} back ${E.filter(l => l.L.includes('back')).length} · cube ${eb.str()}`); });
    console.log('  layers:', j.layers.map(l => l.nm).join(' > '));
  }
  {
    const j = load(3); console.log('scene-3', seam(j));
    [0, 120, 239].forEach(t => { const F = frameOf(j, t), S = ink(F), [n, f] = ext(S), N = F.stars.find(s => s.c === 'accent'); console.log(`  f${t}: ${count(S)} ${box(S)} · near ${pc(n.r / 3.4)} % / ${pc(n.op)} % · far ${pc(f.r / 3.4)} % / ${pc(f.op)} % · north R ${r1(N.r)} at (${r1(N.x)}, ${r1(N.y)})`); });
    console.log('  layers:', j.layers.map(l => l.nm).join(' > '));
  }
  {
    const j = load(4); console.log('scene-4', seam(j));
    const rowsAt = t => { const F = frameOf(j, t), m = {}; ink(F).forEach(s => { (m[s.L] = m[s.L] || []).push(s); }); return { F, m }; };
    const R0 = rowsAt(0), names = Object.keys(R0.m).sort((a, b) => +a.split(' ')[1] - +b.split(' ')[1]);
    const mean = (a, k) => a.reduce((s, q) => s + q[k], 0) / a.length;
    let mL = 1e9, mR = 1e9, mT = 1e9, mB = 1e9, oLo = 1, oHi = 0;
    for (let t = 0; t < OP; t++) ink(frameOf(j, t)).forEach(s => { mL = Math.min(mL, s.x - s.r); mR = Math.min(mR, W - s.x - s.r); mT = Math.min(mT, s.y - s.r); mB = Math.min(mB, H - s.y - s.r); oLo = Math.min(oLo, s.op); oHi = Math.max(oHi, s.op); });
    console.log(`  over the loop: margins L ${r1(mL)} R ${r1(mR)} T ${r1(mT)} B ${r1(mB)} px · agent opacity ${r1(oLo * 100)}…${r1(oHi * 100)} %`);
    console.log('  f0 row y far>near', names.map(n => r1(mean(R0.m[n], 'y'))).join(' '));
    [0, 60, 120, 180, 239].forEach(t => { const R = rowsAt(t), S = ink(R.F), [n, f] = ext(S), N = R.F.stars.find(s => s.c === 'accent');
      console.log(`  f${t}: ${box(S)} · star R ${r1(f.r)}…${r1(n.r)} · north (${r1(N.x)}, ${r1(N.y)}) R ${r1(N.r)}`);
      console.log('     dx vs f0 far>near', names.map(nm => r1(mean(R.m[nm], 'x') - mean(R0.m[nm], 'x'))).join(' '));
      console.log('     dy vs f0 far>near', names.map(nm => r1(mean(R.m[nm], 'y') - mean(R0.m[nm], 'y'))).join(' '));
      console.log('     row opacity far>near', names.map(nm => Math.round(num(val(j.layers.find(l => l.nm === nm).ks.o, t)))).join(' '));
    });
  }
}
