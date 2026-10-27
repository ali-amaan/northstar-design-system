import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstellationButton, TooltipCompass } from '@northstar-js/react/effects';

const meta = { title: 'Effects/TooltipCompass', component: TooltipCompass } satisfies Meta<typeof TooltipCompass>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The arrow is a compass needle: it swings in and settles with its Glacier end on the trigger. Hover or tab to a button; Escape closes. */
export const Default: Story = {
  args: { content: 'Raked to the 2023 margins', children: <button type="button">x</button> },
  render: () => (
    <div style={{ display: 'flex', gap: 24, padding: '64px 24px' }}>
      <TooltipCompass content="Raked to the 2023 margins">
        <ConstellationButton>Calibrate</ConstellationButton>
      </TooltipCompass>
      <TooltipCompass content="Opens the run log in a side sheet" side="bottom">
        <ConstellationButton>Run log</ConstellationButton>
      </TooltipCompass>
    </div>
  ),
};
