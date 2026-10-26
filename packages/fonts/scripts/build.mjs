// Copies Inter and IBM Plex Mono WOFF2 files (Latin + Latin Extended, 400/500/600, normal)
// out of the @fontsource packages into dist/files and writes dist/fonts.css.
// `--verify` rebuilds and checks every referenced file exists and is a WOFF2.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const files = join(dist, "files");

const FAMILIES = [
  { pkg: "@fontsource/inter", family: "Inter", slug: "inter" },
  { pkg: "@fontsource/ibm-plex-mono", family: "IBM Plex Mono", slug: "ibm-plex-mono" },
];
const SUBSETS = ["latin-ext", "latin"]; // fontsource order: latin last so it wins overlaps
const WEIGHTS = [400, 500, 600];

rmSync(dist, { recursive: true, force: true });
mkdirSync(files, { recursive: true });

const faces = [];
for (const { pkg, family, slug } of FAMILIES) {
  const dir = dirname(require.resolve(`${pkg}/package.json`));
  for (const weight of WEIGHTS) {
    const css = readFileSync(join(dir, `${weight}.css`), "utf8");
    for (const subset of SUBSETS) {
      const name = `${slug}-${subset}-${weight}-normal`;
      const block = new RegExp(String.raw`/\* ${name} \*/[\s\S]*?unicode-range:\s*([^;]+);`).exec(
        css,
      );
      if (!block) throw new Error(`no @font-face for ${name} in ${pkg}/${weight}.css`);
      copyFileSync(join(dir, "files", `${name}.woff2`), join(files, `${name}.woff2`));
      faces.push(`/* ${name} */
@font-face {
  font-family: '${family}';
  font-style: normal;
  font-display: swap;
  font-weight: ${weight};
  src: url(./files/${name}.woff2) format('woff2');
  unicode-range: ${block[1].trim()};
}`);
    }
  }
}

writeFileSync(
  join(dist, "fonts.css"),
  `/* @northstar-js/fonts — Inter and IBM Plex Mono, SIL OFL 1.1 (see LICENSE). Generated. */\n${faces.join("\n")}\n`,
);
console.log(`fonts: ${faces.length} faces`);

if (process.argv.includes("--verify")) {
  const css = readFileSync(join(dist, "fonts.css"), "utf8");
  const urls = [...css.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((m) => m[1]);
  const bad = urls.filter((u) => {
    const p = join(files, u);
    return !existsSync(p) || readFileSync(p).subarray(0, 4).toString("latin1") !== "wOF2";
  });
  const swaps = (css.match(/font-display: swap;/g) ?? []).length;
  if (urls.length !== 12 || bad.length || swaps !== 12) {
    console.error(
      `fonts verify failed: ${urls.length} urls, ${swaps} swap, bad: ${bad.join(", ")}`,
    );
    process.exit(1);
  }
  console.log("fonts verify: 12 WOFF2 faces, all font-display: swap");
}
