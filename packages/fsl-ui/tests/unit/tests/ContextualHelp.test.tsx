/**
 * ContextualHelp — the ⓘ beside a field's label (forms item B4).
 *
 * The composite half: trigger opens a dialog-role popover, Escape dismisses,
 * the surface carries the trigger's name. The field half — the labelRow slot,
 * name isolation, no-wrapper-when-absent — is table-driven in
 * `fieldEnvelope.test.tsx`, because that is a class property of every root.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextualHelp, TextField } from 'src/index';

describe('ContextualHelp — the composite', () => {
  test('opens a dialog-role popover carrying the trigger name', async () => {
    const user = userEvent.setup();

    render(
      <ContextualHelp aria-label="About region">
        Deploys run in this region.
      </ContextualHelp>
    );

    const trigger = screen.getByRole('button', { name: 'About region' });
    expect(trigger).toHaveAttribute('data-scope', 'contextual-help');

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'About region' });
    expect(dialog).toHaveTextContent('Deploys run in this region.');

    // Popover chrome comes from the Overlay identity, not from this composite.
    expect(
      document.querySelector('[data-scope="popover"][data-part="root"]')
    ).not.toBeNull();
  });

  test('Escape dismisses the surface', async () => {
    const user = userEvent.setup();

    render(<ContextualHelp aria-label="About">Copy.</ContextualHelp>);

    await user.click(screen.getByRole('button', { name: 'About' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('the trigger defaults to the quiet posture', () => {
    render(<ContextualHelp aria-label="About">Copy.</ContextualHelp>);

    // Ambient by definition — and F-024's ruled caveat (the quiet rung paints
    // the page surface) is the documented cost, not a bug here.
    expect(screen.getByRole('button', { name: 'About' })).toHaveAttribute(
      'data-evaluation',
      'muted'
    );
  });
});

describe('ContextualHelp — beside a field label', () => {
  const renderField = () => {
    return render(
      <TextField
        label="Region"
        name="region"
        contextualHelp={
          <ContextualHelp aria-label="About region">
            Deploys run in this region.
          </ContextualHelp>
        }
      />
    );
  };

  test('the trigger is a sibling of the label, never inside it', () => {
    renderField();

    const label = document.querySelector<HTMLElement>(
      '[data-scope="text-field"][data-part="label"]'
    );
    const row = document.querySelector<HTMLElement>(
      '[data-scope="text-field"][data-part="labelRow"]'
    );
    const trigger = screen.getByRole('button', { name: 'About region' });

    // Inside the <label> it would be absorbed into the field's accessible
    // NAME (the A2 measurement) and the label's click-to-focus would swallow
    // the trigger's own click.
    expect(row).not.toBeNull();
    expect(label?.contains(trigger)).toBe(false);
    expect(row?.contains(label as HTMLElement)).toBe(true);
    expect(row?.contains(trigger)).toBe(true);
  });

  test('the field name stays the label alone', () => {
    renderField();

    expect(screen.getByRole('textbox', { name: 'Region' })).toBeInTheDocument();
  });

  test('without the prop no labelRow wrapper enters the tree', () => {
    render(<TextField label="Region" name="region" />);

    // Byte-identical DOM for fields that never asked for help — the slot must
    // cost nothing when unused.
    expect(
      document.querySelector('[data-scope="text-field"][data-part="labelRow"]')
    ).toBeNull();
    const label = document.querySelector<HTMLElement>(
      '[data-scope="text-field"][data-part="label"]'
    );
    expect(label?.parentElement).toBe(
      document.querySelector('[data-scope="text-field"][data-part="root"]')
    );
  });
});
