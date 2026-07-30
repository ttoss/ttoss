/**
 * FieldGroup — one label over several controls (forms item G).
 *
 * FORMS.md §3 is the constraint this component encodes: React Aria's field
 * contexts are supplied per field ROOT, so a cluster of fields cannot be a
 * relabelled field — it is a `role="group"` region named by `aria-labelledby`,
 * with each inner control keeping its own name.
 */
import { render, screen } from '@testing-library/react';
import { FieldGroup, Form, Select, SelectItem, TextField } from 'src/index';

const expiry = () => {
  return (
    <FieldGroup label="Expiry" description="As printed on the card.">
      <Select aria-label="Expiry month">
        <SelectItem id="01">01</SelectItem>
      </Select>
      <Select aria-label="Expiry year">
        <SelectItem id="2027">2027</SelectItem>
      </Select>
    </FieldGroup>
  );
};

describe('FieldGroup', () => {
  test('is a group named by its label and described by its description', () => {
    render(expiry());

    const group = screen.getByRole('group', { name: 'Expiry' });
    expect(group).toHaveAccessibleDescription('As printed on the card.');
  });

  test('each inner control keeps its own accessible name', () => {
    render(expiry());

    // The group's label names the cluster; a screen reader still needs each
    // control named individually — the group does not rename its members.
    expect(
      screen.getByRole('button', { name: /Expiry month/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Expiry year/ })
    ).toBeInTheDocument();
  });

  test('the controls share one row equally', () => {
    render(expiry());

    const controls = document.querySelector<HTMLElement>(
      '[data-scope="field-group"][data-part="controls"]'
    );

    // A cluster reads as one field, so its members split the field's width
    // instead of ragging to their content.
    expect(controls?.style.display).toBe('grid');
    expect(controls?.style.gridAutoColumns).toBe('1fr');
  });

  test('inside a side-label Form it becomes a subgrid row like any field', () => {
    render(
      <Form labelPosition="side" aria-label="Payment">
        {expiry()}
      </Form>
    );

    const root = document.querySelector<HTMLElement>(
      '[data-scope="field-group"][data-part="root"]'
    );
    const label = document.querySelector<HTMLElement>(
      '[data-scope="field-group"][data-part="label"]'
    );
    const controls = document.querySelector<HTMLElement>(
      '[data-scope="field-group"][data-part="controls"]'
    );

    expect(root?.style.gridTemplateColumns).toBe('subgrid');
    expect(label?.style.gridColumn).toBe('1');
    expect(controls?.style.gridColumn).toBe('2');
  });

  test('validation stays with the inner fields', () => {
    render(
      <FieldGroup label="Expiry">
        <TextField aria-label="Expiry month" isRequired isInvalid />
        <TextField aria-label="Expiry year" />
      </FieldGroup>
    );

    // The group has no validation state of its own — the platform validates
    // per control, and the invalid member reports itself.
    expect(
      screen.getByRole('textbox', { name: 'Expiry month' })
    ).toHaveAttribute('aria-invalid', 'true');
    expect(
      document.querySelector('[data-scope="field-group"][aria-invalid]')
    ).toBeNull();
  });
});
