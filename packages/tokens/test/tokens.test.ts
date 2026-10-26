import { describe, expect, it } from "vitest";
import built from "../dist/tokens.json";
import primitive from "../src/primitive.json";
import night from "../src/semantic.night.json";
import day from "../src/semantic.day.json";
import scales from "../src/scales.json";
import component from "../src/component.json";
import { cssVar, themes, tokens } from "../dist/index.js";

/** Every semantic colour role from SPEC §3.2, plus the data-ink roles from §3.3. */
const COLOR_ROLES = [
  "color.ground",
  "color.surface.1",
  "color.surface.2",
  "color.surface.3",
  "color.line.1",
  "color.line.2",
  "color.text.1",
  "color.text.2",
  "color.text.3",
  "color.signal.default",
  "color.signal.fill",
  "color.signal.wash",
  "color.signal.edge",
  "color.focus.default",
  "color.focus.halo",
  "color.data.star",
  "color.data.node",
  "color.data.band",
  "color.data.horizon",
  "color.data.meridian",
  "color.data.graticule",
  "color.data.likert.1",
  "color.data.likert.2",
  "color.data.likert.3",
  "color.data.likert.4",
  "color.data.likert.5",
];

/** Material roles for the glass interaction layer. */
const MATERIAL_ROLES = [
  "material.glass.fill",
  "material.glass.tint",
  "material.glass.edge",
  "material.glass.rim",
  "material.glass.specular",
  "material.solid",
  "material.glow",
  "material.spotlight",
  "material.shadow",
];

/** SPEC §3.2, verbatim. */
const SPEC: Record<string, [string, string]> = {
  "color.ground": ["#08090C", "#FFFFFF"],
  "color.surface.1": ["#0D0F13", "#F8F9FA"],
  "color.surface.2": ["#14161B", "#F1F3F5"],
  "color.surface.3": ["#1B1E24", "#E9ECEF"],
  "color.line.1": ["#1E2128", "#E6E8EB"],
  "color.line.2": ["#2B2F38", "#D4D8DD"],
  "color.text.1": ["#E8EAEE", "#06080C"],
  "color.text.2": ["#A9AEB8", "#464C56"],
  "color.text.3": ["#848A94", "#656A75"],
  "color.signal.default": ["#93B4E0", "#2F5D9A"],
  "color.signal.fill": ["#93B4E0", "#93B4E0"],
  "color.signal.wash": ["rgba(147, 180, 224, 0.12)", "#EDF3FB"],
  "color.signal.edge": ["#93B4E0", "#B9CEEA"],
  "color.focus.default": ["#93B4E0", "#2F5D9A"],
  "color.focus.halo": ["transparent", "rgba(147, 180, 224, 0.35)"],
};

const keys = (o: object) => Object.keys(o).sort();

describe("themes", () => {
  it("both themes define every semantic colour role", () => {
    for (const theme of themes) {
      const defined = Object.keys(tokens.themes[theme]);
      for (const role of COLOR_ROLES) expect(defined, `${theme} ${role}`).toContain(role);
    }
  });

  it("both themes define every material role", () => {
    for (const theme of themes) {
      const defined = Object.keys(tokens.themes[theme]);
      for (const role of MATERIAL_ROLES) expect(defined, `${theme} ${role}`).toContain(role);
    }
  });

  it("glass is translucent and its fallback is opaque", () => {
    for (const theme of themes) {
      const t = tokens.themes[theme];
      expect(t["material.glass.fill"], theme).toMatch(/^rgba\(.+, 0\.\d+\)$/);
      expect(t["material.solid"], theme).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("night and day define exactly the same paths", () => {
    expect(keys(built.themes.night)).toEqual(keys(built.themes.day));
  });

  it("matches the SPEC §3.2 values", () => {
    for (const [role, [n, d]] of Object.entries(SPEC)) {
      expect(built.themes.night[role as keyof typeof built.themes.night], role).toBe(n);
      expect(built.themes.day[role as keyof typeof built.themes.day], role).toBe(d);
    }
  });

  it("has no red or green roles", () => {
    expect(Object.keys(cssVar).some((p) => /red|green|danger|success/.test(p))).toBe(false);
  });

  it("resolves every alias", () => {
    const values = [
      ...Object.values(built.themes.night),
      ...Object.values(built.themes.day),
      ...Object.values(built.scales),
    ];
    expect(values.filter((v) => String(v).includes("{"))).toEqual([]);
  });
});

describe("names", () => {
  it("are --ns-<path> in kebab-case, with 'default' dropped", () => {
    for (const [path, name] of Object.entries(cssVar)) {
      expect(name).toMatch(/^--ns-[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(name).toBe(
        `--ns-${path
          .split(".")
          .filter((p) => p !== "default")
          .join("-")}`,
      );
    }
  });

  it("are unique", () => {
    const names = Object.values(cssVar);
    expect(new Set(names).size).toBe(names.length);
  });

  it("follow the documented examples", () => {
    expect(cssVar["color.text.2"]).toBe("--ns-color-text-2");
    expect(cssVar["color.signal.default"]).toBe("--ns-color-signal");
    expect(cssVar["motion.easing.settle"]).toBe("--ns-motion-easing-settle");
  });
});

describe("layers", () => {
  it("has no unused primitives", () => {
    const refs = JSON.stringify([night, day, scales, component]);
    for (const path of Object.keys(built.primitive)) expect(refs, path).toContain(`{${path}}`);
  });

  it("primitives are only raw values", () => {
    expect(JSON.stringify(primitive)).not.toMatch(/"{[^}]+}"/);
  });

  it("easings and springs are cubic-beziers", () => {
    for (const e of ["settle", "enter", "travel", "exit"]) {
      expect(built.scales[`motion.easing.${e}` as keyof typeof built.scales]).toMatch(
        /^cubic-bezier\(/,
      );
    }
    for (const e of ["press", "release", "settle"]) {
      expect(built.scales[`motion.spring.${e}` as keyof typeof built.scales]).toMatch(
        /^cubic-bezier\(/,
      );
    }
  });

  it("spring durations are tokens, so reduced motion zeroes them", () => {
    for (const d of ["press", "release", "settle"]) {
      expect(built.scales[`motion.duration.${d}` as keyof typeof built.scales]).toMatch(/^\d+ms$/);
    }
  });

  it("original easings are unchanged", () => {
    for (const e of ["settle", "enter", "travel", "exit"]) {
      expect(built.scales[`motion.easing.${e}` as keyof typeof built.scales]).toMatch(
        /^cubic-bezier\(/,
      );
    }
  });
});
