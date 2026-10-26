/* eslint-disable */ // Source record from the design canvas, kept unchanged apart from this line; see README.md.
// Northstar Day twins: every verified Night scene → <player>/public/projects/<project>-day/scene-N/
// node build-lottie-day.js <player-dir> [--canvas <canvas/project/lottie/day>]
//
// Reads each Night lottie.json (never writes it) and writes a Day twin plus controls.json:
//  · slots: bgColor / ground → Day white, accent → Glacier ink, ink → Night, muted → Day graduation; nm gets " · day"
//  · baked colour literals ({"c":{"a":0|1,"k":[r,g,b,a]}} without a sid) go through the Night → Day role table
//  · ink agent marks: a resting opacity under 22 % does not survive on white. An agent mark is an ink fill whose
//    scope (the shapes above it in its group, nested groups included, because a fill paints every path in scope)
//    holds a 4-point star path (8 closed vertices, static or animated), a polystar star or a dot (ellipse). Per mark
//    the resting floor is the product of its non-fade opacity factors (layer o, every enclosing group's transform
//    o, the fill o; a factor that ever reaches 0 is a fade or a hold-key toggle and is left alone). Where a floor is
//    under 22, the scene's opacity ladder (the innermost factor that carries the gradient) is rescaled affinely,
//    lo → T, hi → hi, with the smallest T that lifts every floor to 22: the gradient keeps its shape and order, no
//    value is clamped. If no such T exists, or T would keep less than half of the ladder's spread, the scene fails
//    and a person decides: nothing is clamped or flattened silently.
//  · an ink fill on any other shape is reported: rectangles (bars, tiles) as non-agent ink, anything unrecognised
//    as a warning, which fails the scene when its resting floor is under 22.
// Only colour and opacity values change. Timing, easing, geometry and structure are checked identical to Night
// (opacity values and colours blanked, then the two JSON trees compared), and every loop seam is re-checked.
// Colour audit: every fill/stroke colour that is not a slot reference (static, keyframe s and e) and every slot
// must be a Day palette value; no Night-only colour may be left anywhere in the file (any 3- or 4-number array,
// any alpha, exponent notation allowed); every sid the layers reference must have a slot.
//
// Native sets: a Night generator that writes its own Day twin (build-lottie-world.js → northstar-world-day) owns
// that folder. Here the twin is never overwritten: it is verified against its Night scene (same skeleton, Day
// colours, ink floor ≥ 22, seams, every opacity equal to Night's except the ink-agent ladders, which must be one
// affine image of Night's), and its distance from this script's in-memory translation is reported. The canvas copy
// is the native twin, byte-identical.
// With --canvas, each verified Day file is copied byte-identical to <dir>/<family>/<scene-name>.json.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const argv = process.argv.slice(2);
if (!argv[0]) { console.error('usage: node build-lottie-day.js <player-dir> [--canvas <dir>]'); process.exit(1); }
const projectsDir = path.join(argv[0], 'public', 'projects');
const ci = argv.indexOf('--canvas'), canvasDir = ci > 0 ? argv[ci + 1] : null;

const SETS = [
  ['northstar-instruments', 'instruments'],
  ['northstar-hero', 'hero'],
  ['northstar-geo', 'geo'],
  ['northstar-3d', '3d'],
  ['northstar-charts', 'charts'],
  ['northstar-illustrations', 'illustrations'],
  ['northstar-world', 'world', { native: 'build-lottie-world.js' }],
];
const FLOOR = 22;          // lowest resting opacity (%) an ink agent mark may have on white
const MIN_SPREAD = 0.5;    // a ladder rescale must keep at least this share of the ladder's range

