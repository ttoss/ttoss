import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';

import { Button, Icon } from '../../../src';

describe('Button — labelling', () => {
  test('renders a visible label inside the label part', () => {
    render(<Button>Save</Button>);

    const label = screen.getByText('Save');
    expect(label).toHaveAttribute('data-scope', 'button');
    expect(label).toHaveAttribute('data-part', 'label');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('icon-only takes its accessible name from aria-label and renders no label part', () => {
    render(
      <Button icon={<Icon intent="action.close" />} aria-label="Dismiss" />
    );

    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button.querySelector('[data-part="label"]')).not.toBeInTheDocument();
    expect(button.querySelector('[data-part="icon"]')).toBeInTheDocument();
  });

  test('aria-label overrides the visible label when both are supplied', () => {
    render(<Button aria-label="Save the current draft">Save</Button>);

    expect(
      screen.getByRole('button', { name: 'Save the current draft' })
    ).toBeInTheDocument();
  });
});

describe('Button — icon anatomy', () => {
  test('no icon prop renders no icon part', () => {
    render(<Button>Plain</Button>);

    expect(
      screen.getByRole('button').querySelector('[data-part="icon"]')
    ).not.toBeInTheDocument();
  });

  test('the icon part is decorative and carries the host scope', () => {
    render(<Button icon={<Icon intent="action.search" />}>Search</Button>);

    const icon = screen
      .getByRole('button')
      .querySelector('[data-part="icon"]') as HTMLElement;

    expect(icon).toHaveAttribute('data-scope', 'button');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    // The glyph itself is the internal Icon component.
    expect(icon.querySelector('[data-scope="icon"]')).toBeInTheDocument();
  });

  test('leading is the default placement — icon precedes the label in DOM order', () => {
    render(<Button icon={<Icon intent="action.search" />}>Search</Button>);

    const button = screen.getByRole('button');
    const parts = [...button.children].map((el) => {
      return el.getAttribute('data-part');
    });

    expect(parts).toEqual(['icon', 'label']);
    expect(button).toHaveAttribute('data-icon-placement', 'leading');
  });

  test('trailing placement puts the icon after the label', () => {
    render(
      <Button
        icon={<Icon intent="disclosure.expand" />}
        iconPlacement="trailing"
      >
        More
      </Button>
    );

    const button = screen.getByRole('button');
    const parts = [...button.children].map((el) => {
      return el.getAttribute('data-part');
    });

    expect(parts).toEqual(['label', 'icon']);
    expect(button).toHaveAttribute('data-icon-placement', 'trailing');
  });

  test('data-icon-placement is absent when there is no icon', () => {
    render(<Button iconPlacement="trailing">No glyph</Button>);

    expect(screen.getByRole('button')).not.toHaveAttribute(
      'data-icon-placement'
    );
  });
});

describe('Button — geometry contract', () => {
  test('every button carries the square hit floor on both axes', () => {
    render(<Button>Save</Button>);

    const { minHeight, minWidth } = screen.getByRole('button').style;

    expect(minHeight).toBe('var(--tt-sizing-hit)');
    expect(minWidth).toBe('var(--tt-sizing-hit)');
  });

  test('block padding comes from the command-specific action inset', () => {
    render(<Button>Save</Button>);

    // `inset.action.block` is bounded 8–9px, so the CTA resolves to 40px on
    // the desktop while a control on the field row stays at the 34px
    // `inset.control` produces (ADR-021 addendum).
    expect(screen.getByRole('button').style.paddingBlock).toBe(
      'var(--tt-spacing-inset-action-block)'
    );
  });

  test('a labelled button breathes wider inline; icon-only mirrors its block inset', () => {
    const { unmount } = render(
      <Button icon={<Icon intent="action.search" />}>Search</Button>
    );

    expect(screen.getByRole('button').style.paddingInline).toBe(
      'var(--tt-spacing-inset-control-lg)'
    );
    unmount();

    // Icon-only pads equally on both axes; paired with a square glyph slot
    // that makes the box square by arithmetic (same padding, same content
    // extent) rather than by an imposed aspect-ratio.
    render(
      <Button icon={<Icon intent="action.search" />} aria-label="Search" />
    );
    expect(screen.getByRole('button').style.paddingInline).toBe(
      'var(--tt-spacing-inset-action-block)'
    );
  });

  test('icon-only squares its glyph slot; a labelled button does not', () => {
    const { unmount } = render(
      <Button icon={<Icon intent="action.close" />} aria-label="Dismiss" />
    );

    const iconOnlySlot = screen
      .getByRole('button')
      .querySelector('[data-part="icon"]') as HTMLElement;

    expect(iconOnlySlot.style.blockSize).toBe('1lh');
    expect(iconOnlySlot.style.inlineSize).toBe('1lh');
    unmount();

    render(<Button icon={<Icon intent="action.close" />}>Dismiss</Button>);
    const labelledSlot = screen
      .getByRole('button')
      .querySelector('[data-part="icon"]') as HTMLElement;

    expect(labelledSlot.style.blockSize).toBe('1lh');
    expect(labelledSlot.style.inlineSize).toBe('');
  });

  test('the glyph-to-label gap only applies when an icon is present', () => {
    const { unmount } = render(
      <Button icon={<Icon intent="action.search" />}>Search</Button>
    );

    expect(screen.getByRole('button').style.gap).toBe(
      'var(--tt-spacing-gap-inline-xs)'
    );
    unmount();

    render(<Button>Search</Button>);
    expect(screen.getByRole('button').style.gap).toBe('');
  });
});

describe('Button — behavior is unchanged by the icon anatomy', () => {
  test('press fires on an icon-only button', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    render(
      <Button
        icon={<Icon intent="action.close" />}
        aria-label="Dismiss"
        onPress={onPress}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('a disabled button with an icon does not fire', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    render(
      <Button
        icon={<Icon intent="action.close" />}
        onPress={onPress}
        isDisabled
      >
        Dismiss
      </Button>
    );
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Button — the quiet destructive posture (CONTRACT §3.3)', () => {
  test('the command silhouette gets the same rule as the utility one', () => {
    // The rule keys on the rung, not on the silhouette: a quiet command
    // (a text-only "Delete account" beside a filled "Cancel") paints no fill
    // either, so the ink is where its valence goes.
    render(
      <Button evaluation="muted" consequence="destructive">
        Delete account
      </Button>
    );
    const root = screen.getByRole('button', { name: 'Delete account' });

    expect(root.style.color).toBe(
      vars.colors.informational.negative.text!.default
    );
    expect(root.style.backgroundColor).toBe(
      vars.colors.action.muted!.background!.default
    );
  });

  test('the default primary command is untouched', () => {
    render(<Button consequence="destructive">Delete account</Button>);

    expect(
      screen.getByRole('button', { name: 'Delete account' }).style.color
    ).toBe(vars.colors.action.primary!.text!.default);
  });
});

describe('Button — glyph optical alignment', () => {
  test('the button forces the text size step on the caller’s icon', () => {
    render(
      <Button icon={<Icon intent="action.search" size="lg" />}>Search</Button>
    );

    // `text` resolves to 1em, so the glyph tracks the label and its ink lands
    // inside the cap-height band (F-022). A caller-supplied step is ignored:
    // the button owns the scale of its own anatomy.
    const glyph = screen
      .getByRole('button')
      .querySelector('[data-scope="icon"]') as HTMLElement;

    expect(glyph.style.fontSize).toBe('var(--tt-sizing-icon-text)');
  });
});
