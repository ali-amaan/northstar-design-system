import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Stack } from '@northstar-js/react';
import { Backdrop } from '../interactions/backdrop';

const meta = { title: 'Actions/Button' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <Stack gap={16}>
      <Stack direction="row" gap={8} align="center">
        <Button variant="primary">Run study</Button>
        <Button>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button tone="signal" variant="ghost">Signal</Button>
        <Button disabled>Disabled</Button>
        <Button variant="primary" loading>Running</Button>
      </Stack>
      <Stack direction="row" gap={8} align="center">
        <Button size="sm">Small 28</Button>
        <Button size="md">Medium 32</Button>
        <Button size="lg">Large 36</Button>
        <Button size="xl" variant="primary">XL 44</Button>
      </Stack>
    </Stack>
  ),
};

/** Press springs, focus glow, the north-star spinner and the success check. */
export const Interactions: Story = {
  render: function Render() {
    const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
    const run = () => {
      setState('loading');
      setTimeout(() => setState('done'), 1400);
      setTimeout(() => setState('idle'), 3200);
    };
    return (
      <Backdrop minHeight={220}>
        <Stack gap={16}>
          <Stack direction="row" gap={8} align="center" wrap>
            <Button variant="primary" magnetic loading={state === 'loading'} success={state === 'done'} successLabel="Study saved" onClick={run}>
              Save study
            </Button>
            <Button material="glass" magnetic>Glass, magnetic</Button>
            <Button material="glass" variant="ghost">Glass ghost</Button>
            <Button success>Saved</Button>
            <Button loading>Running</Button>
          </Stack>
          <p style={{ margin: 0, color: 'var(--ns-color-text-2)' }}>Press and hold to feel the press spring; Tab to see the focus ring snap in.</p>
        </Stack>
      </Backdrop>
    );
  },
};
