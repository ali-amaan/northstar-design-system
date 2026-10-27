import type { Meta, StoryObj } from '@storybook/react-vite';
import { MeridianTabs } from '@northstar-js/react/effects';

const meta = { title: 'Effects/MeridianTabs', component: MeridianTabs } satisfies Meta<typeof MeridianTabs>;
export default meta;
type Story = StoryObj<typeof meta>;

const tabs = [
  { value: 'brief', label: 'Brief', content: 'What the study asks and why.' },
  { value: 'population', label: 'Population', content: 'Raked to published margins: age, gender, municipality type, party.' },
  { value: 'battery', label: 'Battery', content: 'Twelve questions, anchors validated before any paid call.' },
  { value: 'results', label: 'Results', content: 'Shares with their measured band.' },
];

/** The indicator star travels to the chosen tab along a short arc while the rule stretches to fit. Arrows, Home and End move and select. */
export const Default: Story = {
  args: { tabs, label: 'Study' },
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <MeridianTabs {...args} />
    </div>
  ),
};
