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
import { Icon, ToggleButton } from 'src/index';

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
    // `secondary` is the default: a toolbar toggle is ambient chrome, not a
    // command (the utility silhouette it shares with `ActionButton`).
    expect(root).toHaveAttribute('data-evaluation', 'secondary');
    expect(root).toHaveAttribute('aria-pressed', 'false');
  });

  test('the engaged state renders the `pressed` color, not `active`', () => {
    // Proof of pressed ≠ active: a persistently-selected toggle uses the
    // pressed token; the transient active token is reserved for pointer-down.
    render(<ToggleButton defaultSelected>Bold</ToggleButton>);
    const root = getRoot();
    expect(root).toHaveAttribute('aria-pressed', 'true');
    expect(root.style.backgroundColor).toBe(
      vars.colors.action.secondary.background?.pressed
    );
    expect(root.style.backgroundColor).not.toBe(
      vars.colors.action.secondary.background?.active
    );
  });

  test('the resting state renders the default color', () => {
    render(<ToggleButton>Bold</ToggleButton>);
    expect(getRoot().style.backgroundColor).toBe(
      vars.colors.action.secondary.background?.default
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

  test('wears the utility silhouette, not the command one', () => {
    render(<ToggleButton>Bold</ToggleButton>);
    const { style } = getRoot();

    // Control radius + label type + tight control inset — a toggle must not
    // read as a CTA (queue item ②).
    expect(style.borderRadius).toBe(vars.radii.control);
    expect(style.paddingBlock).toBe(vars.spacing.inset.control.sm);
    expect(style.paddingInline).toBe(vars.spacing.inset.control.md);
  });

  test('supports the icon-only square, the common toolbar shape', () => {
    render(
      <ToggleButton
        icon={<Icon intent="action.search" />}
        aria-label="Find in page"
      />
    );
    const root = getRoot();

    expect(root).toHaveAttribute('aria-label', 'Find in page');
    expect(root.querySelector('[data-part="label"]')).not.toBeInTheDocument();
    const slot = root.querySelector('[data-part="icon"]') as HTMLElement;
    expect(slot.style.blockSize).toBe('1lh');
    expect(slot.style.inlineSize).toBe('1lh');
    // Square by arithmetic: the block inset is mirrored inline.
    expect(root.style.paddingInline).toBe(vars.spacing.inset.control.sm);
  });
});
