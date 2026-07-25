/**
 * Toolbar — the utility cluster of the Action family (`role="toolbar"`).
 *
 * What the suite has to hold: the region and its keyboard model (one tab stop,
 * arrow keys — the behaviour that separates it from `ButtonGroup`), the
 * arrangement it shares with the rest of the family, and the chrome it must
 * *not* paint (ADR-014).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { ActionButton, Button, Toolbar } from 'src/index';

const getRoot = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="toolbar"][data-part="root"]'
  );
  if (!el) throw new Error('toolbar not rendered');
  return el;
};

const renderToolbar = () => {
  return render(
    <Toolbar aria-label="Formatting">
      <Button aria-label="Bold">B</Button>
      <Button aria-label="Italic">I</Button>
    </Toolbar>
  );
};

describe('Toolbar — the region', () => {
  test('renders the toolbar identity and role', () => {
    renderToolbar();

    expect(getRoot()).toHaveAttribute('role', 'toolbar');
    expect(getRoot()).toHaveAttribute('data-scope', 'toolbar');
    expect(getRoot()).toHaveAttribute('data-part', 'root');
  });

  test('takes its accessible name from the caller', () => {
    renderToolbar();

    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBe(getRoot());
  });
});

describe('Toolbar — the keyboard model', () => {
  test('arrow keys move focus between the controls', async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('[ArrowRight]');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await user.keyboard('[ArrowLeft]');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });

  test('every control is still its own tab stop (documented gap, F-028)', async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.tab();
    await user.tab();

    // APG's toolbar pattern asks for a *single* tab stop with arrow keys inside.
    // React Aria's `useToolbar` supplies the arrow keys but does not manage its
    // children's tabindex — it cannot, for arbitrary children — so tabbing still
    // steps through each control. Asserted rather than wished for: the JSDoc must
    // not promise a keyboard model the component does not have.
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
  });
});

describe('Toolbar — the family arrangement', () => {
  test('reads the family gap token', () => {
    renderToolbar();

    expect(getRoot().style.gap).toBe(vars.spacing.gap.inline.sm);
  });

  test('a row aligns on the main axis; a column on the cross axis', () => {
    const { unmount } = render(
      <Toolbar aria-label="t" align="end">
        <Button>x</Button>
      </Toolbar>
    );

    expect(getRoot().style.flexDirection).toBe('row');
    expect(getRoot().style.justifyContent).toBe('flex-end');
    unmount();

    render(
      <Toolbar aria-label="t" orientation="vertical" align="end">
        <Button>x</Button>
      </Toolbar>
    );
    expect(getRoot().style.flexDirection).toBe('column');
    expect(getRoot().style.alignItems).toBe('flex-end');
  });

  test('clustered controls hold their natural width', () => {
    render(
      <Toolbar aria-label="t">
        <ActionButton>Edit</ActionButton>
      </Toolbar>
    );

    const trigger = document.querySelector<HTMLElement>(
      '[data-scope="action-button"][data-part="root"]'
    );
    expect(trigger?.style.flexShrink).toBe('0');
  });
});

describe('Toolbar — paints nothing (ADR-014)', () => {
  test('declares no chrome of its own', () => {
    renderToolbar();
    const { style } = getRoot();

    // Painting an `informational` bar made this component 80px tall around 34px
    // controls — a card wrapping controls, which then read as bare text inside
    // it. Chrome is composed with `Surface` when a bar genuinely needs it.
    expect(style.backgroundColor).toBe('');
    expect(style.borderWidth).toBe('');
    expect(style.borderRadius).toBe('');
    expect(style.padding).toBe('');
  });

  test('takes no evaluation, having no colour to evaluate', () => {
    renderToolbar();

    // §2.3 evidence rule — the prop is gone because nothing reads it. A leftover
    // `data-evaluation` would advertise a decision the component cannot make.
    expect(getRoot()).not.toHaveAttribute('data-evaluation');
  });
});
