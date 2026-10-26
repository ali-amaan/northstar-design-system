# Northstar design system — specification

Status: draft for approval · 2026-10-26 · scope `@northstar-js`

## 1. Repository and packages

- **Repo:** one public monorepo, `northstar-design-system` (GitHub, created through the GitHub API), pnpm workspaces.
- **Registry:** public npm under the `@northstar-js` scope.
- **Releases:** Changesets for versions and changelogs; npm Trusted Publishing (OIDC) from GitHub Actions, so no npm token is stored in the repo or in CI.
- **Licences:** MIT for code, SIL OFL 1.1 for fonts. Third-party data keeps its own licence (Natural Earth public domain, world-atlas ISC, i18n-iso-countries MIT, Unicode CLDR).
- **Brand:** this system replaces the Horizon brand everywhere except the frozen PDF report.

| Package | Contents |
|---|---|
| `@northstar-js/tokens` | DTCG source → CSS variables, Tailwind 4 `@theme`, TS and JSON. Night and Day. |
| `@northstar-js/fonts` | Inter and IBM Plex Mono, self-hosted and subset. |
| `@northstar-js/icons` | The instrument icon set, React components, SVG files and a sprite. |
| `@northstar-js/motion` | Lottie scenes with colour slots, a Skottie/lottie-web player wrapper, reduced-motion rules. |
| `@northstar-js/react` | Basic UI, `react/northstar` (Northstar-specific parts), `react/illustrations`. |
| `@northstar-js/charts` | Star-native figures and data visualisation. Never imports `react`'s components. |
| `@northstar-js/maps` | World and country star maps, market-status mark, country outline mark, 241 map files per theme. |
| `@northstar-js/contracts` | React-free shared types (study, figure, claim class, market status) and placeholder fixtures at `contracts/fixtures`. |

`apps/docs` is Storybook and is the only documentation site. `tooling/` holds the icon checks, Lottie render tests (headless CanvasKit), contrast checks, lint rules and size budgets. None of `tooling/` is published.

**CI:** frozen install, build, typecheck, unit and type tests, lint, size, icon checks, Lottie render tests, contrast, Storybook a11y tests, a Next.js smoke build. Actions pinned to commit SHAs, read-only default permissions.

## 2. Component inventory

About 620 components, deduplicated from the coverage audit (593 items, minus 36 duplicates, plus 66 missing). The full item list stays in the audit file and moves into the repo as `inventory.json` at scaffold time.

| Package | Main contents | Roughly |
|---|---|---|
| tokens | colour roles, data ink, type, spacing, density, z-index, motion timings, Tailwind theme | 55 |
| fonts | families, subsets, loading | 3 |
| icons | instrument set, sizes, checks, sprite | 40 |
| motion | Lottie scenes (instruments, star fields, geo, 3D, charts, illustrations, world), player, reduced motion | 30 |
| react | shell, navigation, forms, data display, overlays and feedback, `northstar` parts, illustrations | 380 |
| charts | figures, claim instrument, composition charts, number formatting, chart states | 45 |
| maps | WorldMap, CountryMap, MarketStatus, CountryMark, map files | 8 |
| contracts + tooling + docs | types, fixtures, CI, release, checks, Storybook | 60 |

### Resolved decisions

