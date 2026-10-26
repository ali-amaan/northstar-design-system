#!/usr/bin/env node
// Northstar country map assets — the files @northstar-js/maps will ship.
//
//   node build/build-country-maps.cjs                 every feature (the package build)
//   node build/build-country-maps.cjs --only=FI,JP    a subset (keys), for iteration; no index.json
//   node build/build-country-maps.cjs --sheets        also draw CanvasKit contact sheets (needs NS_LOTTIE_PLAYER)
//   node build/build-country-maps.cjs --zoom=FI,AQ    also render those keys large
//
// Reads  .cache/world-geo.json (written by build-world-geo.cjs from data/countries-50m.json)
//        data/market-status.json (market status, exported from the engine's population.py)
// Writes dist/maps/{night,day,marks}/<key>.svg, index.json, PROVENANCE.md
//        .cache/renders/sheet-{night,day,marks}-N.png with --sheets, drawn from the SAME path strings.
//
// One geometry per feature is computed once (planned, projected, simplified, cut edges flagged) and every
// output — both themes, the contact sheets, the star lattice's inside/keep-out tests — reads that geometry.
// The build fails if any drawn part is cut by the view or by its inset box: a part is drawn whole or not at all.
'use strict';
const fs = require('fs');
const path = require('path');
const { fitCountry, laea, D2R } = require('./geo-proj.cjs');

// @northstar-js/maps: paths are relative to the package. Market status comes from data/market-status.json,
// the small file exported from the engine's population.py (PLAN phase 5.3); until the engine writes it, the
// package carries FI and JP as roster-ready, AX covered by FI, and US as registered.
const PKG = path.resolve(__dirname, '..');
const GEO_FILE = path.join(PKG, '.cache', 'world-geo.json');
const OUT = process.env.NS_MAPS_OUT || path.join(PKG, 'dist', 'maps');
const RENDERS = path.join(PKG, '.cache', 'renders');
const PLAYER = process.env.NS_LOTTIE_PLAYER || path.join(PKG, '.cache', 'lottie-player');
const STATUS_FILE = process.env.NS_MARKET_STATUS || path.join(PKG, 'data', 'market-status.json');
const STATUS_JSON = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));

const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x === `--${k}` || x.startsWith(`--${k}=`)); return a ? (a.includes('=') ? a.split('=')[1] : true) : null; };
const ONLY = opt('only') ? new Set(String(opt('only')).split(',')) : null;
const SHEETS = !!opt('sheets');           // contact sheets need CanvasKit; opt in with --sheets
const ZOOM = opt('zoom') ? String(opt('zoom')).split(',') : [];

// ---------- design constants ----------
const W = 512, PAD = 40;                 // map assets: 512 × 512, frame parts inside [PAD, W - PAD]
const MARK = 48, MARK_PAD = 3;           // outline marks: 48 px design size, 1.5 px stroke
const SEED = 20261025;                   // lattice jitter seed, as Geo.dc.html lattice()
const TIER = { standard: { pitch: 12, min: 100 }, small: { pitch: 9.5, min: 12 } };
const PITCH_FLOOR = 5;                   // a sparse lattice is refined down to this pitch, no further
const MICRO_MIN_SPAN = 2.0;              // dot mode frames a micro feature on at least 2° (lat-equivalent)
const MICRO_CAP = 24;                    // dot mode: at most this many island stars, largest parts first
const DOT_R = 3.0;                       // dot-mode star radius
const DOT_MIN = 2 * DOT_R + 1.5;         // dot-mode stars closer than this are one star (a tight group of islands)
const MAX_EDGE = 24;                     // magnification cap: median outline edge, px
const DOT_CAP = 2, DOT_EXTENT = 128;     // capped harder than 2× and drawn under 128 px across: dot mode
const STAR_TIERS = [{ lim: .34, R: 2.05, op: .55 }, { lim: .67, R: 2.25, op: .78 }, { lim: 2, R: 2.45, op: 1 }];
const STATUS_AT = [486, 26];             // status mark centre, inside the top-right padding band
const SAFE = [3, 3, W - 3, W - 3];       // a drawn part lies wholly inside this box ...
const STATUS_KO = [472, 10, 502, 42];    // ... and clear of the status mark
// framing: a part outside the frame is brought into the view when that costs at most this much of the scale,
// by its share of the feature's area. Larger groups are worth more scale; a speck is not worth any.
const WIDEN = [[0.01, 0.35], [0.001, 0.25], [0.0001, 0.16], [0, 0.05]];
const INSET_MIN = 0.0005;                // a group that stays off the frame gets an inset at >= 0.05 % of the area
const MAX_INSETS = 5, INSET_MAX = 168, INSET_MIN_BOX = 44, INSET_PAD = 10, INSET_MARGIN = 8;
const THEMES = {
  night: { grat: ['#848A94', .28], outline: ['#A9AEB8', .7], star: ['#E8EAEE', 1], ring: ['#848A94', .55], context: ['#848A94', .42],
    signal: ['#93B4E0', 1], neutral: ['#A9AEB8', 1], ground: '#08090C', label: '#A9AEB8', faint: '#848A94', cell: '#1E2128' },
  day: { grat: ['#656A75', .28], outline: ['#464C56', .7], star: ['#06080C', 1], ring: ['#656A75', .55], context: ['#656A75', .42],
    signal: ['#2F5D9A', 1], neutral: ['#464C56', 1], ground: '#FFFFFF', label: '#464C56', faint: '#656A75', cell: '#E6E8EB' },
};
const STATUS_LABEL = { 'roster-ready': 'Roster-ready', registered: 'Registered · not calibrated', none: 'Not available' };
const PROVENANCE = 'Natural Earth 1:50m admin-0 (public domain) via world-atlas 2.0.2 (ISC); ISO 3166-1 codes via i18n-iso-countries 7.14.0 (MIT)';
const NAMES_SOURCE = `English names: Unicode CLDR ${process.versions.cldr} (Unicode License v3) as shipped in Node.js ${process.versions.node} (ICU ${process.versions.icu}), Intl.DisplayNames`;
const DISCLAIMER = 'Boundaries are Natural Earth de facto lines, drawn for orientation. They are not a political statement.';
const ILLUSTRATIVE = 'Star field illustrative of the frame: the shape of the place, not where people live or the panel size.';

// ---------- names and codes ----------
// i18n-iso-countries is the code source, but its name files are not on this machine and fetching them is a
// download nobody has approved, so English names come from CLDR as Node ships it. Readability rewrites: CLDR's
// "&" and "St." are spelled out, and the forms a screen reader would read badly are replaced (listed here).
const CLDR = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' });
const NAME_REWRITE = {
  'Congo - Kinshasa': 'Democratic Republic of the Congo', 'Congo - Brazzaville': 'Republic of the Congo',
  'Myanmar (Burma)': 'Myanmar', 'Hong Kong SAR China': 'Hong Kong', 'Macao SAR China': 'Macao',
  'St. Vincent & Grenadines': 'Saint Vincent and the Grenadines', 'Heard & McDonald Islands': 'Heard Island and McDonald Islands',
  'South Georgia & South Sandwich Islands': 'South Georgia and the South Sandwich Islands',
};
function englishName(c) {
  if (!c.a2) return c.name;                       // no ISO code: the Natural Earth name, as the brief says
  const n = CLDR.of(c.a2); if (!n) return c.name;
  return NAME_REWRITE[n] || n.replace(/ & /g, ' and ').replace(/^St\. /, 'Saint ');
}
// Natural Earth gives Kosovo XK / XKX. XK is user-assigned and kept by convention; XKX is not ISO and is not published.
const A3_OVERRIDE = { XK: null };
// Natural Earth's "Indian Ocean Ter." (Christmas Island and the Cocos (Keeling) Islands) has sovereign Australia but
// no numeric code, so the geometry file gave it no parent; ashmore-and-cartier-is got AU from its shared code.
const PARENT_OVERRIDE = { 'indian-ocean-ter': 'AU' };
// Features Natural Earth stores apart that a market's roster covers. Each rule is checked against the roster's own
// data every build; a rule whose evidence is missing is not applied, and the build says so.
const SIBLINGS = {
  FI: [{ key: 'AX', file: 'data/marginals/vaesto_kunta.csv', re: /^\d{3},[^,\n]+,21,Ahvenanmaa,/m,
    says: 'the Ahvenanmaa (Åland, maakunta 21) municipalities are rows of the FI roster margin data/marginals/vaesto_kunta.csv' }],
};
// names for the remote groups that end up in an inset or off the map, matched by feature and position (lon, lat
// in [-180, 180]); a group not listed here is reported by its centre only
const GROUP_NAMES = {
  JP: [['Ryukyu Islands', 122, 23.5, 131.6, 29.6], ['Ogasawara Islands', 141, 24, 143, 28]],
  US: [['Hawaii', -179, 18, -154, 29]],
  ES: [['Canary Islands', -18.5, 27.4, -13.2, 29.6]],
  PT: [['Azores', -31.6, 36.7, -24.7, 40.1], ['Madeira', -17.6, 29.8, -15.8, 33.3]],
  EC: [['Galápagos Islands', -92.6, -1.6, -89, 1.8]],
  FR: [['French Guiana', -54.8, 2, -51.4, 6], ['Guadeloupe', -61.9, 15.8, -60.9, 16.6], ['Martinique', -61.3, 14.3, -60.7, 15],
    ['Réunion', 55.1, -21.5, 56, -20.8], ['Mayotte', 44.9, -13.1, 45.4, -12.5]],
  NL: [['Bonaire', -68.5, 11.9, -68.1, 12.4], ['Saba and Sint Eustatius', -63.4, 17.4, -62.8, 17.8]],
  NZ: [['Auckland Islands', 165.7, -51, 166.5, -50.4], ['Campbell Island', 168.9, -52.7, 169.4, -52.3],
    ['Tokelau', -172.7, -9.6, -170.9, -8.3], ['Chatham Islands', -177, -44.6, -175.5, -43.4]],
  AU: [['Macquarie Island', 158.6, -54.9, 159.1, -54.4]],
  ZA: [['Prince Edward Islands', 37.4, -47.1, 38.1, -46.5]],
  PR: [['Mona Island', -68.1, 17.9, -67.7, 18.2]],
  FJ: [['Rotuma', 176.9, -12.7, 177.3, -12.3], ['Ceva-i-Ra', 174.4, -21.9, 174.8, -21.5]],
  TF: [['Crozet Islands', 50, -46.7, 52.5, -45.9]],
  GS: [['South Sandwich Islands', -28.5, -60, -26, -56]],
};

// ---------- market status, read from data/market-status.json (exported from population.py) ----------
function readStatus() {
  const out = {};
  for (const e of STATUS_JSON.markets) if (e.status === 'roster-ready' || e.status === 'registered') out[e.code] = e.status;
  if (!Object.keys(out).length) throw new Error(`no markets in ${STATUS_FILE}`);
  return out;
}

