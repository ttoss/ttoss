/**
 * ActionMenu — the overflow menu.
 *
 * The component is a *convention* made enforceable: the overflow glyph, the
 * utility silhouette's icon-only square, a required accessible name, and its own
 * `data-scope`. The suite holds each of those, plus the behaviour that the
 * trigger really does open the composed `Menu`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import { ActionMenu, MenuItem } from 'src/index';

const getTrigger = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="action-menu"][data-part="root"]'
  );
  if (!el) throw new Error('action menu trigger not rendered');
  return el;
};

const renderActionMenu = (
  props: Partial<React.ComponentProps<typeof ActionMenu>> = {}
) => {
  return render(
    <ActionMenu aria-label="More actions" {...props}>
      <MenuItem id="duplicate">Duplicate</MenuItem>
      <MenuItem id="archive">Archive</MenuItem>
    </ActionMenu>
  );
};

describe('ActionMenu — identity', () => {
  test('its root is the trigger, re-scoped away from ActionButton', () => {
    renderActionMenu();
    const trigger = getTrigger();

    // Host CSS and tests can target an overflow trigger without matching every
    // ActionButton on the page — that is what the re-scope buys.
    expect(trigger).toHaveAttribute('data-scope', 'action-menu');
    expect(trigger).toHaveAttribute('data-part', 'root');
    expect(trigger.tagName).toBe('BUTTON');
  });

  test('accepts a caller-supplied scope', () => {
    renderActionMenu({ 'data-scope': 'row-actions' });

    expect(
      document.querySelector('[data-scope="row-actions"][data-part="root"]')
    ).not.toBeNull();
  });

  test('is an ambient operation by default, not a command', () => {
    renderActionMenu();

    expect(getTrigger()).toHaveAttribute('data-evaluation', 'secondary');
  });

  test('honours a quieter emphasis', () => {
    renderActionMenu({ evaluation: 'muted' });

    expect(getTrigger()).toHaveAttribute('data-evaluation', 'muted');
  });
});

describe('ActionMenu — the trigger is the convention', () => {
  test('wears the utility silhouette as an icon-only square', () => {
    renderActionMenu();
    const { style } = getTrigger();

    // Icon-only mirrors the block inset on both axes (the square by arithmetic
    // from ADR-021), and the radius is the control one, not the command pill.
    expect(style.borderRadius).toBe(vars.radii.control);
    expect(style.paddingBlock).toBe(vars.spacing.inset.control.sm);
    expect(style.paddingInline).toBe(vars.spacing.inset.control.sm);
  });

  test('renders the overflow glyph and no visible label', () => {
    renderActionMenu();

    const glyph = document.querySelector(
      '[data-scope="action-menu"][data-part="icon"]'
    );
    expect(glyph).not.toBeNull();
    expect(glyph?.querySelector('iconify-icon')).toHaveAttribute(
      'icon',
      'fsl-ui:action-more'
    );
    expect(
      document.querySelector('[data-scope="action-menu"][data-part="label"]')
    ).toBeNull();
  });

  test('carries the caller-supplied accessible name', () => {
    renderActionMenu();

    // An unnamed icon-only trigger announces as just "button"; the type system
    // requires the name because there is no i18n runtime to default it (ADR-001).
    expect(screen.getByRole('button', { name: 'More actions' })).toBe(
      getTrigger()
    );
  });
});

describe('ActionMenu — behaviour', () => {
  test('opens the composed Menu and reports the chosen action', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    renderActionMenu({ onAction });

    expect(screen.queryByRole('menu')).toBeNull();

    await user.click(getTrigger());
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    // React Aria passes the item key first and may add arguments after it —
    // assert the key, not the arity.
    expect(onAction.mock.calls[0]?.[0]).toBe('duplicate');
  });

  test('can start open, and reports open-state changes', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderActionMenu({ defaultOpen: true, onOpenChange });

    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('[Escape]');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('a disabled trigger opens nothing', async () => {
    const user = userEvent.setup();
    renderActionMenu({ isDisabled: true });

    expect(getTrigger()).toBeDisabled();
    await user.click(getTrigger());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('forwards disabled keys to the menu', async () => {
    const user = userEvent.setup();
    renderActionMenu({ disabledKeys: ['archive'] });

    await user.click(getTrigger());

    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('menu rows show no fill until hovered', async () => {
    const user = userEvent.setup();
    renderActionMenu();

    await user.click(getTrigger());
    const row = screen.getByRole('menuitem', { name: 'Duplicate' });

    // The quiet rung, whose resting background resolves to the popover's own
    // colour in both modes. It defaulted to `primary` until this slice, which
    // after the P3 retune painted every row as a solid chip — a menu that read
    // as a stack of buttons.
    expect(row).toHaveAttribute('data-evaluation', 'muted');
    expect(row.style.backgroundColor).toBe(
      vars.colors.action.muted?.background?.default
    );
  });

  test('a destructive row tints its ink and stays a peer of its siblings', async () => {
    // F-029, the case the rule was written for. Before this, the only way to
    // mark the row was `evaluation="negative"`, which fills it solid red — a
    // menu where "Delete" reads as the loudest thing on the surface rather than
    // one row among "Duplicate" and "Archive".
    const user = userEvent.setup();
    render(
      <ActionMenu aria-label="More actions">
        <MenuItem id="duplicate">Duplicate</MenuItem>
        <MenuItem id="delete" consequence="destructive">
          Delete
        </MenuItem>
      </ActionMenu>
    );

    await user.click(getTrigger());
    const row = screen.getByRole('menuitem', { name: 'Delete' });

    expect(row).toHaveAttribute('data-evaluation', 'muted');
    expect(row).toHaveAttribute('data-consequence', 'destructive');
    expect(row.style.color).toBe(
      vars.colors.informational.negative.text!.default
    );
    // Same silhouette as its siblings: only the ink differs.
    expect(row.style.backgroundColor).toBe(
      screen.getByRole('menuitem', { name: 'Duplicate' }).style.backgroundColor
    );
  });

  test('a neutral row reads the quiet rung’s own ink', async () => {
    const user = userEvent.setup();
    renderActionMenu();

    await user.click(getTrigger());

    expect(
      screen.getByRole('menuitem', { name: 'Duplicate' }).style.color
    ).toBe(vars.colors.action.muted!.text!.default);
  });

  test('forwards the surface placement, so a row-end trigger can anchor', async () => {
    const user = userEvent.setup();
    renderActionMenu({ placement: 'bottom end' });

    await user.click(getTrigger());

    // The popover is Menu's own root — ActionMenu composes it, it does not
    // re-implement it.
    expect(
      document.querySelector('[data-scope="menu"][data-part="root"]')
    ).not.toBeNull();
  });
});
