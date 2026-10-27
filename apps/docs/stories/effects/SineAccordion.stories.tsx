import type { Meta, StoryObj } from '@storybook/react-vite';
import { SineAccordion, SineDisclosure } from '@northstar-js/react/effects';

const meta = { title: 'Effects/SineAccordion', component: SineAccordion } satisfies Meta<typeof SineAccordion>;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  {
    value: 'population',
    title: 'How the population is built',
    content: (
      <>
        <p>Age, gender, municipality type and party support are raked to published margins.</p>
        <p>Fact-card attributes are drawn from published conditionals.</p>
      </>
    ),
  },
  { value: 'anchors', title: 'Why anchors are validated first', content: <p>A badly framed anchor costs a whole run, so the gate runs before any paid call.</p> },
  { value: 'bands', title: 'What a band means', content: <p>Each question type carries the error band measured against published figures.</p> },
];

/** Content arrives on a sine ease, each block a beat after the last; the meridian marker turns a quarter. Up, Down, Home and End move between headers. */
export const Default: Story = { args: { items, defaultValue: ['population'] }, render: (args) => <div style={{ maxWidth: 560 }}><SineAccordion {...args} /></div> };

export const Multiple: Story = { args: { items, type: 'multiple' }, render: (args) => <div style={{ maxWidth: 560 }}><SineAccordion {...args} /></div> };

export const Disclosure: Story = {
  args: { items },
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <SineDisclosure title="Method note">
        <p>Shares are a screening signal about a population, not a prediction about a person.</p>
      </SineDisclosure>
    </div>
  ),
};
