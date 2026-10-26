# Scene generators (source records)

These are the scripts that wrote every scene in `../scenes/`, copied unchanged from the design canvas
(`tools/build-lottie-*.js`). They are kept so each scene stays traceable to the code that drew it. The
package build does not run them and they are not published.

They are CommonJS (this folder's `package.json` says so) and write into a Lottie player checkout, not into
this package:

| Script | Writes | Copied here as |
|---|---|---|
| `build-lottie.js`, `build-lottie-v2.js` | `<player>/public/projects/northstar-instruments/scene-N/` | `scenes/night/instruments/` |
| `build-lottie-hero.js` | `…/northstar-hero/` | `scenes/night/hero/` |
| `build-lottie-geo.js` | `…/northstar-geo/` | `scenes/night/geo/` |
| `build-lottie-3d.js` | `…/northstar-3d/` | `scenes/night/3d/` |
| `build-lottie-charts.js` | `…/northstar-charts/` | `scenes/night/charts/` |
| `build-lottie-illus.js` | `…/northstar-illustrations/` | `scenes/night/illustrations/` |
| `build-lottie-world.js` (needs `geo-proj.js` and the canvas `geo/` data) | `…/northstar-world[-day]/` and the canvas `lottie/world[-day]/` | `scenes/night/world/`, `scenes/day/world/` |
| `build-lottie-day.js <player> --canvas <dir>` | the `-day` copy of every family above | `scenes/day/<family>/` |

`check-seams.js` and `check-seams-set.js` are the original keyframe-level seam checks. The gate the package
uses is `tooling/lottie-verify`, which renders each scene in Skottie.

To regenerate: run a generator against a player checkout, then copy each `scene-N/lottie.json` to
`scenes/<theme>/<family>/<name>.json` under its `nm` name, and run `pnpm --filter @northstar-js/motion build`
and `verify`.
