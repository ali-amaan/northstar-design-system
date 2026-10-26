// Packs every public workspace package with `pnpm pack` (so workspace:* is
// resolved exactly as it will be on npm), then runs publint and Are the Types
// Wrong against that tarball. Exits non-zero on any error.
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { publint } from "publint";
import { formatMessage } from "publint/utils";

const root = resolve(import.meta.dirname, "../..");
const require = createRequire(import.meta.url);
const attwBin = join(
  require.resolve("@arethetypeswrong/cli/package.json"),
  "..",
  "dist",
  "index.js",
);
const out = mkdtempSync(join(tmpdir(), "ns-pack-"));
let failed = 0;

const pkgDirs = readdirSync(join(root, "packages"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(root, "packages", d.name))
  .filter((dir) => {
    try {
      return !JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).private;
    } catch {
      return false;
    }
  });

try {
  for (const dir of pkgDirs) {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const dest = join(out, pkg.name.replace(/[@/]/g, "_"));
    execSync(`pnpm pack --pack-destination "${dest}"`, { cwd: dir, stdio: "ignore" });
    const tgz = join(
      dest,
      readdirSync(dest).find((f) => f.endsWith(".tgz")),
    );
    console.log(`\n${pkg.name}@${pkg.version}`);

    // publint
    const buf = readFileSync(tgz);
    const tarball = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const { messages, pkg: packed } = await publint({
      pack: { tarball },
      level: "warning",
      strict: true,
    });
    for (const m of messages) console.log(`  publint ${m.type}: ${formatMessage(m, packed)}`);
    if (messages.length) failed++;
    else console.log("  publint ok");

    // Are the Types Wrong — only for packages that ship type entrypoints.
    // Asset subpaths (CSS, SVG, JSON, fonts) are not TypeScript entrypoints, so
    // only the subpaths that declare a "types" condition are checked.
    const typed = Object.entries(pkg.exports ?? {})
      .filter(([, t]) => t && typeof t === "object" && "types" in t)
      .map(([k]) => k);
    if (!typed.length) {
      console.log("  attw skipped (no TypeScript entrypoints, e.g. CSS/font-only)");
      continue;
    }
    try {
      // ESM-only by design (SPEC): ignore the CJS resolution modes.
      const res = execFileSync(
        process.execPath,
        [
          attwBin,
          tgz,
          "--profile",
          "esm-only",
          "--entrypoints",
          ...typed,
          "--format",
          "table-flipped",
          "--no-color",
        ],
        { encoding: "utf8" },
      );
      console.log("  attw ok");
      if (process.env.VERBOSE) console.log(res);
    } catch (e) {
      failed++;
      console.log(`  attw FAILED\n${e.stdout ?? ""}${e.stderr ?? ""}`);
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}

if (failed) {
  console.error(`\n${failed} package check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${pkgDirs.length} public packages pass publint and attw.`);
