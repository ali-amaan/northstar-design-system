// Builds dist/tokens.css, dist/tailwind.css, dist/tokens.json and dist/index.{js,d.ts}
// from the DTCG source in src/. A small script rather than Style Dictionary: four outputs,
// one alias syntax, nothing else needed.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadLayers, resolveTheme } from "./lib.mjs";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
const write = (f, s) => writeFileSync(dist + f, s);

const layers = loadLayers();
const night = resolveTheme(layers, "night");
const day = resolveTheme(layers, "day");

const decls = (list, indent = "  ") =>
  list.map((t) => `${indent}${t.name}: ${t.value};`).join("\n");
const durations = night.scales.filter((t) => t.type === "duration");
// Glass fills that become the opaque solid when the user asks for less transparency.
const glass = night.semantic.filter((t) => ["material.glass.fill", "material.glass.tint", "material.liquid.tint"].includes(t.path));

// ---- tokens.css
const css = `/* @northstar-js/tokens — generated from src/*.json. Do not edit. */
:root,
[data-theme="night"] {
  color-scheme: dark;
${decls(night.primitive)}
${decls(night.scales)}
${decls(night.semantic)}
${decls(night.component)}
}

[data-theme="day"] {
  color-scheme: light;
${decls(day.semantic)}
${decls(day.component)}
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    color-scheme: light;
${decls(day.semantic, "    ")}
${decls(day.component, "    ")}
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
${durations.map((t) => `    ${t.name}: 0ms;`).join("\n")}
  }
}

@media (prefers-reduced-transparency: reduce) {
  :root,
  [data-theme] {
${glass.map((t) => `    ${t.name}: var(--ns-material-solid);`).join("\n")}
  }
}
`;
write("tokens.css", css);

// ---- tailwind.css (Tailwind v4 @theme, pointing at the --ns-* variables)
const tw = [];
const v = (t) => `var(${t.name})`;
for (const t of night.semantic) {
  if (t.path.startsWith("color."))
    tw.push(`  --color-${t.name.slice("--ns-color-".length)}: ${v(t)};`);
  if (t.path.startsWith("elevation.")) tw.push(`  --shadow-${t.path.split(".")[1]}: ${v(t)};`);
}
for (const t of night.component) tw.push(`  --color-${t.name.slice("--ns-".length)}: ${v(t)};`);
for (const t of night.scales) {
  const p = t.path.split(".");
  if (p[0] === "font" && p[1] === "family") tw.push(`  --font-${p[2]}: ${v(t)};`);
  if (p[0] === "font" && p[1] === "size") {
    tw.push(`  --text-${p[2]}: ${v(t)};`);
    const lh = night.scales.find(
      (x) => x.path === `font.line-height.${p[2] === "base" ? "13" : p[2]}`,
    );
    if (lh) tw.push(`  --text-${p[2]}--line-height: ${v(lh)};`);
  }
  if (p[0] === "font" && p[1] === "weight") tw.push(`  --font-weight-${p[2]}: ${v(t)};`);
  if (p[0] === "space") tw.push(`  --spacing-${p[1]}: ${v(t)};`);
  if (p[0] === "radius") tw.push(`  --radius-${p.slice(1).join("-")}: ${v(t)};`);
  if (p[0] === "motion" && p[1] === "easing") tw.push(`  --ease-${p[2]}: ${v(t)};`);
  if (p[0] === "motion" && p[1] === "spring") tw.push(`  --ease-spring-${p[2]}: ${v(t)};`);
  if (p[0] === "material" && p[1] === "blur") tw.push(`  --blur-glass-${p[2]}: ${v(t)};`);
}
write(
  "tailwind.css",
  `/* @northstar-js/tokens — Tailwind v4 theme. Generated. */\n@import "./tokens.css";\n\n@theme inline {\n${tw.join("\n")}\n}\n`,
);

// ---- tokens.json and the typed module
const flat = (list) => Object.fromEntries(list.map((t) => [t.path, t.value]));
const json = {
  primitive: flat(night.primitive),
  scales: flat(night.scales),
  themes: {
    night: { ...flat(night.semantic), ...flat(night.component) },
    day: { ...flat(day.semantic), ...flat(day.component) },
  },
  cssVar: Object.fromEntries(
    [...night.primitive, ...night.scales, ...night.semantic, ...night.component].map((t) => [
      t.path,
      t.name,
    ]),
  ),
};
const body = JSON.stringify(json, null, 2);
write("tokens.json", body + "\n");

write(
  "index.js",
  `// Generated. Do not edit.\nexport const tokens = ${body};\nexport const themes = ["night", "day"];\nexport const cssVar = tokens.cssVar;\n`,
);
write(
  "index.d.ts",
  `// Generated. Do not edit.
declare const data: ${body};
export type Tokens = typeof data;
export type ThemeName = "night" | "day";
export type ThemeTokenPath = keyof Tokens["themes"]["night"];
export type TokenPath = keyof Tokens["cssVar"];
export type CssVarName = Tokens["cssVar"][TokenPath];
export declare const tokens: Tokens;
export declare const themes: readonly ThemeName[];
export declare const cssVar: Tokens["cssVar"];
`,
);

console.log(
  `tokens: ${night.primitive.length} primitive, ${night.scales.length} scale, ${night.semantic.length} semantic per theme, ${night.component.length} component`,
);
