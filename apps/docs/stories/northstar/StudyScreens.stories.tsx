import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ResearchItem } from '@northstar-js/contracts';
import { studyAurora, studyBorealis } from '@northstar-js/contracts/fixtures';
import { Button, Kbd } from '@northstar-js/react';
import { BriefForm, ExportMenu, PopulationPanel, ResearchBuilder, ResponsesView } from '@northstar-js/react/northstar';
import { StudyScreen, evenGroup, researchItems } from './workspace.js';

/**
 * The four study screens from the canvas (Brief, Population, Research, Responses), rebuilt from the
 * packages and the codename fixtures. Every screen has a Night and a Day story.
 */
const meta = { title: 'Northstar/Study screens', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const day = { globals: { theme: 'day' } } as const;

function BriefScreen() {
  const study = { ...studyAurora, objectives: ['Rank [OPTION] against [OPTION].', 'Find which reasons for [OPTION] are most widely held.'] };
  const [brief, setBrief] = useState({ title: study.title, decision: 'Whether to make [OPTION] the default next year.', objectives: study.objectives });
  return (
    <StudyScreen
      study={{ ...study, title: brief.title || study.title, objectives: brief.objectives }}
      tab="brief"
      saveState="saved"
      note={<span>Fix the anchor check in Research to run. Nothing is spent until you confirm.</span>}
      panel={
        <BriefForm
          value={brief}
          onValueChange={setBrief}
          objectiveMeta={(i) => (i === 0 ? '3 items' : '2 items')}
          toolbar={
            <>
              <Button size="sm">Concept screening</Button>
              <span className="ns-study-hint">Template</span>
            </>
          }
        />
      }
    />
  );
}

function PopulationScreen() {
  const [pop, setPop] = useState({ ...studyAurora.population, seed: 0 });
  return (
    <StudyScreen
      study={{ ...studyAurora, population: pop }}
      tab="population"
      saveState="saving"
      panel={
        <PopulationPanel
          population={pop}
          onSizeChange={(n) => setPop({ ...pop, size: n ?? 0 })}
          onSeedChange={(n) => setPop({ ...pop, seed: n ?? 0 })}
          onRebuild={() => {}}
          compositionNote="Raked to published margins"
          composition={[evenGroup('Age', 3, true), evenGroup('Gender', 2, true), evenGroup('Municipality type', 3, true), evenGroup('Party support', 4, true)]}
          caption="Bars are illustrative until the roster is built. Splits shown here are placeholders."
        />
      }
    />
  );
}

function ResearchScreen() {
  const [items, setItems] = useState<ResearchItem[]>(researchItems);
  const [sel, setSel] = useState<string | null>('r2');
  return (
    <StudyScreen
      study={{ ...studyAurora, items }}
      tab="research"
      saveState="saved"
      tabActions={
        <Button size="sm" onClick={() => setItems([...items, { key: `r${items.length + 1}`, question: '', type: 'mood_direction', format: 'likert', anchors: ['', '', '', '', ''] }])}>
          Item <Kbd>I</Kbd>
        </Button>
      }
      note={<span>R2 fails the anchor check. Fix it to run.</span>}
      panel={
        <ResearchBuilder
          items={items}
          onItemsChange={setItems}
          selectedKey={sel}
          onSelectedKeyChange={setSel}
          anchorIssues={{ r2: [{ anchor: 1, message: 'Too close to anchor 1 in meaning, so the scale cannot separate them. Rewrite it as a distinct step between 1 and 3.' }] }}
        />
      }
    />
  );
}

function ResponsesScreen() {
  const study = { ...studyBorealis, objectives: ['Rank [OPTION] options for [NAME].', 'Reasons for [OPTION].'] };
  return (
    <StudyScreen
      study={study}
      tab="responses"
      actions={<ExportMenu onExport={() => {}} />}
      panel={
        <ResponsesView
          study={study}
          objectiveOf={(_, i) => i}
          renderExtra={(item) => (item.key === 'item-1' ? <p style={{ margin: 0, fontStyle: 'italic' }}>“[Selected free-text answer, shown under the figure it explains.]”</p> : null)}
        />
      }
    />
  );
}

export const Brief: Story = { render: () => <BriefScreen /> };
export const BriefDay: Story = { ...day, name: 'Brief (Day)', render: () => <BriefScreen /> };
export const Population: Story = { render: () => <PopulationScreen /> };
export const PopulationDay: Story = { ...day, name: 'Population (Day)', render: () => <PopulationScreen /> };
export const Research: Story = { render: () => <ResearchScreen /> };
export const ResearchDay: Story = { ...day, name: 'Research (Day)', render: () => <ResearchScreen /> };
export const Responses: Story = { render: () => <ResponsesScreen /> };
export const ResponsesDay: Story = { ...day, name: 'Responses (Day)', render: () => <ResponsesScreen /> };