// ---------- small helpers ----------
const lcg = s => () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const segD = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const bboxOf = pts => { const b = [Infinity, Infinity, -Infinity, -Infinity]; for (const [x, y] of pts) { if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; } return b; };
const union = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const within = (b, B) => b[0] >= B[0] && b[1] >= B[1] && b[2] <= B[2] && b[3] <= B[3];
const shoelace = r => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return s / 2; };
const degSpan = b => Math.max(b[3] - b[1], (b[2] - b[0]) * Math.cos((b[1] + b[3]) / 2 * D2R));
const gapLL = (x, y) => { const cl = Math.cos((x[1] + x[3]) / 2 * D2R); return Math.hypot(Math.max(0, x[0] - y[2], y[0] - x[2]) * cl, Math.max(0, x[1] - y[3], y[1] - x[3])); };
const normLon = lo => ((((lo + 180) % 360) + 360) % 360) - 180;
const n1 = v => { let r = Math.round(v * 10) / 10; if (Object.is(r, -0)) r = 0; let s = String(r); if (s.startsWith('0.')) s = s.slice(1); else if (s.startsWith('-0.')) s = '-' + s.slice(2); return s; };
const nums = a => a.reduce((o, s, i) => o + (i && s[0] !== '-' ? ' ' : '') + s, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = v => Math.round(v * 10) / 10;
const pct = v => +(v * 100).toPrecision(3);

// Douglas–Peucker, iterative, endpoints kept
function dp(pts, tol) {
  const n = pts.length; if (n < 3) return pts.slice();
  const keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1;
  const st = [[0, n - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = segD(pts[i][0], pts[i][1], pts[a][0], pts[a][1], pts[b][0], pts[b][1]); if (d > mx) { mx = d; mi = i; } }
    if (mx > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// polyline → "M x y x y …" (implicit lineto), rounded to 0.1, consecutive duplicates dropped
function polyD(pts, close) {
  const a = []; let px = null, py = null;
  for (const [x, y] of pts) { const sx = n1(x), sy = n1(y); if (sx === px && sy === py) continue; a.push(sx, sy); px = sx; py = sy; }
  if (a.length < 4) return '';
  return 'M' + nums(a) + (close ? 'Z' : '');
}
// Liang–Barsky segment clip; returns [x0, y0, x1, y1, t0, t1] or null
function clipSeg(ax, ay, bx, by, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay;
  const p = [-dx, dx, -dy, dy], q = [ax - x0, x1 - ax, ay - y0, y1 - ay];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return null; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; } else { if (t < t0) return null; if (t < t1) t1 = t; }
  }
  return [ax + t0 * dx, ay + t0 * dy, ax + t1 * dx, ay + t1 * dy, t0, t1];
}
function clipPolyline(pts, box) {
  const out = []; let cur = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const r = clipSeg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], ...box);
    if (!r) { cur = null; continue; }
    if (!cur || r[4] > 0) { cur = [[r[0], r[1]]]; out.push(cur); }
    cur.push([r[2], r[3]]);
    if (r[5] < 1) cur = null;
  }
  return out.filter(l => l.length >= 2);
}
// the parts of a polyline outside every box (graticule and context lines stop at an inset's frame)
function clipOutside(line, boxes) {
  let lines = [line];
  for (const B of boxes) {
    const next = [];
    for (const l of lines) {
      let cur = [l[0]];
      for (let i = 0; i + 1 < l.length; i++) {
        const a = l[i], b = l[i + 1], r = clipSeg(a[0], a[1], b[0], b[1], ...B);
        if (!r) { cur.push(b); continue; }
        if (r[4] > 1e-9) cur.push([r[0], r[1]]);
        if (cur.length > 1) next.push(cur);
        cur = r[5] < 1 - 1e-9 ? [[r[2], r[3]], b] : [b];
      }
      if (cur.length > 1) next.push(cur);
    }
    lines = next;
  }
  return lines;
}
const star = (cx, cy, R, r = R * .27) => { // absolute 4-point star (Geo.dc.html star())
  const a = [];
  for (let i = 0; i < 8; i++) { const ang = (i * 45 - 90) * Math.PI / 180, rr = i % 2 ? r : R; a.push(n1(cx + rr * Math.cos(ang)), n1(cy + rr * Math.sin(ang))); }
  return 'M' + nums(a) + 'Z';
};
// the same star as a relative tail after "M x y-R": one string per radius, so a field of stars stays small
const tailCache = new Map();
function starTail(R) {
  const key = n1(R); if (tailCache.has(key)) return tailCache.get(key);
  const r = R * .27, k = Math.SQRT1_2 * r, a = R - k;
  const t = 'l' + nums([k, a, a, k, -a, k, -k, a, -k, -a, -a, -k, a, -k].map(n1)) + 'z';
  tailCache.set(key, t); return t;
}
const starField = (pts, R) => pts.map(p => 'M' + nums([n1(p[0]), n1(p[1] - R)]) + starTail(R)).join('');
const circ = (x, y, r) => `M${nums([n1(x - r), n1(y)])}a${nums([n1(r), n1(r)])} 0 1 0 ${nums([n1(2 * r), '0'])}a${nums([n1(r), n1(r)])} 0 1 0 ${nums([n1(-2 * r), '0'])}Z`;
const rectD = B => polyD([[B[0], B[1]], [B[2], B[1]], [B[2], B[3]], [B[0], B[3]]], true);

// ---------- world-wide indexes (set once in main) ----------
let WORLD = [], BY_KEY = new Map(), SHARED = new Set(), ACTIVE_SIBLINGS = {}, COVERED_BY = {};
// a vertex that two features share is a land border (world-atlas is TopoJSON: shared arcs, identical coordinates)
function indexBorders(countries) {
  const owner = new Map();
  for (const c of countries) for (const poly of c.parts) for (const ring of poly) for (const [lo, la] of ring) {
    const h = normLon(lo).toFixed(4) + ',' + la.toFixed(4), o = owner.get(h);
    if (o === undefined) owner.set(h, c.key); else if (o !== c.key) SHARED.add(h);
  }
}
const partIsIsland = poly => !poly[0].some(([lo, la]) => SHARED.has(normLon(lo).toFixed(4) + ',' + la.toFixed(4)));
function applySiblings(statusByA2) {
  const notes = [];
  for (const [host, rules] of Object.entries(SIBLINGS)) for (const r of rules) {
    // evidence: the exported status file lists the territory as covered by the host's roster
    const ok = STATUS_JSON.markets.some(e => e.code === r.key && e.status === 'covered' && e.coveredBy === host) && BY_KEY.has(r.key) && BY_KEY.has(host);
    if (!ok) { notes.push(`sibling ${r.key} → ${host} NOT applied: evidence missing in ${r.file}`); continue; }
    (ACTIVE_SIBLINGS[host] = ACTIVE_SIBLINGS[host] || []).push(r);
    if (statusByA2[host] === 'roster-ready') COVERED_BY[r.key] = { host, says: r.says, file: r.file };
    notes.push(`sibling ${r.key} drawn in ${host}'s map (${r.says})`);
  }
  return notes;
}

// ---------- framing ----------
const partArea = p => Math.abs(shoelace(p[0])) * Math.cos(p[0][0][1] * D2R);
// The verified frame holds the parts with >= 95 % of the area. Where that frame spans an ocean between two
// separate groups (France: the European mainland plus French Guiana), the country is framed on the group that
// holds the largest part instead — when that group holds >= 80 % of the area and is under 30 % of the frame's span.
function clusterFrame(c) {
  if (c.tier === 'micro' || c.a3 === 'ATA' || c.parts.length < 2) return null;
  const P = c.parts.map(p => ({ b: bboxOf(p[0]), a: partArea(p) }));
  const tot = P.reduce((s, o) => s + o.a, 0);
  const G = Math.max(1.5, 0.35 * degSpan(P[0].b));
  const inC = new Set([0]);
  for (let grown = true; grown;) { grown = false; P.forEach((o, i) => { if (inC.has(i)) return; for (const j of inC) if (gapLL(o.b, P[j].b) < G) { inC.add(i); grown = true; break; } }); }
  const share = [...inC].reduce((s, i) => s + P[i].a, 0) / tot;
  const cb = bboxOf([...inC].flatMap(i => [[P[i].b[0], P[i].b[1]], [P[i].b[2], P[i].b[3]]]));
  if (share >= 0.8 && degSpan(cb) <= 0.3 * degSpan(c.frame)) return { frame: cb, share };
  return null;
}
// a synthetic "country" whose only part is the frame rectangle: fitCountry then frames exactly that rectangle
function rectCountry(c, f) {
  const r = [], N = 16;
  for (let i = 0; i <= N; i++) { const t = i / N; r.push([f[0] + (f[2] - f[0]) * t, f[1]], [f[0] + (f[2] - f[0]) * t, f[3]], [f[0], f[1] + (f[3] - f[1]) * t], [f[2], f[1] + (f[3] - f[1]) * t]); }
  return { a3: c.a3, frame: f, bbox: f, parts: [[r]] };
}
function microFrame(c) {
  const f = c.bbox.slice(), latC = (f[1] + f[3]) / 2, cl = Math.cos(latC * D2R);
  const latS = f[3] - f[1], lonS = (f[2] - f[0]) * cl;
  if (latS < MICRO_MIN_SPAN) { f[1] = latC - MICRO_MIN_SPAN / 2; f[3] = latC + MICRO_MIN_SPAN / 2; }
  if (lonS < MICRO_MIN_SPAN) { const lc = (f[0] + f[2]) / 2, h = MICRO_MIN_SPAN / 2 / cl; f[0] = lc - h; f[2] = lc + h; }
  return f;
}
const allowedCost = share => { for (const [s, c] of WIDEN) if (share >= s) return c; return 0; };
// single linkage; two groups join when their gap is under max(1°, 1.2 × the larger group's span), so an island
// chain (Ryukyu, Azores) stays one group while a lone island beside a close one (Mona beside Vieques) does not join it
function clusterParts(idx, P) {
  let C = idx.map(i => ({ m: [i], b: P[i].ll.slice() }));
  for (let merged = true; merged;) {
    merged = false;
    outer: for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
      const thr = Math.max(1.0, 1.2 * Math.max(degSpan(C[i].b), degSpan(C[j].b)));
      if (!C[i].m.some(a => C[j].m.some(b => gapLL(P[a].ll, P[b].ll) < thr))) continue;
      C[i] = { m: C[i].m.concat(C[j].m), b: union(C[i].b, C[j].b) }; C.splice(j, 1); merged = true; break outer;
    }
  }
  return C;
}
// own parts plus the parts of any sibling the roster covers (Åland in Finland's map)
function featureParts(c) {
  const out = c.parts.map((poly, i) => ({ poly, src: c.key, i }));
  for (const r of ACTIVE_SIBLINGS[c.key] || []) BY_KEY.get(r.key).parts.forEach((poly, i) => out.push({ poly, src: r.key, i }));
  return out;
}
const isWhole = b => within(b, SAFE) && !hit(b, STATUS_KO);
// Decide the view: start on the frame, then bring in every part off it that is worth its cost in scale (WIDEN).
// What stays off is an inset (a group with >= INSET_MIN of the area) or omitted, and either way it is recorded.
function planView(c, parts) {
  const micro = c.tier === 'micro';
  const P = parts.map(p => ({ ll: bboxOf(p.poly[0]), a: partArea(p.poly) }));
  const tot = P.reduce((s, o) => s + o.a, 0) || 1;
  const cf = micro ? null : clusterFrame(c);
  let frame = micro ? microFrame(c) : (cf ? cf.frame : c.frame).slice();
  const base = frame.slice();
  const polys = parts.map(p => p.poly);
  const fit = f => micro ? fitCountry(rectCountry(c, f), W, W, PAD) : fitCountry({ a3: c.a3, frame: f, parts: polys }, W, W, PAD);
  const k0 = fit(frame).k, decided = new Map(), widened = [];
  const projBoxes = F => P.forEach((o, i) => { o.pb = bboxOf(parts[i].poly[0].map(([lo, la]) => F.project(lo, la))); });
  let F;
  for (let it = 0; it < 80; it++) {
    F = fit(frame); projBoxes(F);
    const open = P.map((o, i) => (!decided.has(i) && !isWhole(o.pb) ? i : -1)).filter(i => i >= 0);
    if (!open.length) break;
    const groups = clusterParts(open, P).map(g => ({ ...g, a: g.m.reduce((s, i) => s + P[i].a, 0) })).sort((x, y) => y.a - x.a);
    let grew = false;
    for (const G of groups) {
      const share = G.a / tot, f2 = union(frame, G.b), k2 = fit(f2).k;
      if (k2 >= (1 - allowedCost(share)) * k0) { frame = f2; widened.push({ parts: G.m.length, share, cost: 1 - k2 / k0 }); grew = true; break; }
      if (share >= INSET_MIN && !micro) { G.m.forEach(i => decided.set(i, 'inset')); continue; }
      // a group too small for an inset: its parts may still come in one at a time
      for (const i of [...G.m].sort((a, b) => P[b].a - P[a].a)) {
        const s = P[i].a / tot, f3 = union(frame, P[i].ll), k3 = fit(f3).k;
        if (k3 >= (1 - allowedCost(s)) * k0) { frame = f3; widened.push({ parts: 1, share: s, cost: 1 - k3 / k0 }); grew = true; break; }
      }
      if (grew) break;
      G.m.forEach(i => decided.set(i, 'omit'));
    }
  }
  F = fit(frame); projBoxes(F);
  const main = [], insetIdx = [], omitIdx = [];
  P.forEach((o, i) => { if (isWhole(o.pb)) main.push(i); else if (decided.get(i) === 'inset') insetIdx.push(i); else omitIdx.push(i); });
  const describe = (g, why) => ({ m: g.m, b: g.b, share: g.m.reduce((s, i) => s + P[i].a, 0) / tot, why, costIn: 1 - fit(union(frame, g.b)).k / k0 });
  const insets = clusterParts(insetIdx, P).map(g => describe(g, 'inset')).sort((x, y) => y.share - x.share);
  const omitted = clusterParts(omitIdx, P).map(g => describe(g, 'off-frame')).sort((x, y) => y.share - x.share);
  return { F, frame, base, k0, main, insets, omitted, widened, P, tot, cf };
}
const groupName = (key, b) => {
  const lo = normLon((b[0] + b[2]) / 2), la = (b[1] + b[3]) / 2;
  const hitName = (GROUP_NAMES[key] || []).find(([, x0, y0, x1, y1]) => lo >= x0 && lo <= x1 && la >= y0 && la <= y1);
  return hitName ? hitName[0] : null;
};

