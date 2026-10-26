// Contrast gate for @northstar-js/tokens (SPEC §3.4).
//
// For each theme, every TEXT role must reach 4.5:1 and every ICON / SIGNAL-LINE role 3:1
// against every ground and surface it can sit on. Exits 1 on any failure.
//
// Exempt, on purpose:
//   - color.line.*            decorative hairlines (dividers, borders). They separate, they do not
//                             carry meaning, so WCAG 1.4.11 does not apply. Anything that carries
//                             meaning must use a signal or text role instead.
//   - color.signal.edge       the border of a signal wash; decorative, the wash's label carries meaning.
//   - color.data.meridian / graticule / band
//                             reference lines and the error-band fill behind a mark; the mark itself
//                             (node, star, horizon) is checked.
//   - color.data.likert.*     ordinal fills read against each other with labels, not against the ground.
//   - color.focus.halo        drawn together with color.focus, which is checked.
//   - material.glass.tint / edge / rim / specular, material.glow / spotlight
//                             decorative layers of the glass material; the fill they sit on is
//                             checked as a ground below.
//
//
// Translucent grounds (color.signal.wash, material.glass.fill) are composited over color.ground
// first. Glass is additionally checked over the busiest surface it may float above
// (color.surface.3), and its opaque fallback material.solid is checked as a ground.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tokens = JSON.parse(
  readFileSync(require.resolve("@northstar-js/tokens/tokens.json"), "utf8"),
);

const GROUNDS = [
  "color.ground",
  "color.surface.1",
  "color.surface.2",
  "color.surface.3",
  "color.signal.wash",
  "material.glass.fill",
  "material.solid",
];
/** Translucent grounds also composited over these surfaces. */
const BACKDROPS = { "material.glass.fill": ["color.surface.3", "color.signal.wash"] };
const TEXT = ["color.text.1", "color.text.2", "color.text.3", "color.signal.default"];
const ICON = [
  "color.signal.default",
  "color.focus.default",
  "color.data.node",
  "color.data.star",
  "color.data.horizon",
];
/** role -> grounds it must NOT be placed on (and therefore is not checked against). */
const RESTRICT = {};
/** Fixed pairs: [foreground, background, minimum]. */
const PAIRS = [["button.primary.fg", "button.primary.bg", 4.5]];

function parse(value) {
  const s = String(value).trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  throw new Error(`cannot parse colour ${s}`);
}

const over = (top, base) => ({
  r: top.r * top.a + base.r * (1 - top.a),
  g: top.g * top.a + base.g * (1 - top.a),
  b: top.b * top.a + base.b * (1 - top.a),
  a: 1,
});

function luminance({ r, g, b }) {
  const lin = (c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function ratio(fg, bg) {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

for (const [role, grounds] of Object.entries(RESTRICT)) {
  console.log(`note: ${role} is not allowed on ${grounds.join(", ")} (not checked there)`);
}

let failures = 0;
let checks = 0;
for (const [theme, roles] of Object.entries(tokens.themes)) {
  const ground = parse(roles["color.ground"]);
  const solid = (path) => {
    if (!(path in roles)) throw new Error(`${theme}: missing role ${path}`);
    return over(parse(roles[path]), ground);
  };
  const rows = [];
  for (const g of GROUNDS) {
    for (const t of TEXT) if (!RESTRICT[t]?.includes(g)) rows.push([t, g, 4.5, "text"]);
    for (const i of ICON) rows.push([i, g, 3, "icon"]);
  }
  // Glass over other backdrops: [fg, translucent ground, backdrop, min].
  for (const [g, backs] of Object.entries(BACKDROPS))
    for (const back of backs) {
      for (const t of TEXT) rows.push([t, g, 4.5, "text", back]);
      for (const i of ICON) rows.push([i, g, 3, "icon", back]);
    }
  for (const [f, b, min] of PAIRS) rows.push([f, b, min, "pair"]);

  for (const [fg, bg, min, kind, back] of rows) {
    checks++;
    const ground = back ? over(parse(roles[bg]), solid(back)) : solid(bg);
    const r = ratio(solid(fg), ground);
    if (r < min) {
      failures++;
      const where = back ? `${bg} over ${back}` : bg;
      console.error(
        `FAIL ${theme.padEnd(5)} ${kind.padEnd(4)} ${fg} on ${where}: ${r.toFixed(2)} < ${min}`,
      );
    }
  }
}

if (failures) {
  console.error(`contrast: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`contrast: ${checks} checks passed`);
