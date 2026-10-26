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
}

/** Export a finished study: PDF report, report spec, or responses as CSV. */
export function ExportMenu({ onExport, formats = ['pdf', 'spec', 'csv'], disabledFormats = [], disabled = false, className, messages }: ExportMenuProps) {
  const m = studyMessages(messages);
  return (
    <Menu.Root>
      <Menu.Trigger className={['ns-button ns-button--secondary ns-size-md', className].filter(Boolean).join(' ')} disabled={disabled}>
        <Icon name="export" size={14} />
        <span className="ns-button__label">{m.export}</span>
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