// ---------- projected geometry ----------
// a cut edge is an artefact of the source, not a coastline: the antimeridian seam (both ends on 180°) and the
// pole run of Antarctica. It stays in the ring (closure, inside parity) but is never stroked and never a keep-out edge.
const on180 = lon => Math.abs((((lon % 360) + 360) % 360) - 180) < 1e-3;
const isCut = (a, b) => (on180(a[0]) && on180(b[0])) || (a[1] < -89.9 && b[1] < -89.9);
// project one ring and simplify it with DP, keeping every cut edge as an edge
function projectRing(ring, P, tol) {
  let ll = ring;
  if (ll.length > 1 && ll[0][0] === ll[ll.length - 1][0] && ll[0][1] === ll[ll.length - 1][1]) ll = ll.slice(0, -1);
  const n = ll.length; if (n < 3) return null;
  const xy = ll.map(([lo, la]) => P(lo, la));
  const cut = ll.map((p, i) => isCut(p, ll[(i + 1) % n]));
  let pts, cutOut;
  if (!cut.some(Boolean)) {
    let far = 0, fd = -1; for (let i = 1; i < n; i++) { const d = Math.hypot(xy[i][0] - xy[0][0], xy[i][1] - xy[0][1]); if (d > fd) { fd = d; far = i; } }
    const A = dp(xy.slice(0, far + 1), tol), B = dp(xy.slice(far).concat([xy[0]]), tol);
    pts = A.concat(B.slice(1, -1)); cutOut = new Uint8Array(pts.length);
  } else {
    // runs of coastline between cut edges; each run simplified on its own. The walk starts just after a cut
    // edge and so ends on one: its last run is the start vertex again and is dropped.
    const s = (cut.indexOf(true) + 1) % n; pts = []; const flags = [];
    let run = [xy[s]];
    for (let k = 0; k < n; k++) {
      const i = (s + k) % n, j = (i + 1) % n;
      if (cut[i]) { const sr = dp(run, tol); sr.forEach((p, q) => { pts.push(p); flags.push(q === sr.length - 1 ? 1 : 0); }); run = [xy[j]]; }
      else run.push(xy[j]);
    }
    cutOut = Uint8Array.from(flags);
  }
  if (pts.length < 3) { pts = xy; cutOut = Uint8Array.from(cut.map(Number)); }   // a ring DP would collapse keeps its vertices
  return { pts, cut: cutOut, bb: bboxOf(pts) };
}
// geometry for a list of feature parts ({poly, src, i}) through one projection
function buildGeom(fparts, P, tol, minExtent) {
  const parts = [];
  fparts.forEach(fp => {
    const rings = [];
    fp.poly.forEach((ring, ri) => {
      const R = projectRing(ring, P, tol); if (!R) return;
      if (Math.max(R.bb[2] - R.bb[0], R.bb[3] - R.bb[1]) < minExtent && ri > 0) return;   // sub-pixel hole
      R.hole = ri > 0; rings.push(R);
    });
    if (!rings.length || rings[0].hole) return;
    // bbox and area over every ring: Antarctica is a pole ring whose "hole" is the coastline (even-odd),
    // so its first ring alone is a sub-pixel circle at the pole
    const bb = bboxOf(rings.flatMap(R => [[R.bb[0], R.bb[1]], [R.bb[2], R.bb[3]]]));
    const ar = rings.map(R => Math.abs(shoelace(R.pts))), area = Math.abs(ar[0] - ar.slice(1).reduce((a, b) => a + b, 0));
    parts.push({ i: fp.i, src: fp.src, rings, bb, area, extent: Math.max(bb[2] - bb[0], bb[3] - bb[1]), ll: fp.poly, island: partIsIsland(fp.poly) });
  });
  return parts;
}
// inside = crossing parity over every ring given (even-odd), with a bbox prefilter
function inside(rings, x, y) {
  let c = false;
  for (const R of rings) {
    const b = R.bb; if (y < b[1] || y > b[3] || x > b[2]) continue;
    const p = R.pts, n = p.length;
    for (let i = 0, j = n - 1; i < n; j = i++) { const yi = p[i][1], yj = p[j][1]; if ((yi > y) !== (yj > y) && x < (p[j][0] - p[i][0]) * (y - yi) / (yj - yi) + p[i][0]) c = !c; }
  }
  return c;
}
function near(rings, x, y, d) {
  for (const R of rings) {
    const b = R.bb; if (x < b[0] - d || x > b[2] + d || y < b[1] - d || y > b[3] + d) continue;
    const p = R.pts, n = p.length;
    for (let i = 0; i < n; i++) {
      if (R.cut[i]) continue; const a = p[i], q = p[(i + 1) % n];
      if ((a[0] < x - d && q[0] < x - d) || (a[0] > x + d && q[0] > x + d) || (a[1] < y - d && q[1] < y - d) || (a[1] > y + d && q[1] > y + d)) continue;
      if (segD(x, y, a[0], a[1], q[0], q[1]) < d) return true;
    }
  }
  return false;
}
function edgeDist(rings, x, y) {
  let m = Infinity;
  for (const R of rings) { const p = R.pts, n = p.length; for (let i = 0; i < n; i++) { if (R.cut[i]) continue; const a = p[i], q = p[(i + 1) % n]; const d = segD(x, y, a[0], a[1], q[0], q[1]); if (d < m) m = d; } }
  return m;
}
// an interior point for one part: its centroid when that is inside and clear of the coast, else the inside
// grid point farthest from the coast; a part too small for either gets its bbox centre
function interiorPoint(part) {
  const o = part.rings[0].pts; let A = 0, cx = 0, cy = 0;
  for (let i = 0, j = o.length - 1; i < o.length; j = i++) { const f = o[j][0] * o[i][1] - o[i][0] * o[j][1]; A += f; cx += (o[j][0] + o[i][0]) * f; cy += (o[j][1] + o[i][1]) * f; }
  const b = part.bb, mid = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  const cen = Math.abs(A) > 1e-9 ? [cx / (3 * A), cy / (3 * A)] : mid;
  if (part.extent < 2) return cen;
  const ok = p => inside(part.rings, p[0], p[1]);
  if (ok(cen) && edgeDist(part.rings, cen[0], cen[1]) >= Math.min(3, part.extent / 6)) return cen;
  let best = null, bd = -1; const N = 11;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const p = [b[0] + (b[2] - b[0]) * (i + .5) / N, b[1] + (b[3] - b[1]) * (j + .5) / N];
    if (!ok(p)) continue; const d = edgeDist(part.rings, p[0], p[1]); if (d > bd) { bd = d; best = p; }
  }
  return best || cen;
}
const inBox = (x, y, m = 3) => x >= m && x <= W - m && y >= m && y <= W - m;
// staggered lattice over every visible ring — Geo.dc.html lattice() generalised to many rings and holes:
// rows offset by half a pitch, seeded jitter ±0.18 p, keep-out 0.35 p from the hairline, narrow-feature second pass
function lattice(rings, bb, pitch, jit = 0.18, keep = 0.35, seed = SEED) {
  const rnd = lcg(seed), h = pitch * Math.sqrt(3) / 2, acc = [], rej = [];
  const x0 = Math.max(2, bb[0]), y0 = Math.max(2, bb[1]), x1 = Math.min(W - 2, bb[2]), y1 = Math.min(W - 2, bb[3]);
  for (let j = 0, y = y0 + h / 2; y < y1; j++, y += h) for (let x = x0 + (j % 2 ? pitch * 3 / 4 : pitch / 4); x < x1; x += pitch) {
    const jx = (rnd() * 2 - 1) * jit * pitch, jy = (rnd() * 2 - 1) * jit * pitch, s = rnd(), px = x + jx, py = y + jy;
    const pt = { x: px, y: py, gx: x, gy: y, row: j, s };
    if (!inBox(px, py) || !inside(rings, px, py)) rej.push({ ...pt, why: 'out' });
    else if (near(rings, px, py, keep * pitch)) rej.push({ ...pt, why: 'edge' });
    else acc.push(pt);
  }
  rej.forEach(p => {
    if (p.why !== 'edge') return;
    const q = !near(rings, p.x, p.y, 0.2 * pitch) ? [p.x, p.y]
      : inBox(p.gx, p.gy) && inside(rings, p.gx, p.gy) && !near(rings, p.gx, p.gy, 0.2 * pitch) ? [p.gx, p.gy] : null;
    if (q && acc.filter(a => Math.hypot(a.x - q[0], a.y - q[1]) < 1.5 * pitch).length <= 1) { p.x = q[0]; p.y = q[1]; p.why = 'fill'; acc.push(p); }
  });
  return acc;
}
const bbOfParts = ps => bboxOf(ps.flatMap(p => [[p.bb[0], p.bb[1]], [p.bb[2], p.bb[3]]]));