- **Colour:** Night ground `#08090C`; `#06080C` only as Day's darkest text. Day ground white. In Day, Glacier `#93B4E0` only fills primary buttons and focus halos; every other signal mark uses Glacier ink `#2F5D9A`. The "error edge" token is `signal.edge`.
- **Claim classes:** Level, Direction, Ranking. "Withheld" is a figure state.
- **Study lifecycle:** draft → ready → running → complete, plus partial, failed, archived. Building the population and locking are steps within draft.
- **Dependencies:** charts owns figure parts; `react/northstar` composes charts; shared types live in `contracts`.
- **Illustrations** ship in `react/illustrations`, with source files in `icons`.
- **Scales (one each):** z-index banner 30 < dropdown 40 < popover 50 < sheet 60 < dialog 70 < toast 80 < tooltip 90. Touch targets ≥ 44 px on coarse pointers. Button sizes 28, 32, 36, 44. Placeholder tokens [SHARE], [BAND], [N], [SEED], [OPTION], [COST], [NAME].
- **Density** modes are P0.
- **Pages:** one ground per page; the landing page is all Night.
- **Reduced motion:** nothing loops; a running study shows a still dial with the word "Running".
- **Stale data:** a label and a dashed edge, not opacity alone.
- **Marks:** stars are agents; workspace people get initials avatars. Measurement squares are filled; checkboxes have rounded corners.
- **Glacier states:** wherever running, failed and primary can appear together, the surface gets a review so shape and label tell them apart.
- **Priorities:** where the audit gave one item two priorities, the higher one wins.
- **Print:** a print theme ships as P1. The current PDF renderer is not changed.
- **Cost:** the paid-run flow shows "Cost unavailable" until the backend has a cost-estimate endpoint.
- **Locales:** English only at launch; strings are externalised so more can follow.
- **Docs:** Storybook only. No separate docs site or help centre for now.
- **Landing copy:** `about.ts`, `method.ts` and `use-cases.ts` are flagged for the owner to rewrite; the design system does not change their wording.
- **Honesty rules:** not part of the design system. No honesty lint, no runtime guards, no refusal states, and no required qualifying sentence or claim-class label on figures. Claim class, band and caption remain optional props.

## 3. Tokens and component APIs

### 3.1 Token layers

Three layers, in DTCG JSON under `packages/tokens/src/`:

1. **Primitive:** raw values, never used by components. `gray.0–12`, `glacier.300` `#93B4E0`, `glacier.700` `#2F5D9A`, alpha steps.
2. **Semantic:** roles, one set per theme. These are what components use.
3. **Component:** a few overrides where a component needs its own value (for example `button.primary.bg`).

Naming: `category.role.variant.state` in kebab-case, for example `color.text.secondary` → `--ns-color-text-secondary`.

### 3.2 Colour roles

| Role | Night | Day |
|---|---|---|
| `color.ground` | #08090C | #FFFFFF |
| `color.surface.1 / 2 / 3` | #0D0F13 / #14161B / #1B1E24 | #F8F9FA / #F1F3F5 / #E9ECEF |
| `color.line.1 / 2` | #1E2128 / #2B2F38 | #E6E8EB / #D4D8DD |
| `color.text.1 / 2 / 3` | #E8EAEE / #A9AEB8 / #7D838F | #06080C / #464C56 / #656A75 |
| `color.signal` (marks, text) | #93B4E0 | #2F5D9A |
| `color.signal.fill` (primary button) | #93B4E0 | #93B4E0 |
| `color.signal.wash / edge` | rgba(147,180,224,.12) / #93B4E0 | #EDF3FB / #B9CEEA |
| `color.focus` | #93B4E0 | rgba(147,180,224,.35) halo + #2F5D9A ring |

No red or green roles. Status is told apart by shape and label.

### 3.3 Other scales

- **Type:** Inter for UI and Plex Mono for figures. Sizes 11 / 12 / 13 (base) / 15 / 18 / 24 / 32 / 48, with line heights 16 / 18 / 20 / 22 / 26 / 32 / 40 / 52. Weights 400, 500, 600. Figures use tabular numerals.
- **Space:** 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Size:** controls 28 / 32 / 36 / 44, rows 32 / 36 / 40, icons 16 / 20 / 24.
- **Density:** `compact | default | comfortable` on `NorthstarProvider`, which scales control height and row padding. Coarse pointers always get at least 44 px targets.
- **Radius:** 4 / 6 / 8 / 12 / full.
- **Elevation:** Night uses borders only; Day adds shadows 1–3.
- **Z-index:** banner 30 · dropdown 40 · popover 50 · sheet 60 · dialog 70 · toast 80 · tooltip 90.
- **Motion:** durations 120 / 200 / 320 / 600 ms; easings `settle`, `enter`, `travel`, `exit` (the Lottie anchors); everything goes to 0 ms under reduced motion.
- **Data ink:** agent star, measured node (filled square), band, horizon, meridian, graticule; an ordinal Likert ramp of five steps from the gray and glacier primitives.

### 3.4 Outputs and theming

- Build outputs `tokens.css` (with `[data-theme="night"]` and `[data-theme="day"]`; Night is the default), `tailwind.css` (`@theme`), `tokens.ts` (typed) and `tokens.json`.
- The theme follows `prefers-color-scheme` unless `data-theme` is set. `NorthstarProvider` writes the attribute on the server to avoid a flash.
- CI checks every text and icon role against its grounds: 4.5:1 for text, 3:1 for icons and lines that carry meaning.

