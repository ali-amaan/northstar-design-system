# Northstar design system — implementation plan

This plan follows `SPEC.md` (approved 2026-10-26). Each phase ends in something that builds and passes CI. The design assets (tokens, icons, Lottie scenes, maps) already exist in the design canvas and in the scratch build tools; the work is to move them into packages, not to redesign them.

## Phase 0 — Repo (gated: needs your yes)

1. Create the public GitHub repo `northstar-design-system` through the GitHub API.
2. Scaffold the workspace: pnpm, TypeScript 5 (strict), Vitest, ESLint, Prettier, Changesets in fixed mode, `.nvmrc` (Node 22).
3. Add the licences: MIT at the root, OFL 1.1 for `packages/fonts`, and `NOTICE` for Natural Earth, world-atlas, i18n-iso-countries and Unicode CLDR.
4. CI: install, build, typecheck and test, with Actions pinned to commit SHAs. Branch protection on `main`.

**Done:** an empty workspace passes CI.

## Phase 1 — Tokens and fonts

1. Write the DTCG source (primitive, semantic, component) with the Night and Day values from spec §3.2–3.3.
2. Build with Style Dictionary 4: `tokens.css`, `tailwind.css`, `tokens.ts`, `tokens.json`.
3. `tooling/contrast`: check every text and icon role against every ground; this becomes a CI gate.
4. `@northstar-js/fonts`: Inter and IBM Plex Mono WOFF2, Latin and Latin Extended subsets, plus a `fonts.css`.
5. Unit tests: token names, both themes complete, no unused primitives.

**Done:** `@northstar-js/tokens` and `@northstar-js/fonts` build, and contrast passes.

## Phase 2 — Contracts

1. `@northstar-js/contracts`: `Study`, `StudyState`, `FigureValue`, `ClaimClass`, `MarketStatus`, `CostEstimate`, and the placeholder tokens.
2. `contracts/fixtures`: placeholder studies and figures that use only [SHARE], [BAND], [N] and the other placeholders.
3. Type tests.

**Done:** every other package can import its types.

## Phase 3 — Icons and motion

1. Move the instrument icons from the canvas into `packages/icons/src/*.svg`, with a manifest of names, tags and titles.
2. Build React components, the SVG files and a sprite. `tooling/icon-lint` checks the grid, stroke widths, `currentColor` and names.
3. Move the Lottie scenes (instruments, star fields, geo, 3D, charts, illustrations, world, in Night and Day) into `packages/motion/scenes/`, together with their generators (`build-lottie-*.js`).
4. `<Lottie>` wraps lottie-web for the browser and accepts the theme's slot colours. Reduced motion shows the final frame.
5. `tooling/lottie-verify`: a headless CanvasKit render of each scene that checks the slots, the loop seams and the 600 kB cap.

**Done:** icons and motion are published locally as 0.1.0 tarballs and pass their checks.

## Phase 4 — React basics

Built in this order, with Storybook stories, axe tests and screenshots for each:

1. `NorthstarProvider` (theme, density, messages) and the theme attribute set on the server.
2. Actions: Button, IconButton, Link, ButtonGroup.
3. Forms: Field, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider, NumberInput, SearchInput.
4. Overlays: Dialog, Sheet, Popover, Menu, Tooltip, Toast, Banner.
5. Layout and navigation: AppShell, Sidebar, TopBar, Tabs, Breadcrumbs, Pagination, Stack, Grid.
6. Data display: Table, List, Tag, Badge, Avatar (initials), Kbd, EmptyState, Skeleton, Stale.

Storybook runs in `apps/docs` with both themes and all three densities in the toolbar.

**Done:** about 150 basic components with stories, axe passing and screenshots recorded.

## Phase 5 — Charts and maps

1. `@northstar-js/charts`: Figure, Distribution (Likert), Composition, Ranking, the claim instrument, RunProgress, axes, legends, tooltips and number formatting. The band, claim and caption props are optional.
2. `@northstar-js/maps`: move `build-world-geo.js`, `geo-proj.js`, `build-country-maps.js` and `build-atlas.js`'s logic into the package build. Ship the 241 map files per theme plus the marks. Components: WorldMap, CountryMap, MarketStatus, CountryMark.
3. Market status is generated from `population.py` at build time through a small exported JSON file. Until the engine exports one, the package carries FI and JP as roster-ready and US as registered.

**Done:** charts and maps have stories, tests and screenshots.

## Phase 6 — Northstar components

`react/northstar`: StudyShell with the four tabs, StudyStatus, BriefForm, PopulationPanel, ResearchBuilder, ResponsesView, RunCost (shows "Cost unavailable"), RunConfirm, ExportMenu. `react/illustrations`: the spot illustrations and the Northstar lockup.

**Done:** the canvas study screens are rebuilt in Storybook from the packages, in both themes.

## Phase 7 — Quality gates and release (first publish gated: needs your yes)

1. Turn on every CI gate from spec §4.1: visual, a11y, publint, Are the Types Wrong, size-limit, `apps/next-smoke`.
2. Release workflow: Changesets, npm Trusted Publishing with provenance. Set up the trusted publisher on npmjs.com for each `@northstar-js` package.
3. Deploy Storybook to GitHub Pages.
4. Publish 0.1.0 once you say yes.

## Order and rough size

| Phase | Depends on | Size |
|---|---|---|
| 0 Repo | your yes | small |
| 1 Tokens and fonts | 0 | small |
| 2 Contracts | 0 | small |
| 3 Icons and motion | 1 | medium |
| 4 React basics | 1, 2, 3 | large |
| 5 Charts and maps | 1, 2 | medium |
| 6 Northstar components | 4, 5 | medium |
| 7 Gates and release | 4–6 | small |

Phases 3 and 5 can run alongside phase 4.
