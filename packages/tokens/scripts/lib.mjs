// Shared DTCG loader and resolver for the build script and the tests.
// Kept deliberately small: flatten each layer, resolve {aliases}, name tokens --ns-<path>.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = (file) => fileURLToPath(new URL(`../src/${file}`, import.meta.url));
const load = (file) => JSON.parse(readFileSync(src(file), "utf8"));

export const THEMES = ["night", "day"];

/** Flatten a DTCG tree into [{ path, value, type, description }]. */
export function flatten(tree, prefix = [], inheritedType) {
  const out = [];
  const type = tree.$type ?? inheritedType;
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith("$")) continue;
    const path = [...prefix, key];
    if (node && typeof node === "object" && "$value" in node) {
      out.push({
        path: path.join("."),
        value: node.$value,
        type: node.$type ?? type,
        description: node.$description,
      });
    } else if (node && typeof node === "object") {
      out.push(...flatten(node, path, type));
    }
  }
  return out;
}

/** color.signal.default -> --ns-color-signal ; font.line-height.13 -> --ns-font-line-height-13 */
export function cssName(path) {
  return `--ns-${path
    .split(".")
    .filter((p) => p !== "default")
    .join("-")}`;
}

export function loadLayers() {
  return {
    primitive: flatten(load("primitive.json")),
    scales: flatten(load("scales.json")),
    themes: Object.fromEntries(THEMES.map((t) => [t, flatten(load(`semantic.${t}.json`))])),
    component: flatten(load("component.json")),
  };
}

const REF = /^\{([^}]+)\}$/;

function formatValue(token) {
  const v = token.value;
  if (token.type === "cubicBezier" && Array.isArray(v)) return `cubic-bezier(${v.join(", ")})`;
  return String(v);
}

/**
 * Resolve every token for one theme. Returns { primitive, scales, semantic, component } as
 * ordered arrays of { path, name, value, type, refs } with final CSS-ready values.
 */
export function resolveTheme(layers, theme) {
  const all = new Map();
  const groups = {
    primitive: layers.primitive,
    scales: layers.scales,
    semantic: layers.themes[theme],
    component: layers.component,
  };
  for (const list of Object.values(groups)) for (const t of list) all.set(t.path, t);

  const used = new Set();
  const resolve = (token, seen = []) => {
    const m = typeof token.value === "string" ? REF.exec(token.value) : null;
    if (!m) return formatValue(token);
    const target = all.get(m[1]);
    if (!target) throw new Error(`${token.path}: unknown reference {${m[1]}}`);
    if (seen.includes(target.path)) throw new Error(`${token.path}: circular reference`);
    used.add(target.path);
    return resolve(target, [...seen, token.path]);
  };

  const out = {};
  for (const [group, list] of Object.entries(groups)) {
    out[group] = list.map((t) => ({
      path: t.path,
      name: cssName(t.path),
      type: t.type,
      value: resolve(t),
      ...(t.description ? { description: t.description } : {}),
    }));
  }
  return { ...out, used };
}
