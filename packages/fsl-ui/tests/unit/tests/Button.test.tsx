import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  test('a labelled button keeps its inline inset; icon-only drops it', () => {
    const { unmount } = render(
      <Button icon={<Icon intent="action.search" />}>Search</Button>
    );

    expect(screen.getByRole('button').style.paddingInline).toBe(
      'var(--tt-spacing-inset-control-lg)'
    );
    unmount();

    render(
      <Button icon={<Icon intent="action.search" />} aria-label="Search" />
    );
    expect(screen.getByRole('button').style.paddingInline).toBe('');
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