// ---------- outline strokes ----------
// closed rings stay closed; a ring with a cut edge, or one crossing the view, becomes open polylines clipped to it
function ringStroke(R, box) {
  const n = R.pts.length, b = R.bb, hasCut = R.cut.some(Boolean);
  const insideBox = b[0] >= box[0] && b[1] >= box[1] && b[2] <= box[2] && b[3] <= box[3];
  if (!hasCut && insideBox) return polyD(R.pts, true);
  const lines = [];
  if (!hasCut) lines.push(R.pts.concat([R.pts[0]]));
  else {
    const s = (R.cut.indexOf(1) + 1) % n; let cur = [R.pts[s]];
    for (let k = 0; k < n; k++) { const i = (s + k) % n, j = (i + 1) % n; if (R.cut[i]) { if (cur.length > 1) lines.push(cur); cur = [R.pts[j]]; } else cur.push(R.pts[j]); }
    if (cur.length > 1) lines.push(cur);
  }
  return lines.flatMap(l => insideBox ? [l] : clipPolyline(l, box)).map(l => polyD(l, false)).join('');
}

// ---------- graticule ----------
function graticule(F, frame, size, holes = [], tol = 0.2) {
  const polar = Math.abs(F.lat0) > 89, latS = frame[3] - frame[1], lonS = frame[2] - frame[0];
  const span = polar ? latS : Math.max(latS, lonS * Math.cos(F.lat0 * D2R));
  const step = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30].find(s => s >= span / 4) || 30;
  const lonStep = polar ? 30 : Math.abs(F.lat0) >= 70 ? step * 3 : Math.abs(F.lat0) >= 55 ? step * 2 : step;
  const ext = Math.max(span, step) * 1.6;
  const la0 = Math.max(-90, Math.floor((frame[1] - ext) / step) * step), la1 = Math.min(90, Math.ceil((frame[3] + ext) / step) * step);
  const cosm = Math.max(0.05, Math.cos(Math.min(85, Math.max(Math.abs(la0), Math.abs(la1))) * D2R));
  let lo0, lo1, full = false;
  if (polar || lonS + 2 * ext / cosm >= 360) { lo0 = F.lon0 - 180; lo1 = F.lon0 + 180; full = true; }
  else { lo0 = Math.floor((frame[0] - ext / cosm) / lonStep) * lonStep; lo1 = Math.ceil((frame[2] + ext / cosm) / lonStep) * lonStep; }
  const sp0 = Math.sin(F.lat0 * D2R), cp0 = Math.cos(F.lat0 * D2R);
  const vis = (lo, la) => sp0 * Math.sin(la * D2R) + cp0 * Math.cos(la * D2R) * Math.cos((lo - F.lon0) * D2R) > -0.2;
  const box = [0, 0, size, size], out = [];
  const trace = sample => {
    let cur = []; const segs = [];
    for (const [lo, la] of sample) { if (!vis(lo, la)) { if (cur.length > 1) segs.push(cur); cur = []; continue; } cur.push(F.project(lo, la)); }
    if (cur.length > 1) segs.push(cur);
    segs.forEach(s => clipPolyline(s, box).forEach(l => clipOutside(dp(l, tol), holes).forEach(m => out.push(polyD(m, false)))));
  };
  const inc = (a, b) => Math.max(1e-3, Math.min(step / 6, 0.5, (b - a) / 200));
  for (let k = Math.ceil(la0 / step); k * step <= la1 + 1e-9; k++) {
    const la = +(k * step).toFixed(6); if (Math.abs(la) >= 90) continue;
    const s = []; const d = inc(lo0, lo1); for (let lo = lo0; lo <= lo1 + 1e-9; lo += d) s.push([lo, la]); trace(s);
  }
  const mla0 = polar ? la0 : Math.max(la0, -89.5), mla1 = polar ? la1 : Math.min(la1, 89.5);
  for (let k = Math.ceil(lo0 / lonStep); k * lonStep <= lo1 + 1e-9; k++) {
    const lo = +(k * lonStep).toFixed(6); if (full && lo >= lo0 + 360 - 1e-9) continue;
    const s = []; const d = inc(mla0, mla1); for (let la = mla0; la <= mla1 + 1e-9; la += d) s.push([lo, la]); trace(s);
  }
  return { d: out.join(''), step, lonStep };
}

// ---------- context: neighbouring land as a faint hairline, no stars (dot-mode and capped maps) ----------
let PART_INDEX = null;   // [{key, ring, cx, cy, rad}] for every part of every feature, built once
function contextLayer(F, exclude, holes) {
  if (!PART_INDEX) PART_INDEX = WORLD.flatMap(o => o.parts.map(poly => {
    const b = bboxOf(poly[0]), cy = (b[1] + b[3]) / 2;
    return { key: o.key, ring: poly[0], cx: (b[0] + b[2]) / 2, cy, rad: Math.hypot((b[2] - b[0]) * Math.cos(cy * D2R), b[3] - b[1]) / 2 * D2R };
  }));
  const sp0 = Math.sin(F.lat0 * D2R), cp0 = Math.cos(F.lat0 * D2R);
  const cosc = (lo, la) => sp0 * Math.sin(la * D2R) + cp0 * Math.cos(la * D2R) * Math.cos((lo - F.lon0) * D2R);
  const R = Math.min(Math.PI / 2, 0.75 * W / F.k), box = [-2, -2, W + 2, W + 2], out = [];
  for (const o of PART_INDEX) {
    if (exclude.has(o.key)) continue;
    if (Math.acos(Math.max(-1, Math.min(1, cosc(o.cx, o.cy)))) > R + o.rad) continue;
    let cur = []; const segs = [];
    for (const [lo, la] of o.ring.concat([o.ring[0]])) { if (cosc(lo, la) < 0.2) { if (cur.length > 1) segs.push(cur); cur = []; continue; } cur.push(F.project(lo, la)); }
    if (cur.length > 1) segs.push(cur);
    for (const s of segs) for (const l of clipPolyline(s, box)) for (const m of clipOutside(l, holes)) { const d = polyD(dp(m, 0.4), false); if (d) out.push(d); }
  }
  return out.join('');
}

// ---------- dot mode ----------
// one star per island part, largest first (at most MICRO_CAP); stars that would touch are one star for the
// tight group, placed on its largest island
function dotStars(parts) {
  const isl = [...parts].sort((a, b) => b.area - a.area);
  const kept = isl.slice(0, MICRO_CAP), dropped = isl.slice(MICRO_CAP);
  const stars = [];
  for (const p of kept) {
    const q = interiorPoint(p), o = stars.find(s => Math.hypot(s.x - q[0], s.y - q[1]) < DOT_MIN);
    if (o) { o.parts.push(p); continue; }
    stars.push({ x: q[0], y: q[1], s: 1, parts: [p] });
  }
  return { stars, kept, dropped, merged: kept.length - stars.length };
}
// locator ring: one around the group when it is compact, else one per cluster of nearby islands
function locatorRings(isl) {
  if (!isl.length) return [];
  const allB = bbOfParts(isl);
  const gc = [(allB[0] + allB[2]) / 2, (allB[1] + allB[3]) / 2];
  const gR = Math.max(22, Math.hypot(allB[2] - allB[0], allB[3] - allB[1]) / 2 + 16);
  if (gR <= 96) return [{ x: gc[0], y: gc[1], r: gR }];
  const circles = isl.map(p => ({ x: (p.bb[0] + p.bb[2]) / 2, y: (p.bb[1] + p.bb[3]) / 2, r: Math.max(11, Math.hypot(p.bb[2] - p.bb[0], p.bb[3] - p.bb[1]) / 2 + 7), b: p.bb.slice() }));
  for (let merged = true; merged;) {
    merged = false;
    outer: for (let i = 0; i < circles.length; i++) for (let j = i + 1; j < circles.length; j++) {
      const A = circles[i], B = circles[j];
      if (Math.hypot(A.x - B.x, A.y - B.y) < A.r + B.r + 4) {
        const b = union(A.b, B.b);
        circles.splice(j, 1); circles[i] = { x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2, r: Math.max(11, Math.hypot(b[2] - b[0], b[3] - b[1]) / 2 + 7), b };
        merged = true; break outer;
      }
    }
  }
  return circles;
}

