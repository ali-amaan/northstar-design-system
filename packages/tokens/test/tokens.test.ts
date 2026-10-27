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
  "material.hairline",
  "material.liquid.tint",
  "material.liquid.highlight",
  "material.liquid.rim",
  "material.liquid.rim-low",
  "material.liquid.inner",
  "material.liquid.shadow",
  ...[1, 2, 3, 4, 5, 6, 7].flatMap((i) => [`material.spin.stop.${i}`, `material.spin.signal-stop.${i}`]),
  "material.spin.ink",
  "material.spin.signal-ink",
  "material.spin.grain-dark",
  "material.spin.grain-light",
  "material.spin.signal-grain-light",
  "material.spin.emboss",
  "material.spin.sheen",
  "material.spin.shadow",
  "material.spin.shadow-press",
  "material.spin.ghost",
  "material.spin.ghost-edge",
  "material.spin.matte",
  "material.spin.matte-ink",
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

describe("liquid glass and motion scales", () => {
  it("defines refraction presets and the long, soft motion steps", () => {
    const s = tokens.scales as Record<string, unknown>;
    expect(Number(s["material.liquid.scale.sm"])).toBeLessThan(Number(s["material.liquid.scale.md"]));
    expect(Number(s["material.liquid.scale.md"])).toBeLessThan(Number(s["material.liquid.scale.lg"]));
    for (const k of ["motion.duration.micro", "motion.duration.layout", "motion.duration.reveal", "motion.duration.stagger", "motion.easing.glide", "motion.spring.layout"]) expect(s[k], k).toBeDefined();
  });
});

describe("glass radii", () => {
  it("keeps liquid glass corners tight: panels and bars about 10px, controls 6-7px, nothing fully round", () => {
    const s = tokens.scales as Record<string, string>;
    const px = (k: string) => parseFloat(s[k] ?? "NaN");
    for (const k of ["radius.glass.panel", "radius.glass.bar"]) {
      expect(px(k), k).toBeGreaterThanOrEqual(8);
      expect(px(k), k).toBeLessThanOrEqual(10);
    }
    expect(px("radius.glass.control")).toBeGreaterThanOrEqual(6);
    expect(px("radius.glass.control")).toBeLessThanOrEqual(7);
    expect(px("radius.glass.inner")).toBe(px("radius.glass.bar") - 4);
    expect(cssVar["radius.glass.panel" as keyof typeof cssVar]).toBe("--ns-radius-glass-panel");
  });
});

describe("button shapes and texture", () => {
  it("buttons are pills by default, with a rounded opt-out", () => {
    const s = tokens.scales as Record<string, string>;
    expect(s["radius.control.pill"]).toBe(s["radius.full"]);
    expect(parseFloat(s["radius.control.rounded"] ?? "NaN")).toBeLessThanOrEqual(8);
    expect(cssVar["radius.control.pill" as keyof typeof cssVar]).toBe("--ns-radius-control-pill");
  });

  it("both themes define the tactile texture, tuned for the secondary body and the Glacier primary", () => {
    const parts = ["light", "dark", "top", "bevel-hi", "bevel-lo"];
    for (const theme of themes) {
      const t = tokens.themes[theme] as Record<string, string>;
      for (const p of parts) {
        expect(t[`material.texture.${p}`], `${theme} ${p}`).toMatch(/^rgba\(/);
        expect(t[`material.texture.signal-${p}`], `${theme} signal-${p}`).toMatch(/^rgba\(/);
      }
      expect(t["button.primary.hover"], theme).toMatch(/^#/);
    }
  });
});

describe("machined spin", () => {
  it("both themes define opaque body stops, both inks, a translucent grain and a ghost opacity", () => {
    for (const theme of themes) {
      const t = tokens.themes[theme] as Record<string, string>;
      for (let i = 1; i <= 7; i++) {
        expect(t[`material.spin.stop.${i}`], `${theme} stop ${i}`).toMatch(/^#[0-9A-F]{6}$/i);
        expect(t[`material.spin.signal-stop.${i}`], `${theme} signal-stop ${i}`).toMatch(/^#[0-9A-F]{6}$/i);
      }
      for (const k of ["grain-dark", "grain-light", "signal-grain-light", "emboss", "sheen"]) expect(t[`material.spin.${k}`], `${theme} ${k}`).toMatch(/^rgba\(.+, 0\.\d+\)$/);
      expect(t["material.spin.shadow"], theme).toContain("inset 0 1px 0");
      expect(t["material.spin.shadow-press"], theme).toContain("inset 0 1px 2px");
      const ghost = Number(t["material.spin.ghost"]);
      expect(ghost, theme).toBeGreaterThan(0);
      expect(ghost, theme).toBeLessThan(0.5);
    }
  });

  it("replaces brushed silver: there is one metal system", () => {
    for (const theme of themes) expect(Object.keys(tokens.themes[theme]).filter((k) => k.startsWith("material.silver."))).toEqual([]);
  });

  it("ships the sweep motion as scales, so reduced motion zeroes it", () => {
    const s = tokens.scales as Record<string, string>;
    expect(s["material.spin.sweep"]).toBe("700ms");
    expect(s["material.spin.sweep-easing"]).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect(parseFloat(s["material.spin.turn"] ?? "NaN")).toBeLessThanOrEqual(24);
    expect(cssVar["material.spin.stop.1" as keyof typeof cssVar]).toBe("--ns-material-spin-stop-1");
  });
});

describe("star backdrops", () => {
  it("define a ground, ink, signal, line and faint role per theme; Day uses the pale ground", () => {
    for (const theme of themes) {
      const t = tokens.themes[theme] as Record<string, string>;
      for (const r of ["ground", "ink", "signal", "line", "faint"]) expect(t[`backdrop.${r}`], `${theme} ${r}`).toMatch(/^#[0-9A-F]{6}$/i);
      for (const g of ["nebula", "haze", "core", "core-soft", "band"]) expect(Number(t[`backdrop.glow.${g}`]), g).toBeLessThan(0.5);
    }
    expect(built.themes.night["backdrop.ground" as keyof typeof built.themes.night]).toBe("#08090C");
    expect(built.themes.day["backdrop.ground" as keyof typeof built.themes.day]).toBe("#F4F6F8");
  });
});
