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
//   - material.spin.grain-* / emboss / sheen / shadow* / ghost
//                             the machined finish over the spin body. Every body is checked below
//                             (SPIN) at its lightest stop with the light grain over it and at its
//                             darkest stop with the dark grain over it and the press dimming
//                             (brightness 0.96), so the label holds wherever the sweep lands under
//                             it. Ghost text is checked on the faint wash (ghost opacity) over every
//                             surface, and the disabled ink on matte at 3:1.
//   - material.texture.*      the tactile texture of the soft finish (brushed lines, top highlight,
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
/**
 * Machined spin bodies: [ink, stop prefix, light grain]. Checked at the lightest stop (light
 * grain over it) and the darkest (dark grain over it, then the press dimming), 4.5:1.
 */
const SPIN = [
  ["material.spin.ink", "material.spin.stop", "material.spin.grain-light"], // secondary
  ["material.spin.signal-ink", "material.spin.signal-stop", "material.spin.signal-grain-light"], // primary, tone="signal"
];
/** Ghost spin: [text, stop prefix] on the faint wash over each surface a ghost button sits on. */
const SPIN_GHOST = [
  ["color.text.1", "material.spin.stop"], // ghost on hover and selection
  ["color.text.2", "material.spin.stop"], // ghost on keyboard focus (its resting text)
  ["color.signal.default", "material.spin.stop"], // ghost tone="signal" (the wash stays neutral)
];
const SPIN_GROUNDS = ["color.ground", "color.surface.1", "color.surface.2", "color.surface.3", "backdrop.ground"];
/** brightness(0.96) on press scales every sRGB channel. */
const PRESS = 0.96;

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

// Machined spin: every body at its lightest and darkest stop, the ghost wash, and matte.
for (const [theme, roles] of Object.entries(tokens.themes)) {
  const get = (path) => {
    if (!(path in roles)) throw new Error(`${theme}: missing role ${path}`);
    return parse(roles[path]);
  };
  const ground = get("color.ground");
  const stops = (prefix) => {
    const list = [];
    for (let i = 1; `${prefix}.${i}` in roles; i++) list.push(over(get(`${prefix}.${i}`), ground));
    if (list.length < 2) throw new Error(`${theme}: ${prefix} needs at least two stops`);
    return list.sort((a, b) => luminance(b) - luminance(a));
  };
  const dim = (c) => ({ r: c.r * PRESS, g: c.g * PRESS, b: c.b * PRESS, a: 1 });
  const report = (label, r, min) => {
    checks++;
    if (r < min) {
      failures++;
      console.error(`FAIL ${theme.padEnd(5)} ${label}: ${r.toFixed(2)} < ${min}`);
    }
  };
  for (const [ink, prefix, grain] of SPIN) {
    const list = stops(prefix);
    const lightest = over(get(grain), list[0]);
    const darkest = dim(over(get("material.spin.grain-dark"), list[list.length - 1]));
    const fg = over(get(ink), ground);
    report(`text ${ink} on ${prefix} (lightest)`, ratio(fg, lightest), 4.5);
    report(`text ${ink} on ${prefix} (darkest, pressed)`, ratio(dim(fg), darkest), 4.5);
  }
  const alpha = Number(roles["material.spin.ghost"]);
  if (!(alpha > 0 && alpha < 1)) throw new Error(`${theme}: material.spin.ghost must be an opacity`);
  for (const [text, prefix] of SPIN_GHOST) {
    const list = stops(prefix);
    for (const g of SPIN_GROUNDS) {
      const base = over(get(g), ground);
      const fg = over(get(text), base);
      for (const [where, stop] of [["lightest", list[0]], ["darkest", list[list.length - 1]]]) {
        const wash = over({ ...stop, a: alpha }, base);
        report(`text ${text} on ghost ${prefix} over ${g} (${where})`, ratio(fg, wash), 4.5);
      }
    }
  }
  report("text material.spin.matte-ink on material.spin.matte (disabled)", ratio(get("material.spin.matte-ink"), get("material.spin.matte")), 3);
}

if (failures) {
  console.error(`contrast: ${failures} of ${checks} checks failed`);
  process.exit(1);
}
console.log(`contrast: ${checks} checks passed`);