// ---------- insets ----------
// an inset box is free when no drawn coastline enters it (with a 6 px margin), it is not inside land, and it
// clears the status mark, the locator rings and the other insets
function boxFree(B, rings, circles, taken) {
  const E = [B[0] - 6, B[1] - 6, B[2] + 6, B[3] + 6];
  if (hit(E, STATUS_KO) || taken.some(T => hit(E, T))) return false;
  if (circles.some(o => hit(E, [o.x - o.r, o.y - o.r, o.x + o.r, o.y + o.r]))) return false;
  for (const R of rings) {
    if (!hit(E, R.bb)) continue;
    const p = R.pts, n = p.length;
    for (let i = 0; i < n; i++) { const a = p[i], q = p[(i + 1) % n]; if (clipSeg(a[0], a[1], q[0], q[1], ...E)) return false; }
  }
  return !inside(rings, (B[0] + B[2]) / 2, (B[1] + B[3]) / 2);
}
// Place one remote group in a box of its own: LAEA centred on the group, at the main map's scale when it fits
// (else smaller, and the ratio is recorded), in the free edge position nearest the group's true direction.
function placeInset(G, fparts, F, rings, circles, taken) {
  const lon0 = (G.b[0] + G.b[2]) / 2, lat0 = (G.b[1] + G.b[3]) / 2, Pg = laea(lon0, lat0);
  const ext = bboxOf(fparts.flatMap(p => p.poly[0].map(([lo, la]) => Pg(lo, la))));
  const gw = ext[2] - ext[0] || 1e-9, gh = ext[3] - ext[1] || 1e-9, maxIn = INSET_MAX - 2 * INSET_PAD;
  const k1 = Math.min(F.k, maxIn / gw, maxIn / gh);
  const tc = F.project(lon0, lat0), dx = tc[0] - W / 2, dy = tc[1] - W / 2, dl = Math.hypot(dx, dy) || 1;
  const target = [W / 2 + dx / dl * W, W / 2 + dy / dl * W];
  if (Math.max(gw, gh) * k1 < 6) return { fail: 'under 6 px at the map\'s scale, too small for an inset' };
  // every free edge position at full, 3/4 and 1/2 of the fitted scale; the best is the one nearest the group's
  // direction, where giving up scale costs as much as 400 px of distance per unit
  let best = null;
  for (const f of [1, 0.75, 0.5]) {
    const k = k1 * f, pw = gw * k, ph = gh * k;
    if (Math.max(pw, ph) < 6) break;
    const bw = Math.max(INSET_MIN_BOX, pw + 2 * INSET_PAD), bh = Math.max(INSET_MIN_BOX, ph + 2 * INSET_PAD);
    const lo = INSET_MARGIN, hx = W - INSET_MARGIN - bw, hy = W - INSET_MARGIN - bh, xs = [], ys = [];
    for (let x = lo; x < hx; x += 8) xs.push(x); xs.push(hx);
    for (let y = lo; y < hy; y += 8) ys.push(y); ys.push(hy);
    for (const [x, y] of [...xs.flatMap(x => [[x, lo], [x, hy]]), ...ys.flatMap(y => [[lo, y], [hx, y]])]) {
      const B = [x, y, x + bw, y + bh];
      const score = Math.hypot((B[0] + B[2]) / 2 - target[0], (B[1] + B[3]) / 2 - target[1]) + 400 * (1 - f);
      if (best && score >= best.score) continue;
      if (!boxFree(B, rings, circles, taken)) continue;
      best = { B, score, k, pw, ph, bw, bh };
    }
  }
  if (!best) return { fail: 'no room for an inset' };
  const { B, k, pw, ph, bw, bh } = best, ox = B[0] + (bw - pw) / 2 - ext[0] * k, oy = B[1] + (bh - ph) / 2 - ext[1] * k;
  return { box: B, scale: k / F.k, project: (lo2, la2) => { const [x, y] = Pg(lo2, la2); return [ox + x * k, oy + y * k]; } };
}

// ---------- one country map (shared by both themes) ----------
function buildMap(c, status) {
  const micro = c.tier === 'micro';
  const fparts = featureParts(c);
  const plan = planView(c, fparts);
  let F = plan.F;
  // magnification cap: a coarse 1:50m outline (a handful of vertices) is not blown up past a median edge of
  // MAX_EDGE px; the fitted view is scaled down about its centre instead
  let cap = 1;
  if (!micro) {
    const L = [];
    c.parts.slice(0, Math.max(1, c.frameParts)).forEach(p => { const r = p[0]; for (let i = 0; i + 1 < r.length; i++) { const a = F.project(r[i][0], r[i][1]), b = F.project(r[i + 1][0], r[i + 1][1]); L.push(Math.hypot(b[0] - a[0], b[1] - a[1])); } });
    L.sort((a, b) => a - b);
    const med = L[Math.floor(L.length / 2)];
    if (med > MAX_EDGE) {
      cap = med / MAX_EDGE; const F0 = F;
      F = { ...F0, k: F0.k / cap, project: (lo, la) => { const [x, y] = F0.project(lo, la); return [W / 2 + (x - W / 2) / cap, W / 2 + (y - W / 2) / cap]; } };
    }
  }
  const frame = plan.frame;
  const gframe = cap === 1 ? frame : (() => { const cx = (frame[0] + frame[2]) / 2, cy = (frame[1] + frame[3]) / 2, hx = (frame[2] - frame[0]) / 2 * cap, hy = (frame[3] - frame[1]) / 2 * cap; return [cx - hx, cy - hy, cx + hx, cy + hy]; })();
  const omitted = plan.omitted.map(g => ({ ...g }));
  // main view: only parts that lie whole inside it
  let mainParts = buildGeom(plan.main.map(i => fparts[i]), F.project, 0.3, 0.6);
  const notWhole = mainParts.filter(p => !isWhole(p.bb));      // the status corner after a cap (rare): off the map
  if (notWhole.length) { mainParts = mainParts.filter(p => isWhole(p.bb)); omitted.push({ m: [], b: bboxOf(notWhole.flatMap(p => p.ll[0])), share: 0, n: notWhole.length, why: 'status corner' }); }
  const below = mainParts.filter(p => p.extent < 0.6);
  const drawn = mainParts.filter(p => p.extent >= 0.6);
  const rings = drawn.flatMap(p => p.rings);
  const T = TIER[c.tier];
  // star mode: micro features, small hard-capped coarse outlines and lattices that stay sparse are dot mode
  let pitch = null, lat = null, mode = 'lattice';
  const span = drawn.length ? (b => Math.max(b[2] - b[0], b[3] - b[1]))(bbOfParts(drawn)) : 0;
  if (micro || (cap > DOT_CAP && span < DOT_EXTENT)) mode = 'dot';
  else {
    const bb = bbOfParts(drawn); pitch = T.pitch;
    for (;;) { lat = lattice(rings, bb, pitch); if (lat.length >= T.min || pitch * 0.82 < PITCH_FLOOR) break; pitch *= 0.82; }
    if (lat.length < T.min / 2) { mode = 'dot'; pitch = null; }   // a scatter of islands: dot mode
  }
  let dot = null, circles = [];
  if (mode === 'dot') { dot = dotStars(drawn); circles = locatorRings(dot.kept); }
  // insets for the remote groups, largest first
  const insets = [], taken = [];
  for (const G of plan.insets) {
    const gp = G.m.map(i => fparts[i]);
    const pl = insets.length < MAX_INSETS ? placeInset(G, gp, F, rings, circles, taken) : { fail: `more than ${MAX_INSETS} insets` };
    if (pl.fail) { omitted.push({ ...G, why: pl.fail }); continue; }
    const parts = buildGeom(gp, pl.project, 0.3, 0.6).filter(p => p.extent >= 0.6);
    insets.push({ ...G, box: pl.box, scale: pl.scale, parts }); taken.push(pl.box);
  }
  const holes = insets.map(s => s.box);
  // layers
  const grat = graticule(F, gframe, W, holes);
  const layers = [{ id: 'graticule', d: grat.d, kind: 'stroke', tok: 'grat', width: .75, ns: true }];
  const useContext = mode === 'dot' || cap > 1;
  if (useContext) layers.push({ id: 'context', d: contextLayer(F, new Set([c.key, ...(ACTIVE_SIBLINGS[c.key] || []).map(r => r.key)]), holes), kind: 'stroke', tok: 'context', width: .75, ns: true });
  const box = [-2, -2, W + 2, W + 2];
  const allDrawn = drawn.concat(insets.flatMap(s => s.parts));
  layers.push({ id: 'outline', d: allDrawn.flatMap(p => p.rings).map(R => ringStroke(R, box)).join(''), kind: 'stroke', tok: 'outline', width: 1, ns: true });
  if (insets.length) layers.push({ id: 'insets', d: holes.map(rectD).join(''), kind: 'stroke', tok: 'ring', width: 1, ns: true });
  let stars = [], fallback = 0, merged = 0, dotDropped = [];
  if (mode === 'dot') {
    stars = dot.stars; merged = dot.merged; dotDropped = dot.dropped;
    insets.forEach(s => { const d2 = dotStars(s.parts); stars = stars.concat(d2.stars); merged += d2.merged; dotDropped = dotDropped.concat(d2.dropped); });
    layers.push({ id: 'locator', d: circles.map(o => circ(o.x, o.y, o.r)).join(''), kind: 'stroke', tok: 'ring', width: 1, ns: true });
    layers.push({ id: 'stars', d: starField(stars.map(s => [s.x, s.y]), DOT_R), kind: 'fill', tok: 'star', op: 1, R: DOT_R });
  } else {
    stars = lat.slice();
    insets.forEach((s, si) => { if (s.parts.length) stars = stars.concat(lattice(s.parts.flatMap(p => p.rings), bbOfParts(s.parts), pitch, 0.18, 0.35, SEED + 1 + si)); });
    // islands the lattice missed: one star each when the island is at least ~half a pitch across (an Åland rule),
    // and on every visible part when the lattice alone is sparse
    const sparse = stars.length < T.min;
    const holder = p => stars.some(s => s.x >= p.bb[0] && s.x <= p.bb[2] && s.y >= p.bb[1] && s.y <= p.bb[3] && inside(p.rings, s.x, s.y));
    const add = [];
    for (const p of allDrawn) {
      if (add.length >= 160) break;
      const big = p.area >= (0.45 * pitch) ** 2;
      if (!big && !sparse) continue;
      if (holder(p)) continue;
      const q = interiorPoint(p); if (!inBox(q[0], q[1])) continue;
      const minD = sparse ? 2.2 * STAR_TIERS[2].R : 0.6 * pitch;
      if (stars.concat(add).some(s => Math.hypot(s.x - q[0], s.y - q[1]) < minD)) continue;
      add.push({ x: q[0], y: q[1], s: ((add.length * 7) % 9) / 9, isle: true });
    }
    fallback = add.length; stars = stars.concat(add);
    const f = Math.max(0.5, Math.min(1.1, pitch / 11.5));
    STAR_TIERS.forEach((t, ti) => {
      const lo = ti ? STAR_TIERS[ti - 1].lim : -1;
      const pts = stars.filter(s => s.s >= lo && s.s < t.lim).map(s => [s.x, s.y]);
      layers.push({ id: 'stars' + 'ABC'[ti], d: starField(pts, t.R * f), kind: 'fill', tok: 'star', op: t.op, R: t.R * f, pts });
    });
  }
  if (dotDropped.length) omitted.push({ m: [], b: bboxOf(dotDropped.flatMap(p => p.ll[0])), share: dotDropped.reduce((s, p) => s + partArea(p.ll), 0) / plan.tot, n: dotDropped.length, why: `dot mode shows the ${MICRO_CAP} largest parts` });
  if (status === 'roster-ready' || status === 'covered') layers.push({ id: 'status', d: star(STATUS_AT[0], STATUS_AT[1], 9), kind: 'fill', tok: 'signal' });
  else if (status === 'registered') layers.push({ id: 'status', d: circ(STATUS_AT[0], STATUS_AT[1], 6), kind: 'stroke', tok: 'neutral', width: 1.5 });
  // ---- checks: nothing half-drawn, no touching stars in one path
  const clipped = [];
  drawn.forEach(p => { if (!within(p.bb, [0, 0, W, W])) clipped.push(`main part ${p.src}#${p.i}`); });
  insets.forEach((s, si) => s.parts.forEach(p => { if (!within(p.bb, s.box)) clipped.push(`inset ${si} part ${p.src}#${p.i}`); }));
  let overlaps = 0;
  const pts = mode === 'dot' ? stars.map(s => [s.x, s.y, DOT_R]) : layers.filter(L => L.pts).flatMap(L => L.pts.map(p => [p[0], p[1], L.R]));
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j]; if (Math.abs(a[0] - b[0]) < a[2] + b[2] && Math.hypot(a[0] - b[0], a[1] - b[1]) < a[2] + b[2]) overlaps++; }
  const ob = bboxOf(allDrawn.flatMap(p => p.rings).flatMap(R => R.pts.filter(([x, y]) => x >= 0 && x <= W && y >= 0 && y <= W)));
  let longest = 0; drawn.flatMap(p => p.rings).forEach(R => { const p = R.pts; for (let i = 0; i < p.length; i++) { if (R.cut[i]) continue; const q = p[(i + 1) % p.length]; longest = Math.max(longest, Math.hypot(q[0] - p[i][0], q[1] - p[i][1])); } });
  const islands = allDrawn.filter(p => p.src === c.key);
  const dotKind = mode !== 'dot' ? null : islands.every(p => p.island) ? 'island' : islands.every(p => !p.island) ? 'place' : 'part';
  // groups that carry the same name and reason are one entry (Tokelau's atolls fall into two clusters)
  for (let i = 0; i < omitted.length; i++) for (let j = omitted.length - 1; j > i; j--) {
    const A = omitted[i], B = omitted[j], nm = groupName(c.key, A.b);
    if (!nm || nm !== groupName(c.key, B.b) || A.why !== B.why) continue;
    omitted[i] = { ...A, m: A.m.concat(B.m), n: (A.n || A.m.length) + (B.n || B.m.length), b: union(A.b, B.b), share: A.share + B.share, costIn: Math.max(A.costIn || 0, B.costIn || 0) };
    omitted.splice(j, 1);
  }
  const label = n => ({ ...(groupName(c.key, n.b) ? { name: groupName(c.key, n.b) } : {}), at:[r1(normLon((n.b[0] + n.b[2]) / 2)), r1((n.b[1] + n.b[3]) / 2)], parts: n.n || n.m.length, areaPct: pct(n.share) });
  return {
    layers, mode, dotKind, merged, stars: stars.length, fallback, pitch, cap, useContext, clipped, overlaps,
    frameScale: plan.F.k / plan.k0, widened: plan.widened,
    insets: insets.map(s => ({ ...label(s), scale: +s.scale.toFixed(2), box: s.box.map(r1) })),
    omitted: omitted.map(o => ({ ...label(o), why: o.why === 'off-frame' ? `off the frame; bringing it in would cost ${Math.round(o.costIn * 100)} % of the scale${o.share >= INSET_MIN ? '' : ', and it is under the inset threshold'}` : o.why })),
    belowResolution: below.length,
    siblings: (ACTIVE_SIBLINGS[c.key] || []).map(r => ({ key: r.key, drawn: drawn.filter(p => p.src === r.key).length })),
    note: cap > 1 ? `1:50m outline too coarse to fill the frame: drawn at 1/${cap.toFixed(1)} of full-frame scale` : null,
    frameNote: plan.cf ? `framed on the group holding the largest part (${(plan.cf.share * 100).toFixed(1)} % of the area)` : null,
    extent: [ob[2] - ob[0], ob[3] - ob[1]], longest, parts: fparts.length, drawnParts: allDrawn.length, step: grat.step, frame, baseFrame: plan.base,
  };
}

