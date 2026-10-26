---
"@northstar-js/tokens": minor
"@northstar-js/react": minor
---

Add the Northstar interaction layer: a glass material, pointer light and spring motion for the basic components.

**Tokens.** New per-theme `material.*` roles (glass fill, tint, edge, rim, specular sheen, opaque `material.solid` fallback, glacier glow, spotlight, shadow), `material.blur.sm|md|lg`, `material.saturate`, `material.lift`, `material.press`, spring easings `motion.spring.press|release|settle` and durations `motion.duration.press|release|settle`. Under `prefers-reduced-transparency` the glass fills resolve to the solid fallback; under reduced motion the new durations go to 0 ms like the others. The contrast gate now checks text and icon roles on glass (over the ground and over `surface.3`) and on the solid fallback.

**React.** New `Surface` (glass primitive), `Card` and `Panel` (`variant="solid" | "glass" | "spotlight"`, `interactive` hover lift, `orbit` moving border). `Button` gains a press spring, a focus glow, a north-star loading spinner, and optional `success`, `material="glass"` and `magnetic` props. `Link` draws its underline in on hover and focus. `Tabs.Root` takes `indicator="line" | "solid" | "glass"` for a sliding indicator. `Dialog`, `Sheet`, `Popover`, `Menu`, `Tooltip` and `Toast` take `material`, and enter and exit on springs. `Table` takes `interactive` for hover-lift rows; inputs glow on focus and the switch thumb springs. `NorthstarProvider` takes a default `material`.

Pointer effects write CSS variables from a rAF-throttled listener and never re-render; each has a keyboard-focus twin. Motion stops under `prefers-reduced-motion` (state changes stay), glass turns solid under `prefers-reduced-transparency`, without `backdrop-filter` and in forced colours. Every new prop is optional and every default renders as before.
