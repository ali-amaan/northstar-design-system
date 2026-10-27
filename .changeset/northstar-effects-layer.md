---
"@northstar-js/react": minor
---

Add `@northstar-js/react/effects` and `effects.css`: opt-in Northstar variants themed on stars, orbits, navigation instruments and a little arithmetic.

**Actions.** `StarLink` (meridian-traced underline, a north star twinkles in), `ConstellationButton` (a press lets out a seeded, golden-angle constellation that joins and fades), `KbdKeycap` (physical depth, sinks while its key is held).

**Loaders and progress.** `OrbitSpinner` (two planets on Kepler periods), `FibonacciLoader` (Vogel sunflower, pulse along the parastichies), `LissajousLoader` (exact 3:2 figure from two sine-eased translations), `PrimeSkeleton` (shimmers on prime periods), `ProgressSextant` (graduated arc with a swinging index arm, `role="progressbar"`).

**Forms.** `CompassSwitch` (needle swings west to north), `SextantSlider` (native range, vernier ticks, Plex Mono readout, star detents that catch only while dragging), `ConstellationCheckbox` (tick drawn star to star, mixed state), `RadioOrbitGroup` / `RadioOrbit` (native radios; the chosen orbit gains a planet and a moon), `GraticuleInput` (focus draws a graduated rule; invalid is dashed plus a message).

**Navigation.** `MeridianTabs` (star indicator travels on an arc, full tabs keyboard pattern), `StarPagination`, `ConstellationBreadcrumb`.

**Display and feedback.** `RollingNumber` / `CountUp` (odometer reels), `HorizonDivider`, `StarfieldEmptyState` (golden-lattice sky, prime-period drift), `OrbitAvatar` (initials, orbit on hover), `TagOrbit` (remove: the star fades out), `SineDisclosure` / `SineAccordion` (sine-eased reveal), `TooltipCompass` (arrow is a settling needle), `ToastComet` (enters on a short arc).

Every effect animates transform and opacity only, uses seeded maths instead of `Math.random`, keeps native controls and keyboard parity, and stops under `prefers-reduced-motion` with its state still visible (loaders show their label). Glacier is the only signal colour; Night and Day both supported. The existing components are unchanged.
