// @vitest-environment jsdom
import './setup.js';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Checkbox, Combobox, Field, Input, NumberInput, Radio, RadioGroup, SearchInput, Select, Slider, Switch, Textarea } from '../src/index.js';
import { expectNoAxeViolations } from './a11y.js';

const countries = [
  { value: 'FI', label: 'Finland' },
  { value: 'JP', label: 'Japan' },
  { value: 'US', label: 'United States', disabled: true },
  { value: 'SE', label: 'Sweden' },
];

describe('Field + Input', () => {
  it('labels the control and wires description, error and aria-invalid', async () => {
    render(
      <Field label="Study name" description="Shown to your team." error="Required" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: /Study name/ });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('required')).toBe(true);
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Shown to your team.', '! Required']);
    await expectNoAxeViolations();
  });

  it('is uncontrolled with defaultValue and controlled with value', async () => {
    const onValueChange = vi.fn();
    render(<Field label="A"><Input defaultValue="x" onValueChange={onValueChange} /></Field>);
    await userEvent.type(screen.getByRole('textbox'), 'y');
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('xy');
    expect(onValueChange).toHaveBeenLastCalledWith('xy');

    function Controlled() {
      const [v, setV] = useState('');
      return <Field label="B"><Input value={v} onValueChange={(n) => setV(n.toUpperCase())} /></Field>;
    }
    render(<Controlled />);
    await userEvent.type(screen.getByRole('textbox', { name: 'B' }), 'ab');
    expect((screen.getByRole('textbox', { name: 'B' }) as HTMLInputElement).value).toBe('AB');
  });

  it('Textarea and Select work and pass axe', async () => {
    const onSelect = vi.fn();
    render(
      <div>
        <Field label="Brief"><Textarea defaultValue="" /></Field>
        <Field label="Market"><Select options={countries} placeholder="Choose" onValueChange={onSelect} /></Field>
      </div>,
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Brief' }), 'hello');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Market' }), 'JP');
    expect(onSelect).toHaveBeenCalledWith('JP');
    await expectNoAxeViolations();
  });
});

describe('Combobox', () => {
  it('filters, moves with arrows (skipping disabled), selects with Enter, closes with Escape', async () => {
    const onValueChange = vi.fn();
    render(<Field label="Country"><Combobox options={countries} onValueChange={onValueChange} /></Field>);
    const input = screen.getByRole('combobox', { name: 'Country' });
    await userEvent.click(input);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await expectNoAxeViolations();
    await userEvent.type(input, 'a');
    // Finland, Japan, United States (disabled)
    expect(screen.getAllByRole('option')).toHaveLength(3);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    // third ArrowDown skips disabled United States and wraps to Finland
    expect(input.getAttribute('aria-activedescendant')).toMatch(/-0$/);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('JP');
    expect((input as HTMLInputElement).value).toBe('Japan');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    await userEvent.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard('{Escape}');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the no-results message', async () => {
    render(<Combobox aria-label="Country" options={countries} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('No results')).toBeTruthy();
  });
});

describe('Checkbox, Radio, Switch', () => {
  it('Checkbox toggles with Space and supports indeterminate', async () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(<Checkbox onCheckedChange={onCheckedChange}>Include archived</Checkbox>);
    const box = screen.getByRole('checkbox', { name: 'Include archived' });
    box.focus();
    await userEvent.keyboard(' ');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    rerender(<Checkbox indeterminate>Include archived</Checkbox>);
    expect((box as HTMLInputElement).indeterminate).toBe(true);
    await expectNoAxeViolations();
  });

  it('RadioGroup selects by click and arrow keys', async () => {
    const onValueChange = vi.fn();
    render(
      <RadioGroup label="Claim" defaultValue="level" onValueChange={onValueChange}>
        <Radio value="level">Level</Radio>
        <Radio value="direction">Direction</Radio>
        <Radio value="ranking">Ranking</Radio>
      </RadioGroup>,
    );
    expect((screen.getByRole('radio', { name: 'Level' }) as HTMLInputElement).checked).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: 'Ranking' }));
    expect(onValueChange).toHaveBeenLastCalledWith('ranking');
    await expectNoAxeViolations();
  });

  it('Switch toggles aria-checked on click and keyboard', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange}>Dark sidebar</Switch>);
    const sw = screen.getByRole('switch', { name: 'Dark sidebar' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    await userEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    await userEvent.keyboard('{Enter}');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
    await expectNoAxeViolations();
  });
});

describe('Slider, NumberInput, SearchInput', () => {
  it('Slider reports numbers', async () => {
    const onValueChange = vi.fn();
    render(<Field label="Sample size"><Slider min={0} max={500} step={50} defaultValue={100} onValueChange={onValueChange} /></Field>);
    const s = screen.getByRole('slider', { name: 'Sample size' });
    fireEvent.change(s, { target: { value: '150' } });
    expect(onValueChange).toHaveBeenCalledWith(150);
    await expectNoAxeViolations();
  });

  it('NumberInput steps with arrows, clamps, Home/End, and commits typed values', async () => {
    const onValueChange = vi.fn();
    render(<Field label="Respondents"><NumberInput min={10} max={20} step={5} defaultValue={10} onValueChange={onValueChange} /></Field>);
    const input = screen.getByRole('spinbutton', { name: 'Respondents' });
    input.focus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(input.getAttribute('aria-valuenow')).toBe('20');
    await userEvent.keyboard('{Home}');
    expect(input.getAttribute('aria-valuenow')).toBe('10');
    await userEvent.clear(input);
    await userEvent.type(input, '99{Enter}');
    expect(input.getAttribute('aria-valuenow')).toBe('20');
    await userEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(input.getAttribute('aria-valuenow')).toBe('15');
    await expectNoAxeViolations();
  });

  it('SearchInput clears with the button and with Escape', async () => {
    const onClear = vi.fn();
    render(<SearchInput onClear={onClear} />);
    const input = screen.getByRole('searchbox', { name: 'Search' }) as HTMLInputElement;
    await userEvent.type(input, 'finland');
    await expectNoAxeViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
    await userEvent.type(input, 'x{Escape}');
    expect(input.value).toBe('');
    expect(onClear).toHaveBeenCalledTimes(2);
  });
});
