import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, LiquidGlass, Stack } from '@northstar-js/react';
import { DuplicateIcon, ExportIcon, RunIcon } from '@northstar-js/icons';
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

/** `icon` leads; with `expand` only the icon shows and the full label eases open on hover and focus (always on touch). */
export const IconAndExpand: Story = {
  name: 'Icon and expand',
  render: () => (
    <Stack gap={12}>
      <Stack direction="row" gap={8} align="center">
        <Button icon={<DuplicateIcon size={16} />}>Duplicate</Button>
        <Button variant="primary" icon={<RunIcon size={16} />}>
          Run study
        </Button>
      </Stack>
      <Stack direction="row" gap={8} align="center">
        <Button icon={<DuplicateIcon size={16} />} expand>
          Duplicate study
        </Button>
        <Button variant="ghost" icon={<ExportIcon size={16} />} expand>
          Export results as a report
        </Button>
        <Button variant="primary" icon={<RunIcon size={16} />} expand="always">
          Run study
        </Button>
      </Stack>
    </Stack>
  ),
};

/** On liquid glass, secondary and primary buttons are brushed silver; `tone="silver"` asks for it anywhere. */
export const Silver: Story = {
  render: () => (
    <Backdrop minHeight={200}>
      <Stack gap={16}>
        <LiquidGlass style={{ padding: 16, display: 'inline-flex', gap: 8, alignSelf: 'flex-start' }}>
          <Button variant="primary" icon={<RunIcon size={14} />}>
            Run study
          </Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button material="solid">Solid (opt out)</Button>
        </LiquidGlass>
        <Stack direction="row" gap={8}>
          <Button tone="silver">Silver off glass</Button>
          <Button tone="silver" variant="primary">
            Silver primary
          </Button>
        </Stack>
      </Stack>
    </Backdrop>
  ),
};