const rgba = (hex, a = 1) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).concat(a);
const hexOf = c => '#' + c.slice(0, 3).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const DAY = { bgColor: '#FFFFFF', ground: '#FFFFFF', accent: '#2F5D9A', ink: '#06080C', muted: '#656A75' };
const DAY_HEX = new Set(Object.values(DAY));
// Night → Day role table for baked literals: the Night value each role is drawn with, and its Day slot
const NIGHT_ROLE = [
  ['#08090C', 'bgColor'],   // scene ground (Night)
  ['#06080C', 'ground'],    // brand Night ground (older scenes' "ground" slot)
  ['#93B4E0', 'accent'],    // Glacier: north star, signal marks
  ['#E8EAEE', 'ink'],       // agents, rims, horizon
  ['#7D838F', 'muted'],     // hairlines, graduations
];
// Night-only values (#06080C is the Night ground and also Day ink, so it cannot tell the two apart)
const NIGHT_ONLY = NIGHT_ROLE.map(([h]) => h).filter(h => !DAY_HEX.has(h));
function roleOf(c) {
  for (const [hex, role] of NIGHT_ROLE) { const n = rgba(hex); if (n.slice(0, 3).every((v, i) => Math.abs(v - c[i]) < 3 / 255)) return role; }
  // off-table literal: classify by what it does on a Night ground
  const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b), L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (mx - mn > 0.12 && b >= r) return 'accent';   // a blue signal tint
  if (L < 0.12) return 'bgColor';                    // a ground or knock-out
  if (L > 0.6) return 'ink';                         // a bright mark
  return 'muted';                                    // a mid-tone hairline
}
const dayColour = c => rgba(DAY[roleOf(c)], c.length > 3 ? c[3] : 1);
const r1 = v => Math.round(v * 10) / 10;

// ---- property helpers -----------------------------------------------------------------------------
const num = v => (Array.isArray(v) ? v[0] : v);
const values = p => (p.a === 1 ? p.k.filter(k => k.s !== undefined).map(k => num(k.s)) : [num(p.k)]);
const mapProp = (p, f) => {
  if (p.a === 1) p.k.forEach(k => { if (k.s !== undefined) k.s = (Array.isArray(k.s) ? k.s : [k.s]).map(f); if (k.e !== undefined) k.e = (Array.isArray(k.e) ? k.e : [k.e]).map(f); });
  else p.k = Array.isArray(p.k) ? p.k.map(f) : f(p.k);
};
const SHAPE_TY = new Set(['sh', 'sr', 'el', 'rc']);
// the shapes a fill or stroke at items[idx] paints: everything above it in its group, nested groups included
const shapesAbove = (items, idx) => items.slice(0, idx).flatMap(i => (i.ty === 'gr' ? shapesAbove(i.it, i.it.length) : SHAPE_TY.has(i.ty) ? [i] : []));
// what a shape is, for the floor rule
function markKind(s) {
  if (s.ty === 'sh') {
    const ks = s.ks.a === 1 ? s.ks.k.filter(k => k.s).map(k => k.s[0]) : [s.ks.k];
    if (ks.length && ks.every(k => k && k.c && k.v && k.v.length === 8)) return 'star';
    const k = ks[0] || {};
    return `path(${s.ks.a === 1 ? 'animated ' : ''}${k.v ? k.v.length : '?'} v, ${k.c ? 'closed' : 'open'})`;
  }
  if (s.ty === 'sr') return s.sy === 1 ? 'star' : 'polygon';
  if (s.ty === 'el') return 'dot';
  if (s.ty === 'rc') return 'rect';
  return s.ty;
}
const AGENT = new Set(['star', 'dot']);     // agent marks: floor-lifted
const NON_AGENT = new Set(['rect']);        // bars and tiles: ink, but not agents; reported, never lifted

