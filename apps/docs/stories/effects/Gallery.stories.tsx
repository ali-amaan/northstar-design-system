import type { Meta, StoryObj } from '@storybook/react-vite';
import { NorthstarProvider, type ResolvedTheme } from '@northstar-js/react';
import {
  CompassSwitch, ConstellationBreadcrumb, ConstellationButton, ConstellationCheckbox, FibonacciLoader, GraticuleInput, HorizonDivider,
  KbdKeycap, LissajousLoader, MeridianTabs, OrbitAvatar, OrbitSpinner, PrimeSkeleton, ProgressSextant, RadioOrbit, RadioOrbitGroup,
  RollingNumber, SextantSlider, SineAccordion, StarfieldEmptyState, StarLink, StarPagination, TagOrbit, ToastComet, TooltipCompass,
} from '@northstar-js/react/effects';

const meta = { title: 'Effects/Gallery', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Tile({ name, note, wide, children }: { name: string; note: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <section
      aria-label={name}
      style={{
        gridColumn: wide ? '1 / -1' : undefined,
        display: 'grid',
        alignContent: 'start',
        gap: 14,
        padding: 16,
        border: '1px solid var(--ns-color-line-1)',
        borderRadius: 12,
        background: 'var(--ns-color-surface-1)',
        minWidth: 0,
      }}
    >
      <header style={{ display: 'grid', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ns-font-family-mono)', fontSize: 12, color: 'var(--ns-color-text-1)' }}>{name}</span>
        <span style={{ fontSize: 12, color: 'var(--ns-color-text-3)' }}>{note}</span>
      </header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', minHeight: 48 }}>{children}</div>
    </section>
  );
}

const tabs = [
  { value: 'brief', label: 'Brief', content: 'What the study asks.' },
  { value: 'population', label: 'Population', content: 'Raked to published margins.' },
  { value: 'results', label: 'Results', content: 'Shares with their band.' },
];

const accordion = [
  { value: 'a', title: 'How the population is built', content: <p>Raked to published margins.</p> },
  { value: 'b', title: 'What a band means', content: <p>Measured against published figures.</p> },
];

function Board({ theme }: { theme: ResolvedTheme }) {
  const label = theme === 'night' ? 'Night' : 'Day';
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }} data-board={theme}>
      <div style={{ display: 'grid', gap: 6, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ns-color-text-1)' }}>Effects, {label}</h2>
        <span style={{ fontSize: 13, color: 'var(--ns-color-text-2)' }}>
          Opt-in variants from <code style={{ fontFamily: 'var(--ns-font-family-mono)' }}>@northstar-js/react/effects</code>. Transform and opacity only, seeded, still under reduced motion.
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        <Tile name="StarLink" note="Meridian underline, a star twinkles in">
          <span style={{ color: 'var(--ns-color-text-2)' }}>
            Read the <StarLink href="#m" data-fx-hover={theme}>method note</StarLink>
          </span>
        </Tile>
        <Tile name="ConstellationButton" note="Press lets out a seeded constellation">
          <ConstellationButton variant="primary" data-fx-press={theme}>Lock population</ConstellationButton>
          <ConstellationButton seed={19}>Save</ConstellationButton>
        </Tile>
        <Tile name="KbdKeycap" note="Physical depth; sinks while held">
          <KbdKeycap>Ctrl</KbdKeycap>
          <KbdKeycap pressed>K</KbdKeycap>
          <KbdKeycap listen="Enter">Enter</KbdKeycap>
        </Tile>
        <Tile name="Orbit · Fibonacci · Lissajous" note="Kepler periods, golden angle, 3:2 figure">
          <OrbitSpinner size={40} />
          <FibonacciLoader size={40} />
          <LissajousLoader size={40} />
        </Tile>
        <Tile name="ProgressSextant" note="Graduated limb and a swinging index arm">
          <ProgressSextant value={62} label={`Fieldwork, ${label}`} width={180} />
        </Tile>
        <Tile name="PrimeSkeleton" note="Shimmers on prime periods, never in step">
          <div style={{ width: '100%' }}>
            <PrimeSkeleton lines={3} />
          </div>
        </Tile>
        <Tile name="CompassSwitch" note="Needle swings from west to north">
          <div style={{ display: 'grid', gap: 10 }}>
            <CompassSwitch>Weight to census</CompassSwitch>
            <CompassSwitch defaultChecked>Lock population</CompassSwitch>
          </div>
        </Tile>
        <Tile name="SextantSlider" note="Vernier ticks, mono readout, star detents">
          <div style={{ width: '100%' }}>
            <SextantSlider label="Panel size" min={100} max={1000} step={25} defaultValue={500} detents={[300, 500]} format={(v) => `${v}`} />
          </div>
        </Tile>
        <Tile name="ConstellationCheckbox" note="The tick is drawn star to star">
          <div style={{ display: 'grid', gap: 10 }}>
            <ConstellationCheckbox defaultChecked>Rake to 2023 margins</ConstellationCheckbox>
            <ConstellationCheckbox>Include pilot answers</ConstellationCheckbox>
            <ConstellationCheckbox indeterminate>Some regions</ConstellationCheckbox>
          </div>
        </Tile>
        <Tile name="RadioOrbit" note="The chosen orbit gains a planet and a moon">
          <RadioOrbitGroup legend="Panel size" defaultValue="300">
            <RadioOrbit value="100">100 agents</RadioOrbit>
            <RadioOrbit value="300" description="Recommended">300 agents</RadioOrbit>
          </RadioOrbitGroup>
        </Tile>
        <Tile name="GraticuleInput" note="Focus draws a graduated rule">
          <div style={{ width: '100%', display: 'grid', gap: 14 }}>
            <GraticuleInput label="Study name" placeholder="Autumn pilot" data-fx-focus={theme} />
            <GraticuleInput label="Sample size" defaultValue="0" error="Enter at least 100" />
          </div>
        </Tile>
        <Tile name="MeridianTabs" note="The star travels on an arc">
          <div style={{ width: '100%' }}>
            <MeridianTabs tabs={tabs} label={`Study, ${label}`} defaultValue="population" />
          </div>
        </Tile>
        <Tile name="StarPagination" note="Current page is a star; edges thin out">
          <StarPagination count={24} defaultPage={6} label={`Pagination, ${label}`} />
        </Tile>
        <Tile name="ConstellationBreadcrumb" note="A path of brightening stars">
          <ConstellationBreadcrumb label={`Breadcrumbs, ${label}`} items={[{ label: 'Studies', href: '#' }, { label: 'Autumn pilot', href: '#' }, { label: 'Results' }]} />
        </Tile>
        <Tile name="RollingNumber" note="Odometer reels, units first">
          <span style={{ fontSize: 28, color: 'var(--ns-color-text-1)' }}>
            <RollingNumber value={1284} />
          </span>
          <span style={{ fontSize: 28, color: 'var(--ns-color-text-1)' }}>
            <RollingNumber value={0.42} format={{ style: 'percent' }} />
          </span>
        </Tile>
        <Tile name="HorizonDivider" note="One horizon rule per surface">
          <div style={{ width: '100%' }}>
            <HorizonDivider />
            <HorizonDivider label="Earlier runs" />
          </div>
        </Tile>
        <Tile name="OrbitAvatar" note="Initials; a moon turns on hover">
          <OrbitAvatar name="Ada Lovelace" />
          <OrbitAvatar name="Grace Hopper" size={40} />
          <OrbitAvatar name="Emmy Noether" size={48} />
        </Tile>
        <Tile name="TagOrbit" note="Remove: the star flares and fades">
          <TagOrbit label="Helsinki" onRemove={() => {}} />
          <TagOrbit label="Tampere" onRemove={() => {}} />
          <TagOrbit label="Locked" />
        </Tile>
        <Tile name="SineAccordion" note="Reveal on half a cosine">
          <div style={{ width: '100%' }}>
            <SineAccordion items={accordion} defaultValue={['a']} headingLevel={4} />
          </div>
        </Tile>
        <Tile name="TooltipCompass" note="The arrow is a settling needle">
          <TooltipCompass content="Raked to the 2023 margins">
            <ConstellationButton data-fx-tip={theme}>Calibrate</ConstellationButton>
          </TooltipCompass>
        </Tile>
        <Tile name="ToastComet" note="Arrives on an arc with a fading tail" wide>
          <ToastComet title="Study saved" description="Draft 3 of the autumn pilot." onDismiss={() => {}} />
        </Tile>
        <Tile name="StarfieldEmptyState" note="Golden-lattice sky, drifting on prime periods" wide>
          <div style={{ width: '100%' }}>
            <StarfieldEmptyState
              title="No studies yet"
              description="Draft a brief, pick an audience and build a battery."
              action={<ConstellationButton variant="primary">New study</ConstellationButton>}
              headingLevel={4}
            />
          </div>
        </Tile>
      </div>
    </NorthstarProvider>
  );
}

export const NightAndDay: Story = {
  name: 'Night and Day',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(640px, 1fr))' }}>
      <Board theme="night" />
      <Board theme="day" />
    </div>
  ),
};

export const Night: Story = { render: () => <Board theme="night" /> };
export const Day: Story = { globals: { theme: 'day' }, render: () => <Board theme="day" /> };
