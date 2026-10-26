// Decodes Natural Earth 1:50m (world-atlas@2.0.2 countries-50m.json, TopoJSON) into a plain
// lon/lat geometry module keyed by ISO 3166-1, with antimeridian-safe rings, bboxes, centroids,
// areas and two projections every Northstar map uses. No dependencies; the TopoJSON decoder is
// written here so nothing from the download is executed.
//
// node build-world-geo.js <countries-50m.json> <codes.json> <out-dir>
// writes <out-dir>/world-geo.json (full detail) and world-geo.min.json (simplified for thumbnails)
const fs = require('fs');
const path = require('path');

const [topoFile, codesFile, outDir] = process.argv.slice(2);
const topo = JSON.parse(fs.readFileSync(topoFile, 'utf8'));
const codes = JSON.parse(fs.readFileSync(codesFile, 'utf8'));      // [[alpha2, alpha3, numeric, iso3166-2], ...]
const byNum = new Map(codes.map(([a2, a3, num]) => [num, { a2, a3 }]));

// ---- TopoJSON: quantized, delta-encoded arcs → absolute lon/lat
const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
const arcs = topo.arcs.map(arc => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arcPts = i => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
const ring = idx => { const out = []; idx.forEach((a, k) => { const p = arcPts(a); out.push(...(k ? p.slice(1) : p)); }); return out; };
const polys = g => (g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : []);

// ---- geometry helpers (lon/lat, planar after unwrapping — fine for areas used only to rank parts)
const shoelace = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; };
const D2R = Math.PI / 180;
// Unwrap a country across the antimeridian: if its longitudes span > 180°, shift the western part by +360.
function unwrap(parts) {
  const lons = parts.flat(2).map(p => p[0]);
  if (Math.max(...lons) - Math.min(...lons) <= 180) return { parts, shifted: false };
  return { parts: parts.map(poly => poly.map(r => r.map(([lo, la]) => [lo < 0 ? lo + 360 : lo, la]))), shifted: true };
}
const bboxOf = pts => pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
// area-weighted centroid of the largest polygon (the "mainland"), in unwrapped lon/lat, cos(lat)-weighted
function centroid(poly) {
  const r = poly[0], k = Math.cos(r.reduce((s, p) => s + p[1], 0) / r.length * D2R);
  let A = 0, cx = 0, cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const x0 = r[j][0] * k, y0 = r[j][1], x1 = r[i][0] * k, y1 = r[i][1], c = x0 * y1 - x1 * y0;
    A += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c;
  }
  return A ? [cx / (3 * A) / k, cy / (3 * A)] : r[0];
}
// Douglas–Peucker on a closed ring (degrees, cos-lat corrected)
function simplify(r, tol) {
  if (r.length < 8) return r;
  // longitude scale from the ring's mean latitude, floored: a ring that starts at the pole must not collapse
  const k = Math.max(0.2, Math.cos(r.reduce((s, p) => s + p[1], 0) / r.length * D2R));
  const d = (p, a, b) => { const ax = a[0] * k, bx = b[0] * k, px = p[0] * k, dx = bx - ax, dy = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - ax - t * dx, p[1] - a[1] - t * dy); };
  const keep = new Uint8Array(r.length); keep[0] = keep[r.length - 1] = 1;
  const st = [[0, r.length - 1]];
  while (st.length) { const [a, b] = st.pop(); let m = -1, mi = -1; for (let i = a + 1; i < b; i++) { const v = d(r[i], r[a], r[b]); if (v > m) { m = v; mi = i; } } if (m > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
  const out = r.filter((_, i) => keep[i]);
  return out.length >= 4 ? out : r;
}
const r4 = v => Math.round(v * 1e4) / 1e4;
const r2 = v => Math.round(v * 100) / 100;
// Sutherland–Hodgman against the half-plane lon <= L (keepLeft) or lon >= L: cuts a ring at the antimeridian
function clipLon(r, L, keepLeft) {
  const inside = p => (keepLeft ? p[0] <= L : p[0] >= L);
  const cross = (a, b) => { const t = (L - a[0]) / (b[0] - a[0]); return [L, a[1] + t * (b[1] - a[1])]; };
  const out = [];
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length];
    if (inside(a)) { out.push(a); if (!inside(b)) out.push(cross(a, b)); } else if (inside(b)) out.push(cross(a, b));
  }
  return out.length >= 3 ? out : null;
}
// World tier: every ring in [-180, 180], cut at the antimeridian so nothing streaks across the map.
function worldRings(c) {
  const rings = [];
  // Antarctica circles the pole: its source rings are already valid in [-180, 180], so use them as given
  if (c.rawParts) { c.rawParts.forEach(poly => poly.forEach((r, ri) => rings.push({ hole: ri > 0, r: r.map(([x, y]) => [r4(x), r4(y)]) }))); return rings; }
  c.parts.forEach(poly => poly.forEach((r, ri) => {
    const lons = r.map(p => p[0]), lo = Math.min(...lons), hi = Math.max(...lons);
    const push = (rg, shift) => rg && rings.push({ hole: ri > 0, r: rg.map(([x, y]) => [r4(x + shift), r4(y)]) });
    if (hi <= 180) push(r, 0);
    else if (lo >= 180) push(r, -360);
    else { push(clipLon(r, 180, true), 0); push(clipLon(r, 180, false), -360); }
  }));
  return rings;
}
// Framing: the bbox of the largest parts that together hold >= 95 % of the area, so a remote island
// does not shrink the mainland. Small island states (tiny total area) frame on everything.
function frameOf(withA) {
  const tot = withA.reduce((s, o) => s + o.a, 0);
  let acc = 0; const keep = [];
  for (const o of withA) { keep.push(o); acc += o.a; if (acc / tot >= 0.95) break; }
  const use = tot < 0.05 ? withA : keep;
  return { bbox: bboxOf(use.flatMap(o => o.p[0])).map(r4), parts: use.length };
}