// Every fill/stroke matching pred, with the shapes it paints and its opacity factors outermost → innermost.
function paints(json, pred) {
  const out = [];
  json.layers.forEach(L => {
    const walk = (items, factors) => {
      const t = items.find(i => i.ty === 'tr');
      const f2 = t && t.o ? [...factors, { kind: 'group', prop: t.o }] : factors;
      items.forEach((it, idx) => {
        if ((it.ty === 'fl' || it.ty === 'st') && it.c && pred(it)) {
          out.push({ layer: L.nm, shapes: shapesAbove(items, idx), factors: it.o ? [...f2, { kind: it.ty === 'fl' ? 'fill' : 'stroke', prop: it.o }] : f2 });
        }
        if (it.ty === 'gr') walk(it.it, f2);
      });
    };
    walk(L.shapes || [], L.ks && L.ks.o ? [{ kind: 'layer', prop: L.ks.o }] : []);
  });
  return out;
}
// ink fills split by what they paint
function inkMarks(json) {
  const agents = [], other = [];
  paints(json, p => p.ty === 'fl' && p.c.sid === 'ink').forEach(m => {
    const kinds = m.shapes.map(markKind);
    const nAgent = kinds.filter(k => AGENT.has(k)).length;
    if (nAgent) agents.push({ ...m, paths: nAgent, kinds });
    else other.push({ ...m, kinds });
  });
  return { agents, other };
}
const isFade = p => Math.min(...values(p)) <= 0.5;
// a mark's ladder: the innermost non-fade factor that is not a flat 100
function analyse(mark) {
  const live = mark.factors.filter(f => !isFade(f.prop));
  const ladder = [...live].reverse().find(f => values(f.prop).some(v => v < 99.5)) || null;
  const M = live.filter(f => f !== ladder).reduce((m, f) => m * Math.min(...values(f.prop)) / 100, 1);
  const lmin = ladder ? Math.min(...values(ladder.prop)) : 100;
  return { ladder, M, floor: lmin * M };
}
const floorOf = marks => (marks.length ? Math.min(...marks.map(m => analyse(m).floor)) : null);

