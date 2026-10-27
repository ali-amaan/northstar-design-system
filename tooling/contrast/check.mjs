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
//   - material.silver.grain / sheen / highlight / shade / edge / shadow
//                             the brushed-metal finish over the silver body. The body's two opaque
//                             ends (hi, lo, and the glacier-tinted signal-hi, signal-lo) are checked
//                             against the silver ink as fixed pairs, with the grain's darkest line
//                             composited over lo, so the label holds wherever the gradient lands.
//   - material.texture.*      the tactile texture on every button (brushed lines, top highlight,
//                             bevel). Not checked on its own: each textured button body is checked
//                             below (TEXTURED) with its lightest and its darkest point composited,
//                             so the label holds over every line of the grain.
//   - backdrop.line / faint / glow.*
//                             rings, graduations, unlit lattice points and glows of the star
//                             backdrops. backdrop.ground is checked as a ground; backdrop.ink and
//                             backdrop.signal as marks on it.
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
  "backdrop.ground",
];
/** Translucent grounds also composited over these surfaces. */
const BACKDROPS = { "material.glass.fill": ["color.surface.3", "color.signal.wash", "backdrop.ground"] };
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
/** Marks of the star backdrops, on the backdrop ground only. */
const BACKDROP_MARKS = ["backdrop.ink", "backdrop.signal"];
/** Fixed pairs: [foreground, background, minimum]. */
const PAIRS = [
  ["button.primary.fg", "button.primary.bg", 4.5],
  ["button.primary.fg", "button.primary.hover", 4.5],
  // Brushed silver buttons on liquid glass (secondary and the glacier-tinted primary).
  ["material.silver.ink", "material.silver.hi", 4.5],
  ["material.silver.ink", "material.silver.lo", 4.5],
  ["material.silver.ink", "material.silver.signal-hi", 4.5],
  ["material.silver.ink", "material.silver.signal-lo", 4.5],
];
/**
 * Textured buttons: [foreground, body, texture prefix, minimum]. Each body is checked twice:
 * at its lightest point (top highlight over a light brushed line) and at its darkest (a dark
 * brushed line), so the label holds wherever the grain falls under it.
 */
const TEXTURED = [
  ["color.text.1", "color.surface.2", "material.texture", 4.5], // secondary, and ghost on hover
  ["color.text.1", "color.surface.3", "material.texture", 4.5], // secondary on hover
  ["color.signal.default", "color.surface.2", "material.texture", 4.5], // tone="signal"
  ["color.signal.default", "color.surface.3", "material.texture", 4.5],
  ["button.primary.fg", "button.primary.bg", "material.texture.signal", 4.5], // primary (Glacier)
  ["button.primary.fg", "button.primary.hover", "material.texture.signal", 4.5],
];
/** The darkest grain line of the brushed finish, composited over the darker body end. */
const GRAIN = { r: 6, g: 8, b: 12, a: 0.06 };

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
  for (const m of BACKDROP_MARKS) rows.push([m, "backdrop.ground", 3, "icon"]);

  for (const [fg, bg, min, kind, back] of rows) {
    checks++;
    let ground = back ? over(parse(roles[bg]), solid(back)) : solid(bg);
    if (bg.startsWith("material.silver.") && bg.endsWith("lo")) ground = over(GRAIN, ground);
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

// Textured button bodies, lightest and darkest point.
for (const [theme, roles] of Object.entries(tokens.themes)) {
  const ground = parse(roles["color.ground"]);
  const get = (path) => {
    if (!(path in roles)) throw new Error(`${theme}: missing role ${path}`);
    return parse(roles[path]);
  };
  const sep = (prefix) => (prefix.endsWith(".signal") ? "-" : ".");
  for (const [fg, body, prefix, min] of TEXTURED) {
    const base = over(get(body), ground);
    const role = (k) => get(`${prefix}${sep(prefix)}${k}`);
    const light = over(role("top"), over(role("light"), base));
    const dark = over(role("dark"), base);
    const ink = over(get(fg), base);
    for (const [where, bg] of [["lightest", light], ["darkest", dark]]) {
      checks++;
      const r = ratio(ink, bg);
      if (r < min) {
        failures++;
        console.error(`FAIL ${theme.padEnd(5)} text ${fg} on textured ${body} (${where}): ${r.toFixed(2)} < ${min}`);
      }
    }
  }
}

if (failures) {
  console.error(`contrast: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`contrast: ${checks} checks passed`);