// ---- build
const countries = [], unmatched = [];
for (const g of topo.objects.countries.geometries) {
  const name = g.properties && g.properties.name;
  const iso = byNum.get(g.id);
  if (!iso) unmatched.push(`${g.id || '(no id)'} ${name}`);
  const raw = polys(g);
  if (!raw.length) continue;
  const { parts, shifted } = unwrap(raw);
  // order parts by planar area, largest first
  const withA = parts.map(p => ({ p, a: Math.abs(shoelace(p[0])) * Math.cos(p[0][0][1] * D2R) })).sort((x, y) => y.a - x.a);
  const all = withA.flatMap(o => o.p.flat());
  const bb = bboxOf(all);
  const fr = frameOf(withA);
  // Kosovo has no ISO 3166-1 code; XK is the widely used user-assigned code. Others without a code are keyed by slug.
  const a2 = iso ? iso.a2 : name === 'Kosovo' ? 'XK' : null;
  const tot = withA.reduce((s, o) => s + o.a, 0);
  countries.push({
    a2, a3: iso ? iso.a3 : name === 'Kosovo' ? 'XKX' : null, num: g.id || null, name,
    key: a2 || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    shifted, bbox: bb.map(r4), frame: fr.bbox, frameParts: fr.parts, centroid: centroid(withA[0].p).map(r4),
    areaDeg2: r2(tot), tier: tot < 0.05 ? 'micro' : tot < 2 ? 'small' : 'standard',
    parts: withA.map(o => o.p.map(rg => rg.map(([x, y]) => [r4(x), r4(y)]))),
    ...(iso && iso.a3 === 'ATA' ? { rawParts: raw } : {}),
  });
}
countries.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
// Natural Earth gives some dependencies their sovereign's numeric code (Ashmore and Cartier Is. = 036, Australia).
// The largest feature keeps the code; the others are keyed by slug with a parent pointer.
const byA2 = {};
countries.forEach(c => { if (c.a2) (byA2[c.a2] ||= []).push(c); });
Object.values(byA2).filter(l => l.length > 1).forEach(l => {
  l.sort((x, y) => y.areaDeg2 - x.areaDeg2).slice(1).forEach(c => {
    c.parent = c.a2; c.a2 = null; c.a3 = null;
    c.key = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  });
});

// thumbnail tier: drop parts under 0.2 % of the country's area (keep at least the mainland), simplify
const min = countries.map(c => {
  const tot = c.areaDeg2 || 1, span = Math.max(c.bbox[2] - c.bbox[0], c.bbox[3] - c.bbox[1]);
  const tol = Math.max(0.01, span / 400);
  const parts = c.parts.filter((p, i) => i === 0 || (Math.abs(shoelace(p[0])) * Math.cos(p[0][0][1] * D2R)) / tot > 0.002)
    .map(p => [simplify(p[0], tol)]);          // outer rings only at thumbnail scale
  return { ...c, parts };
});

// world view tier: antimeridian-cut rings, simplified for a 1–2k px world map
const worldTier = countries.map(c => ({
  a2: c.a2, key: c.key, name: c.name, tier: c.tier,
  rings: worldRings(c).map(o => ({ hole: o.hole, r: simplify(o.r, 0.04) })),
}));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'world-geo.world.json'), JSON.stringify({ countries: worldTier }));
const meta = {
  source: 'Natural Earth 1:50m admin-0 countries (public domain) via world-atlas@2.0.2 (ISC); ISO 3166-1 codes via i18n-iso-countries@7.14.0 (MIT)',
  note: 'Boundaries are Natural Earth de facto lines, drawn for orientation. They are not a political statement.',
  count: countries.length,
};
const strip = c => { const { rawParts, ...rest } = c; return rest; };
fs.writeFileSync(path.join(outDir, 'world-geo.json'), JSON.stringify({ meta, countries: countries.map(strip) }));
fs.writeFileSync(path.join(outDir, 'world-geo.min.json'), JSON.stringify({ meta, countries: min.map(strip) }));
const vtx = cs => cs.reduce((s, c) => s + c.parts.reduce((t, p) => t + p.reduce((u, r) => u + r.length, 0), 0), 0);
console.log(`${countries.length} countries/territories · ${countries.filter(c => c.a2).length} with ISO codes · ${countries.filter(c => c.shifted).length} unwrapped across 180°`);
console.log(`vertices: full ${vtx(countries)} · thumbnail ${vtx(min)}`);
console.log(`sizes: full ${(fs.statSync(path.join(outDir, 'world-geo.json')).size / 1024).toFixed(0)} KB · min ${(fs.statSync(path.join(outDir, 'world-geo.min.json')).size / 1024).toFixed(0)} KB`);
console.log('no ISO code:', unmatched.join(' | ') || 'none');
console.log('unwrapped:', countries.filter(c => c.shifted).map(c => c.a2 || c.name).join(', '));
const fi = countries.find(c => c.a2 === 'FI'), jp = countries.find(c => c.a2 === 'JP');
console.log('FI', JSON.stringify({ bbox: fi.bbox, centroid: fi.centroid, parts: fi.parts.length }), '· JP', JSON.stringify({ bbox: jp.bbox, parts: jp.parts.length }));