// ---- the translation --------------------------------------------------------------------------------
function toDay(night) {
  const j = JSON.parse(JSON.stringify(night));
  const log = { literals: 0, ladders: [], notes: [] };
  j.nm = `${night.nm} · day`;
  Object.entries(j.slots || {}).forEach(([sid, s]) => {
    const a = s.p.k.length > 3 ? s.p.k[3] : 1;
    s.p.k = DAY[sid] ? rgba(DAY[sid], a) : dayColour(s.p.k);
  });
  // baked colour literals on fills and strokes (static or keyframed)
  const scan = o => {
    if (Array.isArray(o)) { o.forEach(scan); return; }
    if (!o || typeof o !== 'object') return;
    if ((o.ty === 'fl' || o.ty === 'st') && o.c && !o.c.sid) {
      if (o.c.a === 1) o.c.k.forEach(k => { if (k.s) k.s = dayColour(k.s); if (k.e) k.e = dayColour(k.e); });
      else o.c.k = dayColour(o.c.k);
      log.literals++;
    }
    if (o.ty === 'gf' || o.ty === 'gs') throw new Error(`gradient ${o.ty} in ${night.nm}: add a gradient rule before translating`);
    Object.values(o).forEach(scan);
  };
  scan(j.layers);
  // ink agent marks: lift resting floors under 22 % by rescaling the ladder affinely
  const marks = inkMarks(j).agents.map(m => ({ ...m, ...analyse(m) }));
  const before = marks.length ? Math.min(...marks.map(m => m.floor)) : null;
  const classes = new Map();
  marks.forEach(m => { if (!m.ladder) return; const c = classes.get(m.ladder.kind) || { marks: [], props: new Set() }; c.marks.push(m); c.props.add(m.ladder.prop); classes.set(m.ladder.kind, c); });
  classes.forEach((c, kind) => {
    if (c.marks.every(m => m.floor >= FLOOR - 1e-9)) return;
    const all = [...c.props].flatMap(values).filter(v => v > 0.5), lo = Math.min(...all), hi = Math.max(...all);
    const fT = T => v => (v <= 0.5 ? v : hi - lo < 1e-9 ? Math.max(v, T) : T + (v - lo) * (hi - T) / (hi - lo));
    const ok = f => c.marks.every(m => r1(f(Math.min(...values(m.ladder.prop)))) * m.M >= FLOOR - 1e-9);
    let T = lo, f = null;
    for (; T <= hi + 1e-9; T = r1(T + 0.1)) if (ok(fT(T))) { f = fT(T); break; }
    const worst = c.marks.reduce((w, m) => (m.floor < w.floor ? m : w));
    if (!f) {
      throw new Error(`${kind} o ladder ${r1(lo)}…${r1(hi)}: no affine rescale with the top kept lifts every floor to ${FLOOR} ` +
        `(worst mark in "${worst.layer}": floor ${r1(worst.floor)} = ladder min × ${worst.M.toFixed(3)} from enclosing factors). ` +
        'Not clamped: decide by hand (raise the top, or the enclosing opacity).');
    }
    const kept = hi - lo < 1e-9 ? 1 : (hi - T) / (hi - lo);
    if (kept < MIN_SPREAD) {
      throw new Error(`${kind} o ladder ${r1(lo)}…${r1(hi)} → ${r1(T)}…${r1(hi)} would keep only ${Math.round(kept * 100)} % of its spread ` +
        `(worst mark in "${worst.layer}", floor ${r1(worst.floor)}). Not flattened: decide by hand.`);
    }
    c.props.forEach(p => mapProp(p, v => r1(f(v))));
    log.ladders.push(`${kind} o ${r1(lo)}…${r1(hi)} → ${r1(T)}…${r1(hi)}, spread kept ${Math.round(kept * 100)} % (${c.props.size} props, ${c.marks.length} marks)`);
  });
  const after = inkMarks(j);
  const nPaths = after.agents.reduce((n, m) => n + m.paths, 0);
  log.floor = before == null ? 'no ink agent marks' : `ink-agent floor ${r1(before)} → ${r1(floorOf(after.agents))} % over ${after.agents.length} fills (${nPaths} marks)`;
  log.other = otherInk(after.other);
  return { j, log };
}
// ink fills that are not agent marks: rectangles are reported, anything unrecognised warns (and fails under 22)
function otherInk(other) {
  const by = new Map();
  other.forEach(m => {
    const kind = m.kinds.length ? [...new Set(m.kinds)].join('+') : 'nothing';
    const e = by.get(kind) || { n: 0, floor: Infinity, known: m.kinds.length > 0 && m.kinds.every(k => NON_AGENT.has(k)) };
    e.n++; e.floor = Math.min(e.floor, analyse(m).floor); by.set(kind, e);
  });
  const notes = [], errs = [];
  by.forEach((e, kind) => {
    if (e.known) notes.push(`non-agent ink ${kind} ×${e.n} (floor ${r1(e.floor)} %, not lifted)`);
    else {
      notes.push(`WARN ink fill on unrecognised ${kind} ×${e.n} (floor ${r1(e.floor)} %)`);
      if (e.floor < FLOOR - 1e-9) errs.push(`ink fill on unrecognised ${kind} rests at ${r1(e.floor)} % (< ${FLOOR}): decide whether it is an agent`);
    }
  });
  return { notes, errs };
}

