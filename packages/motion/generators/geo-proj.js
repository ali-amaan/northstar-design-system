// Northstar map projections. Shared by every global map generator and preview.
//   equalEarth(lon, lat)            → [x, y] for world maps (Šavrič, Patterson, Jenny 2018), unit scale
//   laea(lon0, lat0)(lon, lat)      → [x, y] Lambert azimuthal equal-area centred on a country, in radians-scale units
//   fitCountry(country, w, h, pad)  → { project, k } placing a country (unwrapped lon/lat) in a w×h box, north up
const D2R = Math.PI / 180;
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
function equalEarth(lon, lat) {
  // wrap only values outside [-180, 180]: a ring cut on the antimeridian keeps its +180 edge at +180
  const l = lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon;
  const th = Math.asin(M * Math.sin(lat * D2R)), t2 = th * th, t6 = t2 * t2 * t2;
  const x = (l * D2R) * Math.cos(th) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, -y];
}
const EE_W = 2 * equalEarth(180 - 1e-9, 0)[0], EE_H = 2 * -equalEarth(0, 90)[1];   // ≈ 5.4133 × 2.6347
function laea(lon0, lat0) {
  const l0 = lon0 * D2R, p0 = lat0 * D2R, sp0 = Math.sin(p0), cp0 = Math.cos(p0);
  return (lon, lat) => {
    const l = lon * D2R - l0, p = lat * D2R, sp = Math.sin(p), cp = Math.cos(p);
    const k = Math.sqrt(2 / (1 + sp0 * sp + cp0 * cp * Math.cos(l)));
    return [k * cp * Math.sin(l), -k * (cp0 * sp - sp0 * cp * Math.cos(l))];
  };
}
// Place a country in a box: centre the azimuthal projection on its bbox centre (unwrapped lon), scale to fit.
// Antarctica is centred on the pole. `parts` may be the full or the thumbnail tier.
// Framing uses c.frame (the parts holding >= 95 % of the area) so remote islands never shrink the mainland;
// parts outside the frame fall outside the box and are clipped by the view.
function fitCountry(c, w, h, pad = 0) {
  const fb = c.frame || c.bbox;
  const lon0 = c.a3 === 'ATA' ? 0 : (fb[0] + fb[2]) / 2, lat0 = c.a3 === 'ATA' ? -90 : (fb[1] + fb[3]) / 2;
  const P = laea(lon0, lat0);
  const inFrame = ([lo, la]) => lo >= fb[0] - 1e-6 && lo <= fb[2] + 1e-6 && la >= fb[1] - 1e-6 && la <= fb[3] + 1e-6;
  const pts = c.parts.flat(2).filter(inFrame).map(([lo, la]) => P(lo, la));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const k = Math.min((w - 2 * pad) / (x1 - x0 || 1), (h - 2 * pad) / (y1 - y0 || 1));
  const ox = (w - (x1 - x0) * k) / 2 - x0 * k, oy = (h - (y1 - y0) * k) / 2 - y0 * k;
  return { project: (lo, la) => { const [x, y] = P(lo, la); return [ox + x * k, oy + y * k]; }, k, lon0, lat0 };
}
module.exports = { equalEarth, EE_W, EE_H, laea, fitCountry, D2R };
