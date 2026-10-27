import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagOrbit } from '@northstar-js/react/effects';

const meta = { title: 'Effects/TagOrbit', component: TagOrbit } satisfies Meta<typeof TagOrbit>;
export default meta;
type Story = StoryObj<typeof meta>;

const START = ['Helsinki', 'Tampere', 'Turku', 'Oulu', 'Rural'];

function Tags() {
  const [tags, setTags] = useState(START);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {tags.map((t) => (
        <TagOrbit key={t} label={t} onRemove={() => setTags((x) => x.filter((y) => y !== t))} />
      ))}
      {tags.length < START.length ? (
        <button type="button" onClick={() => setTags(START)} style={{ font: 'inherit', fontSize: 12, color: 'var(--ns-color-signal)', background: 'none', border: 0, cursor: 'pointer' }}>
          Reset
        </button>
      ) : null}
    </div>
  );
}

/** Remove a tag: its star flares and fades, and the tag folds away before it leaves the list. */
export const Default: Story = { args: { label: 'Helsinki' }, render: () => <Tags /> };

export const ReadOnly: Story = { args: { label: 'Locked population' } };
