'use client';
import { Icon } from '@northstar-js/icons';
import { Menu } from '../overlays.js';
import { studyMessages, type WithMessages } from './messages.js';

export type ExportFormat = 'pdf' | 'spec' | 'csv';

export interface ExportMenuProps extends WithMessages {
  onExport: (format: ExportFormat) => void;
  /** Which formats to offer, in order. Default all three. */
  formats?: ExportFormat[];
  /** Formats shown but not available yet. */
  disabledFormats?: ExportFormat[];
  disabled?: boolean;
  className?: string;
  /** Icon-first trigger: the export icon shows and "Export" eases open on hover, focus and while open. `always` keeps it. Default false. */
  expand?: boolean | 'always';
}

/** Export a finished study: PDF report, report spec, or responses as CSV. */
export function ExportMenu({ onExport, formats = ['pdf', 'spec', 'csv'], disabledFormats = [], disabled = false, className, expand = false, messages }: ExportMenuProps) {
  const m = studyMessages(messages);
  return (
    <Menu.Root>
      <Menu.Trigger
        className={['ns-button ns-button--secondary ns-size-md ns-export-menu', className].filter(Boolean).join(' ')}
        disabled={disabled}
        icon={<Icon name="export" size={14} />}
        expand={expand}
      >
        {m.export}
      </Menu.Trigger>
      <Menu.Content align="end">
        {formats.map((f) => (
          <Menu.Item key={f} onSelect={() => onExport(f)} disabled={disabledFormats.includes(f)}>
            {m.exportFormats[f]}
          </Menu.Item>
        ))}
      </Menu.Content>
    </Menu.Root>
  );
}