// ---- checks -------------------------------------------------------------------------------------------
// Blank colours, slots, nm and opacity values; everything left (times, easing, geometry, structure) must match.
function skeleton(json) {
  const j = JSON.parse(JSON.stringify(json));
  delete j.nm; delete j.slots;
  const blankO = p => { if (!p) return; if (p.a === 1) p.k.forEach(k => { k.s = null; if ('e' in k) k.e = null; }); else p.k = null; };
  const scan = o => {
    if (Array.isArray(o)) { o.forEach(scan); return; }
    if (!o || typeof o !== 'object') return;
    if (o.ty === 'fl' || o.ty === 'st') { if (o.c && !o.c.sid) o.c = null; blankO(o.o); }
    if (o.ty === 'tr') blankO(o.o);
    Object.values(o).forEach(scan);
  };
  j.layers.forEach(L => blankO(L.ks.o));
  scan(j.layers);
  return JSON.stringify(j);
}
function seams(json) {
  let n = 0, open = 0;
  const walk = o => {
    if (!o || typeof o !== 'object') return;
    if (o.a === 1 && Array.isArray(o.k) && o.k.length && o.k[0].t !== undefined) {
      n++; if (JSON.stringify(o.k[0].s) !== JSON.stringify(o.k[o.k.length - 1].s)) open++; return;
    }
    Object.values(o).forEach(walk);
  };
  walk(json.layers);
  return { n, open };
}
// Every colour the file can draw with must be Day; no Night-only value may be left anywhere.
const NUM = '(-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)';
const ARR = new RegExp(`\\[${NUM},${NUM},${NUM}(?:,${NUM})?\\]`, 'g');
function colourAudit(json) {
  const errs = [];
  let literals = 0, nonDay = 0;
  const walk = o => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    if ((o.ty === 'fl' || o.ty === 'st') && o.c && !o.c.sid) {
      const cs = o.c.a === 1 ? o.c.k.flatMap(k => [k.s, k.e].filter(Boolean)) : [o.c.k];
      cs.forEach(c => { literals++; if (!DAY_HEX.has(hexOf(c))) nonDay++; });
    }
    Object.values(o).forEach(walk);
  };
  walk(json.layers);
  if (nonDay) errs.push(`${nonDay}/${literals} baked colour values not in the Day palette`);
  Object.entries(json.slots || {}).forEach(([sid, s]) => { if (!DAY_HEX.has(hexOf(s.p.k))) errs.push(`slot ${sid} ${hexOf(s.p.k)} not Day`); });
  let night = 0;
  for (const m of JSON.stringify(json).matchAll(ARR)) {
    const c = [+m[1], +m[2], +m[3]];
    if (c.every(v => v >= 0 && v <= 1) && NIGHT_ONLY.includes(hexOf(c))) night++;
  }
  if (night) errs.push(`${night} Night colours left`);
  const used = new Set();
  const sids = o => { if (Array.isArray(o)) { o.forEach(sids); return; } if (!o || typeof o !== 'object') return; if (typeof o.sid === 'string') used.add(o.sid); Object.values(o).forEach(sids); };
  sids(json.layers);
  const missing = [...used].filter(s => !(json.slots || {})[s]);
  if (missing.length) errs.push(`sid without a slot: ${missing.join(', ')} (would draw with no colour)`);
  return errs;
}
// all opacity values in walk order (layer o, transform o, fill/stroke o; static k or keyframe s/e), each tagged
// with whether its property is in `ladders`
function opacities(json, ladders = new Set()) {
  const out = [];
  const take = p => {
    if (!p) return;
    const lad = ladders.has(p);
    if (p.a === 1) p.k.forEach(k => { [k.s, k.e].forEach(v => { if (v !== undefined) out.push({ v: num(v), lad }); }); });
    else out.push({ v: num(p.k), lad });
  };
  const walk = o => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== 'object') return;
    if (o.ty === 'fl' || o.ty === 'st' || o.ty === 'tr') take(o.o);
    Object.values(o).forEach(walk);
  };
  json.layers.forEach(L => { take(L.ks.o); walk(L.shapes || []); });
  return out;
}
// A native twin keeps the Day rules without being this script's output: every opacity equals Night's, except the
// ink-agent ladders, which must be one affine image of Night's (Day = a + b · Night, b ≥ MIN_SPREAD, residual only
// rounding) that leaves every floor at 22 or more. Its distance from this script's translation is reported, not
// gated: a generator may anchor its own lift differently (e.g. floor + (96 − floor) · depth keeps 96 fixed where the
// translation keeps the ladder's own top).
const quantum = vs => [1, 0.1, 0.01, 0.001].find(q => vs.every(v => Math.abs(v / q - Math.round(v / q)) < 1e-6)) || 0;
function nativeCheck(night, day, translation) {
  const errs = [];
  const ladders = new Set(inkMarks(night).agents.map(m => analyse(m).ladder).filter(Boolean).map(l => l.prop));
  const n = opacities(night, ladders), d = opacities(day), t = opacities(translation);
  if (n.length !== d.length) return { errs: [`native opacity count ${d.length} ≠ Night ${n.length}`], note: '' };
  const fixed = [], lad = [];
  n.forEach((x, i) => (x.lad && x.v > 0.5 ? lad : fixed).push([x.v, d[i].v]));
  const fixedMax = Math.max(0, ...fixed.map(([a, b]) => Math.abs(a - b)));
  if (fixedMax > 0.05) errs.push(`native twin changes a non-ladder opacity (max |Δ| ${r1(fixedMax)} pp)`);
  let fit = 'no ladder';
  if (lad.length) {
    const mx = lad.reduce((s, p) => s + p[0], 0) / lad.length, my = lad.reduce((s, p) => s + p[1], 0) / lad.length;
    const vx = lad.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
    const b = vx > 1e-9 ? lad.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / vx : 1, a = my - b * mx;
    const res = Math.max(...lad.map(([x, y]) => Math.abs(a + b * x - y)));
    // both sides are rounded by their generators: allow one rounding step of each (integers → 1 + b, tenths → 0.1 + 0.1 b)
    const qN = quantum(lad.map(p => p[0])), qD = quantum(lad.map(p => p[1])), tol = qD + b * qN + 1e-6;
    fit = `ladder Day = ${r1(a)} + ${b.toFixed(3)} · Night (residual ${res.toFixed(2)} ${res > tol ? '>' : '≤'} ${tol.toFixed(2)}, values rounded to ${qN} / ${qD})`;
    if (res > tol) errs.push(`native ladder is not an affine image of Night's (residual ${res.toFixed(2)} > ${tol.toFixed(2)} pp)`);
    if (b < MIN_SPREAD) errs.push(`native ladder keeps only ${Math.round(b * 100)} % of its spread`);
    const sorted = [...lad].sort((p, q) => p[0] - q[0]);
    let maxDay = -Infinity, inverted = 0;
    sorted.forEach(([x, y], i) => { if (i && x > sorted[i - 1][0] + 1e-9 && y < maxDay - qD - 1e-6) inverted++; maxDay = Math.max(maxDay, y); });
    if (inverted) errs.push(`native ladder inverts the Night order in ${inverted} values`);
  }
  const dt = t.length === d.length ? Math.max(0, ...d.map((x, i) => Math.abs(x.v - t[i].v))) : NaN;
  return { errs, note: `${fit} · other opacities ${fixedMax > 0.05 ? 'differ from Night by ' + r1(fixedMax) + ' pp' : '= Night'} · max |Δ| vs this script's translation ${r1(dt)} pp` };
}
// faintest muted hairline (informational: the floor rule covers ink agents only)
function mutedFloor(json) { const f = floorOf(paints(json, p => p.c.sid === 'muted')); return f == null ? null : r1(f); }

