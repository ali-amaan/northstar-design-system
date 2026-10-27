import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioOrbit, RadioOrbitGroup } from '@northstar-js/react/effects';

const meta = { title: 'Effects/RadioOrbit', component: RadioOrbitGroup } satisfies Meta<typeof RadioOrbitGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each option is an orbit. The chosen one gains a planet, and its moon makes one turn and settles at north. Native radios: arrow keys move the choice. */
export const Default: Story = {
  args: { legend: 'Panel size', defaultValue: '300' },
  render: (args) => (
    <RadioOrbitGroup {...args}>
      <RadioOrbit value="100" description="Quick screen, wider band">100 agents</RadioOrbit>
      <RadioOrbit value="300" description="Recommended">300 agents</RadioOrbit>
      <RadioOrbit value="1000" description="Narrowest band">1,000 agents</RadioOrbit>
    </RadioOrbitGroup>
  ),
};

export const Horizontal: Story = {
  args: { legend: 'Theme', defaultValue: 'night', orientation: 'horizontal' },
  render: (args) => (
    <RadioOrbitGroup {...args}>
      <RadioOrbit value="night">Night</RadioOrbit>
      <RadioOrbit value="day">Day</RadioOrbit>
      <RadioOrbit value="system">System</RadioOrbit>
    </RadioOrbitGroup>
  ),
};
