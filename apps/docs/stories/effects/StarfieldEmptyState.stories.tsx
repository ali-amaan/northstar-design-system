import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationButton, StarfieldEmptyState } from '@northstar-js/react/effects';

const meta = { title: 'Effects/StarfieldEmptyState', component: StarfieldEmptyState } satisfies Meta<typeof StarfieldEmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Stars on a golden lattice drift in three layers on prime-length periods; a few twinkle. Seeded, so the sky is the same on every render. */
export const Default: Story = {
  args: {
    title: 'No studies yet',
    description: 'Draft a brief, pick an audience and build a battery. Your studies will gather here.',
    action: <ConstellationButton variant="primary">New study</ConstellationButton>,
  },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <StarfieldEmptyState {...args} />
    </div>
  ),
};

export const OtherSky: Story = { args: { title: 'Nothing matches', description: 'Try a wider filter.', seed: 29, stars: 90 } };
