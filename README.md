# Northstar design system

Tokens, fonts, icons, motion, React components, charts and maps for every Northstar product, published to npm under `@northstar-js`.

| Package | Contents |
|---|---|
| `@northstar-js/tokens` | Night and Day design tokens: CSS variables, Tailwind 4 theme, TS, JSON |
| `@northstar-js/fonts` | Inter and IBM Plex Mono, self-hosted |
| `@northstar-js/icons` | The instrument icon set |
| `@northstar-js/motion` | Lottie scenes and player |
| `@northstar-js/react` | Components, `react/northstar`, `react/illustrations` |
| `@northstar-js/charts` | Star-native figures and charts |
| `@northstar-js/maps` | World and country star maps, market status |
| `@northstar-js/contracts` | Shared types and placeholder fixtures |

## Develop

```bash
pnpm install
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```

Each change to a package adds a changeset (`pnpm changeset`). See `SPEC.md` and `PLAN.md`.
