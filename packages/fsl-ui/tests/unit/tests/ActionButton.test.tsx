/**
 * ActionButton — the utility silhouette of the Action entity.
 *
 * The suite is organised the way the Button suite is: identity and labelling,
 * the silhouette contract (which distinguishes it from `Button` — this is the
 * component's whole reason to exist), icon anatomy, and behaviour.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';

import { ActionButton, Button, Icon } from '../../../src';

const getRoot = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="action-button"][data-part="root"]'
  );
  if (!el) throw new Error('action button not rendered');
  return el;
};

describe('ActionButton — identity and labelling', () => {
  test('exposes its identity attributes with the ambient defaults', () => {
    render(<ActionButton>Edit</ActionButton>);
    const root = getRoot();

    expect(root).toHaveAttribute('data-scope', 'action-button');
    expect(root).toHaveAttribute('data-part', 'root');
    // `secondary`, not `primary`: an ambient operation announces itself with a
    // quiet fill, never with the authority of a command.
    expect(root).toHaveAttribute('data-evaluation', 'secondary');
    expect(root).toHaveAttribute('data-consequence', 'neutral');
  });

  test('renders its label inside the label part', () => {
    render(<ActionButton>Edit</ActionButton>);

    const label = screen.getByText('Edit');
    expect(label).toHaveAttribute('data-scope', 'action-button');
    expect(label).toHaveAttribute('data-part', 'label');
  });

  test('icon-only takes its accessible name from aria-label', () => {
    render(
      <ActionButton icon={<Icon intent="action.close" />} aria-label="Remove" />
    );

    const root = screen.getByRole('button', { name: 'Remove' });
    expect(root.querySelector('[data-part="label"]')).not.toBeInTheDocument();
    expect(root.querySelector('[data-part="icon"]')).toBeInTheDocument();
  });

  test('a destructive row action carries its consequence for confirm wrappers', () => {
    render(
      <ActionButton evaluation="negative" consequence="destructive">
        Delete row
      </ActionButton>
    );

    expect(getRoot()).toHaveAttribute('data-consequence', 'destructive');
    expect(getRoot()).toHaveAttribute('data-evaluation', 'negative');
  });
});

describe('ActionButton — the utility silhouette', () => {
  test('wears the control radius, label type and tight control inset', () => {
    render(<ActionButton>Edit</ActionButton>);
    const { style } = getRoot();

    expect(style.borderRadius).toBe(vars.radii.control);
    expect(style.paddingBlock).toBe(vars.spacing.inset.control.sm);
    expect(style.paddingInline).toBe(vars.spacing.inset.control.md);
    expect(style.fontWeight).toBe(String(vars.text.label.md.fontWeight));
  });

  test('differs from Button on exactly the silhouette tokens', () => {
    const { unmount } = render(<ActionButton>Edit</ActionButton>);
    const utility = { ...getRoot().style };
    unmount();

    render(<Button>Save</Button>);
    const command = screen.getByRole('button').style;

    // The pair is a semantic distinction, so the visual difference must be
    // real: radius, block inset and type step all diverge.
    expect(utility.borderRadius).not.toBe(command.borderRadius);
    expect(utility.paddingBlock).not.toBe(command.paddingBlock);
    expect(utility.paddingInline).not.toBe(command.paddingInline);
    expect(utility.fontWeight).not.toBe(command.fontWeight);
  });

  test('keeps the ergonomic hit floor on both axes', () => {
    render(<ActionButton>Edit</ActionButton>);
    const { style } = getRoot();

    expect(style.minHeight).toBe(vars.sizing.hit);
    expect(style.minWidth).toBe(vars.sizing.hit);
  });

  test('icon-only is square by arithmetic: mirrored inset, squared slot', () => {
    render(
      <ActionButton icon={<Icon intent="action.close" />} aria-label="Remove" />
    );
    const root = getRoot();

    expect(root.style.paddingInline).toBe(vars.spacing.inset.control.sm);
    expect(root.style.paddingBlock).toBe(vars.spacing.inset.control.sm);

    const slot = root.querySelector('[data-part="icon"]') as HTMLElement;
    expect(slot.style.blockSize).toBe('1lh');
    expect(slot.style.inlineSize).toBe('1lh');
  });
});

describe('ActionButton — icon anatomy', () => {
  test('leading is the default placement', () => {
    render(
      <ActionButton icon={<Icon intent="action.search" />}>Find</ActionButton>
    );
    const root = getRoot();

    expect(
      [...root.children].map((el) => {
        return el.getAttribute('data-part');
      })
    ).toEqual(['icon', 'label']);
    expect(root).toHaveAttribute('data-icon-placement', 'leading');
  });

  test('trailing placement puts the glyph after the label', () => {
    render(
      <ActionButton
        icon={<Icon intent="disclosure.expand" />}
        iconPlacement="trailing"
      >
        More
      </ActionButton>
    );

    expect(
      [...getRoot().children].map((el) => {
        return el.getAttribute('data-part');
      })
    ).toEqual(['label', 'icon']);
  });

  test('the trigger owns the glyph scale', () => {
    render(
      <ActionButton icon={<Icon intent="action.search" size="lg" />}>
        Find
      </ActionButton>
    );

    const glyph = getRoot().querySelector('[data-scope="icon"]') as HTMLElement;
    expect(glyph.style.fontSize).toBe('var(--tt-sizing-icon-text)');
  });
});

describe('ActionButton — behaviour', () => {
  test('press fires', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    render(<ActionButton onPress={onPress}>Edit</ActionButton>);
    await user.click(getRoot());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled does not fire and shows the disabled cursor', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    render(
      <ActionButton onPress={onPress} isDisabled>
        Edit
      </ActionButton>
    );
    await user.click(getRoot());

    expect(onPress).not.toHaveBeenCalled();
    expect(getRoot().style.cursor).toBe('not-allowed');
  });

  test('is reachable and activatable by keyboard', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    render(<ActionButton onPress={onPress}>Edit</ActionButton>);
    await user.tab();

    expect(getRoot()).toHaveFocus();
    await user.keyboard('[Enter]');
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