// ---------- the outline mark (48 px, 1.5 px stroke, currentColor) ----------
// framed on the map's planned view when that adds parts a 48 px glyph can draw (Jeju, Bornholm), else on the
// frame, so a widening for specks never shrinks the glyph. No insets: a remote group is recorded in the map's
// index entry and is not part of a 48 px glyph.
function buildMark(c, frame, baseFrame) {
  if (baseFrame && frame.some((v, i) => v !== baseFrame[i])) {
    const a = buildMark(c, frame), b = buildMark(c, baseFrame);
    return a.outlineParts + a.dots > b.outlineParts + b.dots ? { ...a, framed: 'view' } : { ...b, framed: 'frame' };
  }
  const micro = c.tier === 'micro', fparts = featureParts(c);
  const F = micro ? fitCountry(c, MARK, MARK, MARK_PAD) : fitCountry({ a3: c.a3, frame, parts: fparts.map(p => p.poly) }, MARK, MARK, MARK_PAD);
  const parts = buildGeom(fparts, F.project, 0.4, 2.2);
  const box = [-1, -1, MARK + 1, MARK + 1];
  const fits = p => p.bb[0] >= box[0] && p.bb[1] >= box[1] && p.bb[2] <= box[2] && p.bb[3] <= box[3];
  const inView = parts.filter(fits);
  const out = inView.filter((p, i) => i === 0 || (p.extent >= 3 && p.area >= 3));
  let dots = 0, d = out.map(p => p.rings.map(R => ringStroke(R, box)).join('')).join('');
  const ub = out.length ? bbOfParts(out) : [0, 0, 0, 0];
  if (Math.max(ub[2] - ub[0], ub[3] - ub[1]) < 16) {
    // a scatter of specks (atoll states): every part under 3 px becomes a 1.5 px ring at its centre, largest first
    const keepOut = out.filter(p => p.extent >= 3), centre = p => [(p.bb[0] + p.bb[2]) / 2, (p.bb[1] + p.bb[3]) / 2];
    d = keepOut.map(p => p.rings.map(R => ringStroke(R, box)).join('')).join('');
    const placed = keepOut.map(centre);
    for (const p of inView) {
      if (keepOut.includes(p)) continue;
      if (dots >= MICRO_CAP) break;
      const q = centre(p);
      if (placed.some(o => Math.hypot(o[0] - q[0], o[1] - q[1]) < 3.6)) continue;
      d += circ(q[0], q[1], 1.5); placed.push(q); dots++;
    }
  }
  return { d, dots, outlineParts: out.length };
}

// ---------- SVG writers ----------
const DOT_TEXT = { island: 'Dot mode: one star per island, or per tight group of islands. ', part: 'Dot mode: one star per part. ', place: 'Dot mode: one star marks a place too small for a lattice at this scale. ' };
function statusSentence(c) {
  if (c.status === 'covered') return `Market status: ${c.statusLabel}, which is ${STATUS_LABEL['roster-ready']} (from the market registry and ${COVERED_BY[c.key].file}).`;
  return `Market status: ${STATUS_LABEL[c.status]} (from the market registry).`;
}
function svgMap(c, m, theme) {
  const T = THEMES[theme];
  const inc = m.siblings.filter(s => s.drawn).map(s => BY_KEY.get(s.key)).map(o => englishName(o));
  const ins = m.insets.map(s => s.name || `parts near ${s.at[0]}, ${s.at[1]}`);
  const label = `${c.name}. ${inc.length ? `Includes ${inc.join(', ')}, covered by the same roster. ` : ''}${ins.length ? `Inset${ins.length > 1 ? 's' : ''}: ${ins.join('; ')}. ` : ''}${m.mode === 'dot' ? DOT_TEXT[m.dotKind] : ''}${ILLUSTRATIVE} ${statusSentence(c)}`;
  const body = m.layers.filter(L => L.d).map(L => {
    const [col, op] = T[L.tok];
    const o = L.op != null ? L.op : op;
    if (L.kind === 'fill') return `<path d="${L.d}" fill="${col}" fill-rule="nonzero"${o < 1 ? ` fill-opacity="${o}"` : ''}/>`;
    return `<path d="${L.d}" fill="none" stroke="${col}"${o < 1 ? ` stroke-opacity="${o}"` : ''} stroke-width="${L.width}" stroke-linejoin="round" stroke-linecap="round"${L.ns ? ' vector-effect="non-scaling-stroke"' : ''}/>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" role="img" aria-label="${esc(label)}" data-key="${esc(c.key)}" data-theme="${theme}" data-status="${c.status}" data-mode="${m.mode}" overflow="hidden">\n<title>${esc(c.name)}</title>\n${body}\n</svg>\n`;
}
function svgMark(c, k) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK} ${MARK}" width="${MARK}" height="${MARK}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" role="img" aria-label="${esc(c.name)}" data-key="${esc(c.key)}">\n<title>${esc(c.name)}</title>\n<path d="${k.d}"/>\n</svg>\n`;
}

