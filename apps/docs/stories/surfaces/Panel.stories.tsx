import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton, List, ListItem, Panel, Stack } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Surfaces/Panel' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const More = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16"><circle cx="3" cy="8" r="1.3" fill="currentColor" /><circle cx="8" cy="8" r="1.3" fill="currentColor" /><circle cx="13" cy="8" r="1.3" fill="currentColor" /></svg>
);

export const Variants: Story = {
  render: () => (
    <Backdrop>
      <Stack direction="row" gap={20} wrap align="start">
        {(['solid', 'glass', 'spotlight'] as const).map((v) => (
          <Panel key={v} variant={v} title={`Population · ${v}`} actions={<IconButton size="sm" variant="ghost" label="Panel actions" icon={<More />} />} flush style={{ width: 280 }}>
            <List>
              <ListItem title="Age" description="Raked to published margins" />
              <ListItem title="Region" description="Raked to published margins" />
              <ListItem title="Household" description="Drawn from conditionals" />
            </List>
          </Panel>
        ))}
      </Stack>
    </Backdrop>
  ),
};
