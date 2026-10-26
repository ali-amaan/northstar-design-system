---
"@northstar-js/tokens": minor
"@northstar-js/react": minor
---

Liquid glass, icon-first controls, guided flows and softer motion.

**Tokens.** New `material.liquid.*`: refraction scales `sm|md|lg`, `bevel`, `aberration`, `frost`, `fallback-blur`, and per-theme `tint` (glacier), `highlight`, `rim`, `rim-low`, `inner`, `shadow`. New `material.hairline` for the one border a borderless surface keeps. Motion gains `duration.micro|layout|reveal|stagger`, `easing.glide|hover` and `spring.layout`. `material.glass.fill` is lighter (Night 0.40, Day 0.50) so the glass reads as glass; the contrast gate still passes. `material.liquid.tint` turns solid under reduced transparency.

**React.** `LiquidGlass` is refractive glass: an SVG displacement filter used as a `backdrop-filter` bends the backdrop at the rim on Chromium, with a specular highlight, rim light and inner glow; Safari and Firefox get blur plus specular; reduced transparency, forced colours and no `backdrop-filter` get the opaque solid. `NorthstarProvider` inserts the shared filters once per document (`liquidGlass={false}` opts out), and `material="glass"` everywhere now uses this material. A numeric `scale` renders a filter measured to the element.

Surfaces are borderless by default (tone, shadow and a hairline), and the secondary button is a tonal fill. `IconButton` takes `expand` (`true` | `'always'`): the icon shows and the full label eases open on hover and focus. New `Toolbar` and `ToolbarItem` (icon-led, arrow-key roving, optional glass), `RevealLabel`, `Sidebar collapsed` (an icon rail that opens to full labels; labels now wrap instead of ending in an ellipsis), `Card revealActions` and `HoverActions` (secondary actions that ease in on hover and focus-within, always shown on touch).

New `FlowSteps`, `FlowStep` and `NextAction` (also as `Flow.*`, with `useFlow`): a guided sequence with progress, one clear next action, blocked steps, focus handed to the new step, and animated step changes. `StudyShell` takes `guided` (with `blockedTabs`, `stepHints`, `onFinish`, `finishLabel`) to run Brief → Population → Research → Responses as a flow. `Tabs.Root` takes `transition` for View Transitions; StudyShell's tabs use it with a sliding indicator.

New `Reveal` (IntersectionObserver scroll reveal, optional stagger; visible in server HTML), `withViewTransition` / `useViewTransition` / `canViewTransition`. Hovers ease in and out on one curve; layout moves use 400–700 ms glides. Everything holds still under `prefers-reduced-motion`. All new props are optional; existing defaults keep their API.