// ---------- contact sheets (CanvasKit, from the same path strings and the same fill rule as the SVGs) ----------
async function renderSheets(list, models, marks) {
  const bin = path.join(PLAYER, 'node_modules', 'canvaskit-wasm', 'bin', 'full');
  const CK = await require(path.join(bin, 'canvaskit.js'))({ locateFile: f => path.join(bin, f) });
  const hex = (h, a = 1) => CK.Color(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a);
  // CanvasKit's default typeface has no glyphs: labels use the Inter file bundled with the lottie player
  const fontFile = [path.join(PLAYER, 'src', 'assets', 'fonts', 'Inter-VariableFont_opsz,wght.ttf'), 'C:/Windows/Fonts/arial.ttf'].find(f => fs.existsSync(f));
  const face = fontFile ? CK.Typeface.MakeTypefaceFromData(fs.readFileSync(fontFile).buffer.slice(0)) : null;
  const font = new CK.Font(face, 11), fontS = new CK.Font(face, 10), fontH = new CK.Font(face, 14);
  const parseFail = [];
  const pathOf = (d, who) => { const p = CK.Path.MakeFromSVGString(d); if (!p) parseFail.push(who); return p; };
  const drawLayers = (cv, layers, T, s, who) => {
    for (const L of layers) {
      if (!L.d) continue;
      const p = pathOf(L.d, `${who}:${L.id}`); if (!p) continue;
      const [col, op] = T[L.tok], o = L.op != null ? L.op : op;
      const paint = new CK.Paint(); paint.setAntiAlias(true); paint.setColor(hex(col, o));
      if (L.kind === 'fill') { p.setFillType(CK.FillType.Winding); paint.setStyle(CK.PaintStyle.Fill); }   // = fill-rule="nonzero"
      else { paint.setStyle(CK.PaintStyle.Stroke); paint.setStrokeWidth(L.ns ? L.width / s : L.width); paint.setStrokeJoin(CK.StrokeJoin.Round); paint.setStrokeCap(CK.StrokeCap.Round); }
      cv.drawPath(p, paint); p.delete(); paint.delete();
    }
  };
  const text = (cv, s, x, y, col, f, maxW) => {
    let t = s.replace(/·/g, '-').replace(/[’‘]/g, "'").replace(/[^ -~]/g, c => c.normalize('NFD')[0].replace(/[^ -~]/, '?')); const ids = f.getGlyphIDs(t); let w = f.getGlyphWidths(ids).reduce((a, b) => a + b, 0);
    while (maxW && w > maxW && t.length > 3) { t = t.slice(0, -2) + '.'; w = f.getGlyphWidths(f.getGlyphIDs(t)).reduce((a, b) => a + b, 0); }
    const p = new CK.Paint(); p.setColor(hex(col)); p.setAntiAlias(true); cv.drawText(t, x, y, p, f); p.delete();
  };
  const chunks = []; const per = Math.ceil(list.length / Math.max(1, Math.round(list.length / 60)));
  for (let i = 0; i < list.length; i += per) chunks.push(list.slice(i, i + per));
  const files = [];
  const COLS = 10, CELL = 176, GAP = 8, LBL = 30, M = 16, HEAD = 44;
  for (const theme of ['night', 'day']) {
    const T = THEMES[theme];
    chunks.forEach((chunk, ci) => {
      const rows = Math.ceil(chunk.length / COLS), Wd = M * 2 + COLS * CELL + (COLS - 1) * GAP, Ht = HEAD + rows * (CELL + LBL + GAP) + M;
      const surf = CK.MakeSurface(Wd, Ht), cv = surf.getCanvas(); cv.clear(hex(T.ground));
      text(cv, `Northstar country maps · ${theme} · sheet ${ci + 1}/${chunks.length} · ${chunk[0].key} to ${chunk[chunk.length - 1].key} · 512 px assets shown at ${CELL} px`, M, 26, T.label, fontH);
      chunk.forEach((c, i) => {
        const x = M + (i % COLS) * (CELL + GAP), y = HEAD + Math.floor(i / COLS) * (CELL + LBL + GAP), s = CELL / W, m = models.get(c.key);
        const fr = new CK.Paint(); fr.setStyle(CK.PaintStyle.Stroke); fr.setColor(hex(T.cell)); fr.setStrokeWidth(1); cv.drawRect(CK.XYWHRect(x - .5, y - .5, CELL + 1, CELL + 1), fr); fr.delete();
        cv.save(); cv.clipRect(CK.XYWHRect(x, y, CELL, CELL), CK.ClipOp.Intersect, true); cv.translate(x, y); cv.scale(s, s);
        drawLayers(cv, m.layers, T, s, `${theme}/${c.key}`); cv.restore();
        text(cv, `${c.key}  ${c.name}`, x, y + CELL + 13, T.label, font, CELL);
        const st = c.status === 'roster-ready' ? ' · ROSTER-READY' : c.status === 'registered' ? ' · REGISTERED' : c.status === 'covered' ? ' · COVERED' : '';
        const ex = `${m.insets.length ? ` · ${m.insets.length} inset` : ''}${m.omitted.length ? ` · ${m.omitted.length} off` : ''}${m.useContext ? ' · ctx' : ''}`;
        text(cv, `${c.tier} · ${m.mode}${ex}${st}`, x, y + CELL + 26, T.faint, fontS, CELL);
      });
      const f = path.join(RENDERS, `sheet-${theme}-${ci + 1}.png`);
      fs.writeFileSync(f, Buffer.from(surf.makeImageSnapshot().encodeToBytes())); surf.delete(); files.push(f);
    });
  }
  // marks: 2× and 1×, ink on Day ground
  const MC = 168, MR = 96 + LBL;
  chunks.forEach((chunk, ci) => {
    const T = THEMES.day, rows = Math.ceil(chunk.length / COLS), Wd = M * 2 + COLS * MC + (COLS - 1) * GAP, Ht = HEAD + rows * (MR + GAP) + M;
    const surf = CK.MakeSurface(Wd, Ht), cv = surf.getCanvas(); cv.clear(hex(T.ground));
    text(cv, `Northstar country marks · sheet ${ci + 1}/${chunks.length} · 48 px design size, 1.5 px stroke · shown at 2x and 1x`, M, 26, T.label, fontH);
    chunk.forEach((c, i) => {
      const x = M + (i % COLS) * (MC + GAP), y = HEAD + Math.floor(i / COLS) * (MR + GAP), k = marks.get(c.key);
      [[2, x, y], [1, x + 108, y + 24]].forEach(([s, bx, by]) => {
        const fr = new CK.Paint(); fr.setStyle(CK.PaintStyle.Stroke); fr.setColor(hex(T.cell)); cv.drawRect(CK.XYWHRect(bx - .5, by - .5, MARK * s + 1, MARK * s + 1), fr); fr.delete();
        if (!k.d) return;
        const p = pathOf(k.d, `mark/${c.key}`); if (!p) return;
        const paint = new CK.Paint(); paint.setAntiAlias(true); paint.setStyle(CK.PaintStyle.Stroke); paint.setColor(hex('#06080C')); paint.setStrokeWidth(1.5); paint.setStrokeJoin(CK.StrokeJoin.Round); paint.setStrokeCap(CK.StrokeCap.Round);
        cv.save(); cv.translate(bx, by); cv.scale(s, s); cv.drawPath(p, paint); cv.restore(); p.delete(); paint.delete();
      });
      text(cv, `${c.key}  ${c.name}`, x, y + 96 + 14, T.label, font, MC);
    });
    const f = path.join(RENDERS, `sheet-marks-${ci + 1}.png`);
    fs.writeFileSync(f, Buffer.from(surf.makeImageSnapshot().encodeToBytes())); surf.delete(); files.push(f);
  });
  // large single renders for close inspection (scratch)
  for (const key of ZOOM) {
    const c = list.find(x => x.key === key); if (!c) continue;
    const surf = CK.MakeSurface(W * 2 + 24, W), cv = surf.getCanvas(); cv.clear(hex(THEMES.night.ground));
    const dayBg = new CK.Paint(); dayBg.setColor(hex(THEMES.day.ground)); cv.drawRect(CK.XYWHRect(W + 24, 0, W, W), dayBg);
    drawLayers(cv, models.get(key).layers, THEMES.night, 1, `zoom/${key}`);
    cv.save(); cv.translate(W + 24, 0); drawLayers(cv, models.get(key).layers, THEMES.day, 1, `zoom/${key}`); cv.restore();
    const f = path.join(RENDERS, `zoom-${key}.png`); fs.writeFileSync(f, Buffer.from(surf.makeImageSnapshot().encodeToBytes())); surf.delete(); files.push(f);
  }
  return { files, parseFail };
}

