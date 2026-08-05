/**
 * Toolbar — the utility cluster of the Action family (`role="toolbar"`).
 *
 * What the suite has to hold: the region and its keyboard model (one tab stop,
 * arrow keys — the behaviour that separates it from `ButtonGroup`), the
 * arrangement it shares with the rest of the family, and the chrome it must
 * *not* paint (ADR-014).
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { ActionButton, Button, Select, SelectItem, Toolbar } from 'src/index';

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

  test('Tab jumps straight to the last focusable descendant, past a host control and a Select (F-028)', () => {
    // APG's toolbar pattern asks for a *single* tab stop with arrow keys inside.
    // `useToolbar` (react-aria's `useToolbar`, private/toolbar/useToolbar.js)
    // implements exactly that: on a Tab keydown it does not manage anyone's
    // `tabindex` — it calls a generic, DOM-walking focus manager
    // (`createFocusManager` → `getFocusableTreeWalker`, which finds tabbable
    // descendants by walking the DOM, not by any child registering itself) to
    // jump focus straight to the toolbar's last tabbable descendant, then lets
    // the keydown's native default action carry Tab onward from there — so a
    // user tabbing from *any* control inside leaves the toolbar in one step,
    // with every control still individually reachable by arrow keys. This
    // requires nothing from the children, cooperative or not: verified here
    // with a plain host `<button>` and an fsl-ui `Select` sitting between the
    // two `Button`s, neither of which is fsl-ui's roving-tabindex mechanism
    // (there isn't one) nor react-aria's own trigger plumbing.
    //
    // `@testing-library/user-event`'s `tab()` cannot exercise this: it computes
    // the Tab destination from the element the keydown was dispatched to
    // (`getTabDestination(target, …)` in its `keydown.js` behaviour), not from
    // `document.activeElement` after the keydown's handlers ran — so it never
    // sees the focus manager's jump, and asserting the *full* round trip (jump,
    // then the browser's own native Tab-out) needs a real engine. Verified in
    // Chromium via Playwright driving Storybook's `KeyboardInvestigation` story:
    // Tab from any control inside a mixed toolbar (an fsl-ui trigger, a plain
    // `<button>`, an fsl-ui `Select`) exits in one step, Shift+Tab exits
    // backward in one step, and arrow keys still walk every control in order.
    // `fireEvent.keyDown` bypasses user-event's simulation and lets this test
    // assert the actual mechanism that ships: the jump itself.
    render(
      <Toolbar aria-label="Formatting">
        <Button aria-label="Bold">B</Button>
        <button type="button">plain host button</button>
        <Select aria-label="Font" defaultSelectedKey="serif">
          <SelectItem id="serif">Serif</SelectItem>
        </Select>
        <Button aria-label="Italic">I</Button>
      </Toolbar>
    );

    screen.getByRole('button', { name: 'Bold' }).focus();
    fireEvent.keyDown(document.activeElement as Element, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();

    fireEvent.keyDown(document.activeElement as Element, {
      key: 'Tab',
      shiftKey: true,
    });
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });

  test('arrow keys still reach a host-supplied control between the fsl-ui ones', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar aria-label="Formatting">
        <Button aria-label="Bold">B</Button>
        <button type="button">plain host button</button>
        <Button aria-label="Italic">I</Button>
      </Toolbar>
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('[ArrowRight]');
    expect(
      screen.getByRole('button', { name: 'plain host button' })
    ).toHaveFocus();
    await user.keyboard('[ArrowRight]');
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
