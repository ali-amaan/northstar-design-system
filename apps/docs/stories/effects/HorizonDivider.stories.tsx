import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizonDivider } from '@northstar-js/react/effects';

const meta = { title: 'Effects/HorizonDivider', component: HorizonDivider } satisfies Meta<typeof HorizonDivider>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A hairline that brightens toward a single star at its centre, drawn out from the middle once. One per surface. */
export const Default: Story = { render: () => <div style={{ maxWidth: 560 }}><HorizonDivider /></div> };

export const WithLabel: Story = { args: { label: 'Earlier runs' }, render: (args) => <div style={{ maxWidth: 560 }}><HorizonDivider {...args} /></div> };