// ---------- main ----------
(async () => {
  const geo = JSON.parse(fs.readFileSync(GEO_FILE, 'utf8'));
  WORLD = geo.countries; BY_KEY = new Map(WORLD.map(c => [c.key, c]));
  indexBorders(WORLD);
  const status = readStatus();
  const sibNotes = applySiblings(status);
  const statusOf = c => (c.a2 && status[c.a2]) || (COVERED_BY[c.key] ? 'covered' : 'none');
  const list = WORLD.filter(c => !ONLY || ONLY.has(c.key)).map(c => {
    const st = statusOf(c), cov = COVERED_BY[c.key];
    return { ...c, neName: c.name, name: englishName(c), a3: c.key in A3_OVERRIDE ? A3_OVERRIDE[c.key] : c.a3,
      parent: PARENT_OVERRIDE[c.key] || c.parent || (cov ? cov.host : undefined), status: st,
      statusLabel: st === 'covered' ? `Covered by ${cov.host} roster` : STATUS_LABEL[st] };
  });
  for (const d of ['night', 'day', 'marks']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  fs.mkdirSync(RENDERS, { recursive: true });
  const models = new Map(), marks = new Map(), index = [], flags = [], failures = [];
  let bytes = { night: 0, day: 0, marks: 0 };
  const t0 = Date.now();
  for (const c of list) {
    const m = buildMap(c, c.status), k = buildMark(c, m.frame, m.baseFrame);
    models.set(c.key, m); marks.set(c.key, k);
    if (m.clipped.length) failures.push(`${c.key}: ${m.clipped.join(', ')}`);
    const files = { night: `night/${c.key}.svg`, day: `day/${c.key}.svg`, mark: `marks/${c.key}.svg` };
    for (const th of ['night', 'day']) { const s = svgMap(c, m, th); fs.writeFileSync(path.join(OUT, files[th]), s); bytes[th] += Buffer.byteLength(s); }
    const ms = svgMark(c, k); fs.writeFileSync(path.join(OUT, files.mark), ms); bytes.marks += Buffer.byteLength(ms);
    const cov = COVERED_BY[c.key], inc = m.siblings.filter(s => s.drawn);
    index.push({
      key: c.key, a2: c.a2, a3: c.a3, name: c.name, neName: c.neName, tier: c.tier, status: c.status, statusLabel: c.statusLabel,
      ...(cov ? { coveredBy: cov.host, coverage: cov.says } : {}), ...(c.parent ? { parent: c.parent } : {}),
      ...(inc.length ? { includes: inc.map(s => ({ key: s.key, name: englishName(BY_KEY.get(s.key)), why: ACTIVE_SIBLINGS[c.key].find(r => r.key === s.key).says })) } : {}),
      mode: m.mode, caption: ILLUSTRATIVE,
      ...(Math.abs(m.frameScale - 1) > 0.005 ? { frameScale: +m.frameScale.toFixed(2) } : {}),
      ...(m.insets.length ? { insets: m.insets } : {}),
      ...(m.omitted.length ? { omittedParts: m.omitted } : {}),
      ...(m.belowResolution ? { partsBelowResolution: m.belowResolution } : {}),
      ...(m.frameNote ? { frame: m.frameNote } : {}), ...(m.note ? { note: m.note } : {}), files });
    const use = W - 2 * PAD;
    if (!m.stars) flags.push(`${c.key}: no stars`);
    if (m.mode === 'dot' && m.overlaps) flags.push(`${c.key}: ${m.overlaps} touching dot stars`);
    if (c.tier !== 'micro' && m.cap === 1 && Math.max(m.extent[0], m.extent[1]) < 0.6 * use) flags.push(`${c.key}: drawn extent ${m.extent.map(v => v.toFixed(0)).join('×')} px`);
    if (m.longest > 180) flags.push(`${c.key}: longest stroked segment ${m.longest.toFixed(0)} px`);
    if (!k.d) flags.push(`${c.key}: empty mark`);
  }
  if (failures.length) { console.error('BUILD FAILED: drawn parts cut by the view or their inset box\n  ' + failures.join('\n  ')); process.exit(2); }
  if (!ONLY) {
    fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');
    fs.writeFileSync(path.join(OUT, 'PROVENANCE.md'), provenanceMd(index, list));
  }
  const tiers = {}, modes = {}, stat = {};
  index.forEach(e => { tiers[e.tier] = (tiers[e.tier] || 0) + 1; modes[e.mode] = (modes[e.mode] || 0) + 1; stat[e.status] = (stat[e.status] || 0) + 1; });
  console.log(`built ${index.length} features in ${((Date.now() - t0) / 1000).toFixed(1)} s`, JSON.stringify({ tiers, modes, status: stat }));
  sibNotes.forEach(n => console.log(n));
  console.log('bytes', JSON.stringify(bytes), 'total', ((bytes.night + bytes.day + bytes.marks) / 1048576).toFixed(2), 'MB');
  const big = index.map(e => ({ k: e.key, s: fs.statSync(path.join(OUT, e.files.night)).size })).sort((a, b) => b.s - a.s).slice(0, 6);
  console.log('largest night files', big.map(b => `${b.k} ${(b.s / 1024).toFixed(0)} KB`).join(', '));
  console.log('dot mode outside micro', index.filter(e => e.mode === 'dot' && e.tier !== 'micro').map(e => e.key).join(' ') || 'none');
  console.log('magnification capped', list.filter(c => models.get(c.key).cap > 1).map(c => c.key + ' 1/' + models.get(c.key).cap.toFixed(2)).join(' ') || 'none');
  console.log('context layer', list.filter(c => models.get(c.key).useContext).length, 'maps');
  console.log('widened', list.filter(c => models.get(c.key).widened.length).map(c => `${c.key} x${models.get(c.key).frameScale.toFixed(2)}`).join(' '));
  console.log('insets', index.filter(e => e.insets).map(e => `${e.key}[${e.insets.map(s => `${s.name || s.at} @${s.scale}`).join('; ')}]`).join(' '));
  console.log('omitted', index.filter(e => e.omittedParts).map(e => `${e.key}[${e.omittedParts.map(s => `${s.name || s.at} ${s.areaPct}% (${s.why})`).join('; ')}]`).join('\n  '));
  console.log('marks framed on the widened view', list.filter(c => marks.get(c.key).framed === 'view').map(c => c.key).join(' ') || 'none', '| on the frame', list.filter(c => marks.get(c.key).framed === 'frame').map(c => c.key).join(' ') || 'none');
  console.log('dot merges', list.filter(c => models.get(c.key).merged).map(c => `${c.key}:${models.get(c.key).merged}`).join(' ') || 'none');
  console.log('dot wording', ['island', 'part', 'place'].map(k => `${k}: ${list.filter(c => models.get(c.key).dotKind === k).map(c => c.key).join(' ')}`).join(' | '));
  console.log('lattice overlaps (pairs, all maps)', list.reduce((s, c) => s + (models.get(c.key).mode === 'lattice' ? models.get(c.key).overlaps : 0), 0));
  console.log('flags', flags.length ? '\n  ' + flags.join('\n  ') : 'none');
  if (SHEETS) { const r = await renderSheets(list, models, marks); console.log('sheets', r.files.map(f => path.basename(f)).join(' ')); console.log('CanvasKit parse failures', r.parseFail.length ? r.parseFail.join(' ') : 'none'); }
})().catch(e => { console.error(e); process.exit(1); });

function provenanceMd(index, list) {
  const ready = index.filter(e => e.status === 'roster-ready').map(e => `${e.a2} ${e.name}`), reg = index.filter(e => e.status === 'registered').map(e => `${e.a2} ${e.name}`);
  const cov = index.filter(e => e.status === 'covered').map(e => `${e.a2} ${e.name} (by ${e.coveredBy})`);
  const noIso = index.filter(e => !e.a2).map(e => `\`${e.key}\` (${e.name}${e.parent ? `, parent ${e.parent}` : ', no parent: a disputed or de facto entity'})`);
  const t = k => index.filter(e => e.tier === k).length;
  const rewrites = Object.entries(NAME_REWRITE).map(([a, b]) => `"${a}" → "${b}"`).join('; ');
  const changed = list.filter(c => c.name !== c.neName).length;
  const fmtG = g => `${g.name || `parts near ${g.at[0]}, ${g.at[1]}`} (${g.parts} part${g.parts > 1 ? 's' : ''}, ${g.areaPct} % of the area`;
  const insetRows = index.filter(e => e.insets).map(e => `| ${e.key} ${e.name} | ${e.insets.map(s => `${fmtG(s)}, ${s.scale === 1 ? 'same scale' : `${s.scale}× the map's scale`})`).join('; ')} |`).join('\n');
  const omitRows = index.filter(e => e.omittedParts).map(e => `| ${e.key} ${e.name} | ${e.omittedParts.map(s => `${fmtG(s)}): ${s.why}`).join('; ')} |`).join('\n');
  const wid = index.filter(e => e.frameScale).map(e => `${e.key} ${e.frameScale}`).join(', ');
  const below = index.filter(e => e.partsBelowResolution).map(e => `${e.key} ${e.partsBelowResolution}`).join(', ');
  return `# Northstar country maps — provenance

## Source

${PROVENANCE}.

${NAMES_SOURCE}.

${DISCLAIMER}

## Names and codes

- \`name\` is the English short name. For a feature with an ISO 3166-1 code it comes from CLDR (above), because
  the i18n-iso-countries name files are not part of this build; CLDR's "&" and "St." are spelled out ("and",
  "Saint") and these forms are rewritten for screen readers: ${rewrites}. ${changed} names differ from Natural Earth's.
- \`neName\` is the Natural Earth name, kept for every feature so a consumer can join on it.
- Features without an ISO 3166-1 code keep their Natural Earth names and are keyed by a slug. No code is invented
  beyond XK (Kosovo, a user-assigned code kept by convention); its \`a3\` is null, because XKX is not ISO.
  Slug-keyed features: ${noIso.join(', ')}.
- \`parent\` names the sovereign for a dependency that has no code of its own: ashmore-and-cartier-is (shares
  Australia's numeric code) and indian-ocean-ter (Christmas Island and the Cocos (Keeling) Islands; Natural Earth's
  sovereign is Australia). AX has parent FI (see below).

## Market status

Every map carries a market status, read from \`data/market-status.json\` when the files are
generated (exported from \`roster_ready\` in each registered \`PopulationSpec\` of the engine's population.py). It is written to \`index.json\`, to the
\`data-status\` attribute and the aria-label of each map, and drawn as a shape-coded mark in the top-right corner:

| Status | Mark | Markets |
|---|---|---|
| Roster-ready | filled north star, Glacier (Night \`#93B4E0\`, Day \`#2F5D9A\`) | ${ready.join(', ')} |
| Covered by a roster | the same filled north star: the place is inside a roster-ready market's panel | ${cov.join(', ') || 'none'} |
| Registered · not calibrated | hollow ring, neutral | ${reg.join(', ')} |
| Not available | no mark | every other feature |

A map may show any country. It never implies that a calibrated panel, a composition or results exist where they
do not. Composition (margins) is drawn only for roster-ready markets, and never in these files. The published error
bands were measured against Finnish published figures.

### Features a roster covers (sibling rule)

Natural Earth stores some places apart from the country whose roster covers them. Such a place is drawn in that
country's map, on the same lattice and island-star rules, and its own entry says who covers it. Each rule is
checked against the roster's data every build and is not applied if the evidence is missing:

${Object.entries(SIBLINGS).map(([h, rs]) => rs.map(r => `- ${r.key} in ${h}: ${r.says}. In \`index.json\`, ${h} lists it under \`includes\`, and ${r.key} has \`status: "covered"\`, \`coveredBy: "${h}"\` and \`parent: "${h}"\`.`).join('\n')).join('\n')}

## What the stars mean

Stars are agents, but these star fields are illustrative of the frame: the shape of the place, not where people live
or the panel size. That holds for every file here, the roster-ready markets included; only a roster-ready market's
composition card places stars by measured composition. Every \`index.json\` entry carries the sentence in \`caption\`
so a consumer can print it next to the map, and no star count is published.

## Framing: what is in each view, and what is not

- Projection: Lambert azimuthal equal-area centred on the view, north up (Antarctica: polar), fitted to 512 × 512
  with 40 px padding by \`fitCountry\` in \`tools/geo-proj.js\`. The view starts on the frame: the bbox of the parts
  holding at least 95 % of the area (France: its European group, because that frame reaches French Guiana).
- A part is drawn whole or not at all. Every part that would be cut by the view is brought in when that costs at most
  35 % of the scale (a group with at least 1 % of the area), 25 % (0.1 %), 16 % (0.01 %) or 5 % (smaller). Views
  widened this way, with their scale against the frame: ${wid}.
- A group that would cost more and holds at least 0.05 % of the area gets an inset: a hairline box in a free corner or
  edge, its own LAEA centred on the group, at the map's scale where it fits (else smaller; the ratio is in
  \`insets[].scale\`), with the same lattice and island-star rules. At most ${MAX_INSETS} per map.
- Anything else is left out and listed in \`omittedParts\` (name where known, centre, part count, share of the area,
  reason). Nothing is dropped silently. The build fails if any drawn part is cut by the view or by its inset box.
- Parts inside the view but under 0.6 px across are not drawn (\`partsBelowResolution\`): ${below || 'none'}.

| Feature | Insets |
|---|---|
${insetRows}

| Feature | Left out of the map |
|---|---|
${omitRows}

## Construction

- Star lattice (standard ${t('standard')}, small ${t('small')}): staggered rows, pitch 12 px (standard) or 9.5 px (small),
  seeded jitter ±0.18 pitch (LCG ${SEED}), keep-out 0.35 pitch from the coastline, the narrow-feature second pass of
  \`Geo.dc.html\` lattice(). A lattice with fewer than 100 (standard) or 12 (small) stars is refined down to a 5 px
  pitch. An island at least half a pitch across that the lattice missed gets one star; when the lattice is still
  sparse, every visible island does.
- Magnification cap: where the 1:50m outline has so few vertices that fitting it to the frame would turn it into a
  coarse polygon (median edge over ${MAX_EDGE} px), the view is scaled down about its centre until the median edge is
  ${MAX_EDGE} px. Those features carry a \`note\` in \`index.json\`. A feature capped by more than ${DOT_CAP}× that is then
  drawn under ${DOT_EXTENT} px across is drawn in dot mode, like its smaller neighbours.
- Dot mode (micro ${t('micro')}, plus ${index.filter(e => e.mode === 'dot' && e.tier !== 'micro').map(e => e.key).join(', ')}): one star per part, largest parts
  first (at most ${MICRO_CAP}), over a faint locator ring; stars that would touch become one star for the tight group. The
  aria-label says "per island" only where no part has a land border (shared Natural Earth vertices), "a place" where
  every part has one (Andorra, Monaco, …) and "per part" otherwise. A micro view spans at least ${MICRO_MIN_SPAN}°.
- Context: dot-mode and capped maps draw the neighbouring land (outer rings of every other feature, same geometry) as a
  faint hairline with no stars, so a speck reads as a place on a coast or in a country.
- Inside tests use crossing parity over all of a feature's rings (even-odd). The antimeridian seam and Antarctica's
  pole run stay in the rings for parity but are never stroked and never act as coastline.
- Outline hairline 1 px, graticule and context 0.75 px, all \`vector-effect="non-scaling-stroke"\`; transparent
  background. Star paths set \`fill-rule="nonzero"\`, and the contact sheets fill with the same rule.
- Marks: 48 px design size, framed on the map's view where that adds a part the glyph can draw, else on the frame
  (no insets), Douglas–Peucker at 0.4 px, 1.5 px stroke in
  \`currentColor\`; parts under 3 px are dropped, except that a scatter of specks (atoll states) is drawn as one small
  ring per island.

Regenerate with \`node tools/build-country-maps.js\` (writes this folder and the contact sheets in \`renders/maps/\`).
`;
}
