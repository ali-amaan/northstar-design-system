// Shared scaffolding for the study-screen stories: the workspace sidebar and the properties rail,
// both built from package parts and the codename fixtures.
import { useState, type ReactNode } from 'react';
import type { ResearchItem, Study, StudyState, StudyTab } from '@northstar-js/contracts';
import { studies } from '@northstar-js/contracts/fixtures';
import { AppShell, Sidebar, SidebarItem, SidebarSection, IconButton, Kbd } from '@northstar-js/react';
import { RunConfirm, RunCost, StudyShell, StudyStatus, type CompositionGroup } from '@northstar-js/react/northstar';
import { NorthstarLockup } from '@northstar-js/react/illustrations';

const ORDER: StudyState[] = ['draft', 'ready', 'running', 'complete', 'partial', 'failed', 'archived'];

export function WorkspaceSidebar({ current }: { current: string }) {
  return (
    <Sidebar
      label="Studies"
      header={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NorthstarLockup size={16} />
          <span style={{ color: 'var(--ns-color-text-3)' }}>Workspace [NAME]</span>
        </span>
      }
    >
      <SidebarSection>
        <SidebarItem href="#" meta={<Kbd>C</Kbd>}>New study</SidebarItem>
      </SidebarSection>
      {ORDER.map((state) => {
        const list = studies.filter((s) => s.state === state);
        if (list.length === 0) return null;
        return (
          <SidebarSection key={state} title={<StudyStatus state={state} variant="inline" />}>
            {list.map((s) => (
              <SidebarItem key={s.id} href="#" active={s.id === current}>
                {s.title}
              </SidebarItem>
            ))}
          </SidebarSection>
        );
      })}
    </Sidebar>
  );
}

function Prop({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', alignItems: 'center', minHeight: 30 }}>
      <dt style={{ color: 'var(--ns-color-text-3)' }}>{term}</dt>
      <dd style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>{children}</dd>
    </div>
  );
}

const section = { padding: '12px 16px', borderBottom: '1px solid var(--ns-color-line-1)', display: 'flex', flexDirection: 'column', gap: 8 } as const;
const head = { fontSize: 12, fontWeight: 500, color: 'var(--ns-color-text-3)' } as const;

export function PropertiesRail({ study, note }: { study: Study; note?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={section}>
        <span style={head}>Properties</span>
        <dl style={{ margin: 0 }}>
          <Prop term="Status"><StudyStatus state={study.state} variant="inline" /></Prop>
          <Prop term="Owner">[NAME]</Prop>
          <Prop term="Population"><span className="ns-study-mono" style={{ fontSize: 12 }}>{study.population.label ?? '[N]'}</span></Prop>
          <Prop term="Items"><span className="ns-study-mono" style={{ fontSize: 12 }}>{study.items.length}</span></Prop>
        </dl>
      </div>
      <div style={section}>
        <span style={head}>Run</span>
        <RunCost estimate={study.cost} onRun={() => setOpen(true)} disabled={study.state !== 'draft' && study.state !== 'ready'} note={note} />
        <RunConfirm open={open} onOpenChange={setOpen} estimate={study.cost} studyTitle={study.title} onConfirm={() => {}} />
      </div>
    </>
  );
}

export function StudyScreen({
  study, tab, panel, tabActions, actions, note, saveState,
}: {
  study: Study;
  tab: StudyTab;
  panel: ReactNode;
  tabActions?: ReactNode;
  actions?: ReactNode;
  note?: ReactNode;
  saveState?: 'saved' | 'saving';
}) {
  const [current, setCurrent] = useState<StudyTab>(tab);
  const locked = study.state === 'complete' || study.state === 'archived';
  return (
    <AppShell style={{ margin: -24, minHeight: 900 }} sidebar={<WorkspaceSidebar current={study.id} />}>
      <StudyShell
        study={study}
        tab={current}
        onTabChange={setCurrent}
        {...(saveState ? { saveState } : {})}
        tabMeta={
          locked
            ? { brief: 'locked', population: 'locked', research: 'locked', responses: study.items.length }
            : { brief: `${study.objectives.length}/5`, research: study.items.length }
        }
        panels={{ [current]: current === tab ? panel : <p className="ns-study-hint">Switch back to the {tab} tab: this story shows one screen.</p> }}
        tabActions={current === tab ? tabActions : undefined}
        actions={
          <>
            {actions}
            <IconButton variant="ghost" size="sm" label="More actions" icon={<span aria-hidden="true">···</span>} />
          </>
        }
        aside={<PropertiesRail study={study} note={note} />}
      />
    </AppShell>
  );
}

/** Even, obviously synthetic splits: the stories never show plausible results. */
export function evenGroup(label: string, n: number, built: boolean): CompositionGroup {
  return {
    label,
    rows: Array.from({ length: n }, (_, i) => ({ label: `[OPTION] ${i + 1}`, margin: 1 / n, ...(built ? { panel: 1 / n } : {}) })),
  };
}

export const researchItems: ResearchItem[] = [
  { key: 'r1', question: '[NAME]: how much do you agree with [OPTION]?', type: 'mood_direction', format: 'likert', anchors: ['[OPTION] 1', '[OPTION] 2', '[OPTION] 3', '[OPTION] 4', '[OPTION] 5'] },
  { key: 'r2', question: '[NAME]: how important is [OPTION] to you?', type: 'values_identity', format: 'likert', anchors: ['[OPTION] 1', '[OPTION] 1, nearly', '[OPTION] 3', '[OPTION] 4', '[OPTION] 5'] },
  { key: 'r3', question: '[NAME]: which do you use most often?', type: 'concrete_habit', format: 'single_choice', options: ['[OPTION] A', '[OPTION] B'] },
  { key: 'r4', question: '[NAME]: put these reasons in order.', type: 'neutral_factual', format: 'ranking', options: ['[OPTION] A', '[OPTION] B', '[OPTION] C'] },
  { key: 'r5', question: '[NAME]: in your own words, why?', type: 'intention_virtue', format: 'free_text' },
];
