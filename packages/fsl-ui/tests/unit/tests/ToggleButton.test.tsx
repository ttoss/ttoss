/**
 * ToggleButton — the proof case for `pressed` ≠ `active` (ROADMAP B2).
 *
 * Verifies the persistent toggle-on state renders the Action `pressed` color
 * (not `active`, which is the transient pointer-down), that toggling works by
 * pointer and keyboard, and that React Aria exposes the state via
 * `aria-pressed`.
 */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { ToggleButton } from 'src/index';

const getRoot = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="toggle-button"][data-part="root"]'
  );
  if (!el) throw new Error('toggle button not rendered');
  return el;
};

describe('ToggleButton', () => {
  test('exposes identity attributes and aria-pressed', () => {
    render(<ToggleButton>Bold</ToggleButton>);
    const root = getRoot();
    expect(root).toHaveAttribute('data-evaluation', 'primary');
    expect(root).toHaveAttribute('aria-pressed', 'false');
  });

  test('the engaged state renders the `pressed` color, not `active`', () => {
    // Proof of pressed ≠ active: a persistently-selected toggle uses the
    // pressed token; the transient active token is reserved for pointer-down.
    render(<ToggleButton defaultSelected>Bold</ToggleButton>);
    const root = getRoot();
    expect(root).toHaveAttribute('aria-pressed', 'true');
    expect(root.style.backgroundColor).toBe(
      vars.colors.action.primary.background?.pressed
    );
    expect(root.style.backgroundColor).not.toBe(
      vars.colors.action.primary.background?.active
    );
  });

  test('the resting state renders the default color', () => {
    render(<ToggleButton>Bold</ToggleButton>);
    expect(getRoot().style.backgroundColor).toBe(
      vars.colors.action.primary.background?.default
    );
  });

  test('toggles on pointer click', async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);
    const root = getRoot();
    await user.click(root);
    expect(root).toHaveAttribute('aria-pressed', 'true');
    await user.click(root);
    expect(root).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles on keyboard (Space) when focused', async () => {
    const user = userEvent.setup();
    render(<ToggleButton>Bold</ToggleButton>);
    await user.tab();
    expect(getRoot()).toHaveFocus();
    await user.keyboard('[Space]');
    expect(getRoot()).toHaveAttribute('aria-pressed', 'true');
  });

  test('accepts the muted evaluation', () => {
    render(<ToggleButton evaluation="muted">x</ToggleButton>);
    expect(getRoot()).toHaveAttribute('data-evaluation', 'muted');
  });
});