// ---- run ------------------------------------------------------------------------------------------------
const report = [];
let failed = 0;
const md5 = t => crypto.createHash('md5').update(t).digest('hex').slice(0, 8);
SETS.forEach(([project, family, opts = {}]) => {
  const src = path.join(projectsDir, project), dst = path.join(projectsDir, `${project}-day`);
  if (!fs.existsSync(src)) { console.error('missing', src); failed++; return; }
  if (opts.native && !fs.existsSync(dst)) { console.error(`missing native Day twin ${dst}: run ${opts.native} first`); failed++; return; }
  if (!opts.native) fs.rmSync(dst, { recursive: true, force: true });
  fs.readdirSync(src).filter(d => /^scene-\d+$/.test(d)).sort((a, b) => +a.slice(6) - +b.slice(6)).forEach(sc => {
    const errs = [];
    let night, j, log, txt;
    try {
      night = JSON.parse(fs.readFileSync(path.join(src, sc, 'lottie.json'), 'utf8'));
      ({ j, log } = toDay(night));
    } catch (e) {
      failed++;
      report.push(`${project}-day/${sc} · FAIL ${e.message}`);
      return;
    }
    let day = j, mode = 'written';
    if (opts.native) {
      // verify the twin the Night generator wrote against its Night scene and the Day rules; never overwrite it
      try { txt = fs.readFileSync(path.join(dst, sc, 'lottie.json'), 'utf8'); day = JSON.parse(txt); } catch (e) {
        failed++;
        report.push(`${project}-day/${sc} · FAIL native twin unreadable (${e.message}): run ${opts.native} again`);
        return;
      }
      if (day.nm !== night.nm && day.nm !== j.nm) errs.push(`native nm "${day.nm}" is not the Night nm`);
      const nc = nativeCheck(night, day, j);
      errs.push(...nc.errs);
      mode = `native twin from ${opts.native}, not rewritten · md5 ${md5(txt)} · ${nc.note}` +
        `${log.ladders.length ? ' (translation would rescale ' + log.ladders.join('; ') + ')' : ''}`;
    }
    if (skeleton(day) !== skeleton(night)) errs.push('timing/geometry differs from Night');
    const sN = seams(night), sD = seams(day);
    if (/· loop$/.test(night.nm) && sD.open !== sN.open) errs.push(`loop seams ${sN.open} → ${sD.open} open`);
    if (sD.n !== sN.n) errs.push('animated property count changed');
    errs.push(...colourAudit(day));
    if (day.op !== night.op || day.ip !== night.ip || day.fr !== night.fr || day.w !== night.w || day.h !== night.h) errs.push('header changed');
    const marks = inkMarks(day), fl = floorOf(marks.agents);
    if (fl != null && fl < FLOOR - 1e-9) errs.push(`ink-agent floor ${r1(fl)} % < ${FLOOR}`);
    const other = otherInk(marks.other);
    errs.push(...other.errs);
    if (!opts.native) {
      txt = JSON.stringify(j);
      fs.mkdirSync(path.join(dst, sc), { recursive: true });
      fs.writeFileSync(path.join(dst, sc, 'lottie.json'), txt);
      const ctl = JSON.parse(fs.readFileSync(path.join(src, sc, 'controls.json'), 'utf8'));
      ctl.controls.forEach(c => { c.label = c.label.replace('(Night)', '(Day)').replace(/^Glacier \(/, 'Glacier ink ('); });
      fs.writeFileSync(path.join(dst, sc, 'controls.json'), JSON.stringify(ctl, null, 2));
    }
    const name = night.nm.split(' · ')[0];
    if (errs.length) failed++;
    else if (canvasDir && txt) {
      fs.mkdirSync(path.join(canvasDir, family), { recursive: true });
      fs.writeFileSync(path.join(canvasDir, family, `${name}.json`), txt);
    }
    const dayFloor = fl == null ? 'no ink agent marks' : `ink-agent floor ${r1(fl)} % over ${marks.agents.length} fills (${marks.agents.reduce((n, m) => n + m.paths, 0)} marks)`;
    const mf = mutedFloor(day);
    report.push(`${project}-day/${sc} ${name} · ${(txt.length / 1024).toFixed(1)} KB · ${mode} · ` +
      (opts.native ? dayFloor : `literals ${log.literals} · ${log.floor}${log.ladders.length ? ' · ladder ' + log.ladders.join('; ') : ''}`) +
      `${other.notes.length ? ' · ' + other.notes.join('; ') : ''} · muted floor ${mf == null ? '–' : mf + ' %'}` +
      ` · loop seams open ${sD.open}/${sD.n} (Night ${sN.open}) · ${errs.length ? 'FAIL ' + errs.join('; ') : 'skeleton = Night · colours Day'}` +
      `${!errs.length && canvasDir ? ` → ${family}/${name}.json` : ''}`);
  });
});
console.log(report.join('\n'));
if (canvasDir) console.log('canvas copies (verified scenes only) →', canvasDir);
if (failed) { console.error(`${failed} scene(s) failed`); process.exit(1); }
