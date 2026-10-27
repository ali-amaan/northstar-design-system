// @northstar-js/react/effects — opt-in Northstar variants: stars, orbits,
// instruments and a little arithmetic. Styles ship in `effects.css`; load it
// after `styles.css`. Every effect is transform/opacity only, seeded rather
// than random, and still (with its state visible) under reduced motion.
export { StarLink, ConstellationButton, KbdKeycap } from './actions.js';
export type { StarLinkProps, ConstellationButtonProps, KbdKeycapProps } from './actions.js';

export { OrbitSpinner, FibonacciLoader, LissajousLoader, PrimeSkeleton, ProgressSextant } from './loaders.js';
export type { LoaderProps, FibonacciLoaderProps, LissajousLoaderProps, PrimeSkeletonProps, ProgressSextantProps } from './loaders.js';

export { CompassSwitch, SextantSlider, ConstellationCheckbox, RadioOrbitGroup, RadioOrbit, GraticuleInput } from './controls.js';
export type {
  CompassSwitchProps, SextantSliderProps, ConstellationCheckboxProps, RadioOrbitGroupProps, RadioOrbitProps, GraticuleInputProps,
} from './controls.js';

export { MeridianTabs, StarPagination, ConstellationBreadcrumb } from './navigation.js';
export type { MeridianTab, MeridianTabsProps, StarPaginationProps, ConstellationCrumb, ConstellationBreadcrumbProps } from './navigation.js';

export { RollingNumber, CountUp, HorizonDivider, StarfieldEmptyState, OrbitAvatar, initialsOf, TagOrbit, SineDisclosure, SineAccordion } from './display.js';
export type {
  RollingNumberProps, CountUpProps, HorizonDividerProps, StarfieldEmptyStateProps, OrbitAvatarProps, TagOrbitProps, SineDisclosureProps,
  SineAccordionItem, SineAccordionProps,
} from './display.js';

export { TooltipCompass, ToastComet } from './overlays.js';
export type { TooltipCompassProps, ToastCometProps } from './overlays.js';

export { GOLDEN_ANGLE, PRIMES, fibonacci, seeded, vogel, lissajousPath, starPath } from './math.js';