### 3.5 Component API conventions

- React 19, function components, `forwardRef` not needed (ref as a prop). Server-component safe unless the component holds state, which is marked `"use client"`.
- Styling with CSS variables and plain class names; there is no CSS-in-JS. `className` and `style` pass through, and `data-*` and `aria-*` pass to the root.
- Common props: `size` (`sm | md | lg`), `variant`, `tone` (`neutral | signal`), `disabled`, `loading`.
- Controlled and uncontrolled forms: `value` / `defaultValue` / `onValueChange`.
- Compound parts for complex components (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`), with headless behaviour from Radix-style primitives built in-house.
- Strings come through props or a `messages` object on the provider, so other languages can be added later; English ships as the default.
- Every interactive component: keyboard path, visible focus, an accessible name, and axe tests in Storybook.

### 3.6 Key APIs

```tsx
<NorthstarProvider theme="system" density="default" messages={en}>

<Button variant="primary" size="md" loading>Run study</Button>
<Icon name="ns-calibrate" size={20} />           // @northstar-js/icons
<Lottie scene="ns-north-settle" loop={false} />  // @northstar-js/motion, colours from the active theme

<StudyShell study={study} tab="population" onTabChange={...} />   // react/northstar
<StudyStatus state="running" />   // draft | ready | running | complete | partial | failed | archived
<RunCost estimate={null} />       // shows "Cost unavailable"

<Figure value={0.42} band={0.06} claim="level" caption="..." />   // charts; band, claim, caption optional
<Distribution anchors={[...]} shares={[...]} />
<Composition margins={...} />

<WorldMap marks={statusFromRegistry} selected="FI" />   // maps
<CountryMap code="JP" size="card" />
<MarketStatus code="US" variant="row" />
```

`@northstar-js/contracts` defines `Study`, `StudyState`, `FigureValue`, `ClaimClass`, `MarketStatus` and `CostEstimate`; every package imports its types from there.

## 4. Testing and release

### 4.1 Testing

| Layer | Tool | What it checks |
|---|---|---|
| Unit | Vitest | token build, number formatting, map projection, contracts |
| Component | Vitest + Testing Library | behaviour, keyboard paths, controlled and uncontrolled state |
| Types | `tsd` / `expect-type` | public API types, no `any` leaking out |
| Accessibility | Storybook test runner + axe | every story, Night and Day |
| Visual | Playwright screenshots of Storybook | every story in both themes, at desktop and 375 px |
| Contrast | `tooling/contrast` | every text and icon role on every ground |
| Icons | `tooling/icon-lint` | 20×20 grid, stroke widths, `currentColor`, names |
| Lottie | `tooling/lottie-verify` (headless CanvasKit) | renders in Skottie, slots present, loop seams, size under 600 kB |
| Packages | publint, Are the Types Wrong, size-limit | exports, ESM and types, bundle budgets |
| Smoke | `apps/next-smoke` | a Next.js 16 App Router build and hydration with every package |

All of them run in CI on every pull request; a failure blocks the merge.

### 4.2 Release

- Changesets: each pull request that changes a package adds a changeset. Merging to `main` opens a "Version packages" pull request; merging that publishes.
- Publishing runs in GitHub Actions with npm Trusted Publishing (OIDC) and provenance. No npm token is stored anywhere. The first publish needs your explicit go-ahead.
- Versions: all packages start at `0.1.0` and move together until `1.0.0` (fixed mode); after 1.0, each package is versioned on its own.
- Semver: anything that changes a token name, a prop or an export is a breaking change. Deprecated items warn in development for one minor release before removal.
- Storybook deploys to GitHub Pages from `main`.
- Branch protection on `main`: the required checks pass and one review. Commits go through the GitHub API, not `git push`.

## 5. Open items

- Create the public GitHub repo (needs your yes).
- First npm publish (needs your yes).
- Backend cost-estimate endpoint (a backend task; until then "Cost unavailable").
- Landing copy rewrite (yours).
- i18n-iso-countries English names (a 10 KB download, needs your yes); until then names come from Unicode CLDR.
