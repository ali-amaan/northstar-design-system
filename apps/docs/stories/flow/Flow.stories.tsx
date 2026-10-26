import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field, FlowStep, FlowSteps, Input, NextAction, NorthstarProvider, Reveal, Stack, Switch, Tag, Textarea, type ResolvedTheme } from '@northstar-js/react';
import { StudyShell } from '@northstar-js/react/northstar';
import { studies } from '@northstar-js/contracts/fixtures';

const meta = {
  title: 'Flow/FlowSteps',
  parameters: {
    docs: {
      description: {
        component:
          'A guided sequence with one clear next action. Progress shows as a step list and a rail; steps change with a view transition where supported (a directional slide elsewhere); focus moves to the new step title. Under reduced motion it changes instantly.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Setup() {
  const [brief, setBrief] = useState('');
  const [done, setDone] = useState(false);
  return (
    <FlowSteps label="Study setup" onComplete={() => setDone(true)} style={{ maxWidth: 640 }}>
      <FlowStep value="brief" title="Brief" description="What decision this study informs" blocked={brief.trim().length === 0}>
        <Field label="Decision">
          <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Type a sentence to continue" />
        </Field>
        <NextAction hint={brief ? undefined : 'Write the decision first'} />
      </FlowStep>
      <FlowStep value="population" title="Population" description="Who answers">
        <Stack direction="row" gap={8} wrap>
          <Tag>Age 25–34</Tag>
          <Tag tone="signal">Uusimaa</Tag>
        </Stack>
        <NextAction hint="[N] agents" />
      </FlowStep>
      <FlowStep value="research" title="Research" description="The questions">
        <Field label="First question">
          <Input defaultValue="How often do you [OPTION]?" />
        </Field>
        <Switch defaultChecked>Validate anchors before running</Switch>
        <NextAction />
      </FlowStep>
      <FlowStep value="review" title="Review">
        <p style={{ margin: 0, color: 'var(--ns-color-text-2)' }}>{done ? 'Queued.' : 'Cost unavailable'}</p>
        <NextAction finishLabel="Run study" />
      </FlowStep>
    </FlowSteps>
  );
}

export const Guided: Story = { render: () => <Setup /> };

function Pair({ theme }: { theme: ResolvedTheme }) {
  return (
    <NorthstarProvider theme={theme} style={{ padding: 24, background: 'var(--ns-color-ground)' }}>
      <Setup />
    </NorthstarProvider>
  );
}

export const NightAndDay: Story = {
  name: 'Night and Day',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))' }}>
      <Pair theme="night" />
      <Pair theme="day" />
    </div>
  ),
};

export const StudyShellGuided: Story = {
  name: 'StudyShell, guided mode',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <StudyShell
      study={studies[0]!}
      guided
      stepHints={{ population: '[N] agents', research: '[N] questions' }}
      finishLabel="Open report"
      panels={{
        brief: <p style={{ margin: 0 }}>The brief editor goes here.</p>,
        population: <p style={{ margin: 0 }}>The population panel goes here.</p>,
        research: <p style={{ margin: 0 }}>The research builder goes here.</p>,
        responses: <p style={{ margin: 0 }}>Responses arrive here.</p>,
      }}
    />
  ),
};

export const ScrollReveal: Story = {
  name: 'Reveal (scroll-linked, staggered)',
  render: () => (
    <Stack gap={24}>
      <p style={{ color: 'var(--ns-color-text-2)' }}>Scroll down: each group fades and rises in, its items staggered.</p>
      <div style={{ height: '70vh' }} />
      {[1, 2, 3].map((g) => (
        <Reveal key={g} stagger as="ul" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <li key={i} style={{ padding: 16, borderRadius: 12, background: 'var(--ns-color-surface-1)' }}>
              Group {g}, item {i}
            </li>
          ))}
        </Reveal>
      ))}
    </Stack>
  ),
};
