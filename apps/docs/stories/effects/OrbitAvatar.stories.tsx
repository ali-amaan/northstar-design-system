import type { Meta, StoryObj } from '@storybook/react-vite';
import { OrbitAvatar } from '@northstar-js/react/effects';

const meta = { title: 'Effects/OrbitAvatar', component: OrbitAvatar } satisfies Meta<typeof OrbitAvatar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Workspace people stay initials. Hover an avatar, or a row marked `.ns-fx-orbit-host`, and a moon makes one turn on its graduated orbit. */
export const Default: Story = {
  args: { name: 'Ada Lovelace' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <OrbitAvatar {...args} size={24} />
        <OrbitAvatar {...args} />
        <OrbitAvatar name="Grace Hopper" size={40} />
        <OrbitAvatar name="Katherine Johnson" size={48} />
      </div>
      <a href="#member" className="ns-fx-orbit-host" style={{ display: 'inline-flex', gap: 10, alignItems: 'center', color: 'var(--ns-color-text-1)', textDecoration: 'none' }}>
        <OrbitAvatar name="Emmy Noether" />
        Emmy Noether, owner
      </a>
    </div>
  ),
};
