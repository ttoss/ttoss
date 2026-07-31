/**
 * Switch — RTL correctness of the thumb positioning (audit A8), and the
 * validation the `SwitchField` root restored (forms item E, F-033).
 *
 * The thumb must be positioned with the logical `insetInlineStart`
 * property so that under `dir="rtl"` it slides toward the visual left
 * when selected — a physical `left:` would move it the wrong way.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as React from 'react';
import { Form, FormSubmit, Switch } from 'src/index';

const getThumb = (container: HTMLElement): HTMLElement => {
  const thumb = container.querySelector<HTMLElement>(
    '[data-scope="switch"][data-part="indicator"]'
  );
  if (!thumb) throw new Error('thumb not rendered');
  return thumb;
};

describe('Switch — logical thumb positioning', () => {
  test('thumb is placed with insetInlineStart, never with left', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const thumb = getThumb(container);
    expect(thumb.style.insetInlineStart).not.toBe('');
    expect(thumb.style.left).toBe('');
    expect(thumb.style.insetBlockStart).not.toBe('');
    expect(thumb.style.top).toBe('');
  });

  test('selection moves the thumb along the inline axis', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const off = getThumb(container).style.insetInlineStart;
    fireEvent.click(
      container.querySelector('input[role="switch"]') as HTMLElement
    );
    const on = getThumb(container).style.insetInlineStart;
    expect(on).not.toBe(off);
    expect(on).toContain('calc(');
  });

  test('transition animates the logical property (inset-inline-start)', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const thumb = getThumb(container);
    expect(thumb.style.transitionProperty).toContain('inset-inline-start');
    expect(thumb.style.transitionProperty).not.toContain('left');
  });

  test('the handle grows when ON — the reference gesture (10 → 12px)', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const off = getThumb(container).style.width;
    fireEvent.click(
      container.querySelector('input[role="switch"]') as HTMLElement
    );
    const on = getThumb(container).style.width;
    expect(off).toBe('0.625rem');
    expect(on).toBe('0.75rem');
  });
});

/**
 * What the `SwitchField` root restored: plain RAC `Switch` (deprecated
 * upstream) omits `isRequired`/`isInvalid`/`validate` outright, so none of
 * this was expressible before item E. A required switch is a real product
 * shape — an acknowledgement that must be ON before continuing.
 */
describe('Switch — validation through the SwitchField root', () => {
  test('a required switch blocks the submit and reports platform copy', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    render(
      <Form onSubmit={onSubmit}>
        <Switch isRequired name="ack">
          I understand
        </Switch>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onSubmit).not.toHaveBeenCalled();
    // No `errorMessage` supplied, so this is the browser's own localized
    // constraint copy — the always-mounted message part exists to carry it.
    expect(
      document.querySelector(
        '[data-scope="switch"][data-part="validationMessage"]'
      )
    ).toHaveTextContent(/\S/);

    // Turning it ON clears the refusal.
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('a caller-supplied errorMessage replaces the platform copy', async () => {
    const user = userEvent.setup();

    render(
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Switch isRequired name="ack" errorMessage="Confirm before continuing.">
          I understand
        </Switch>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      document.querySelector(
        '[data-scope="switch"][data-part="validationMessage"]'
      )
    ).toHaveTextContent('Confirm before continuing.');
  });

  test('the description is linked to the input via aria-describedby', () => {
    render(<Switch description="Applies to every member.">Enforce 2FA</Switch>);

    const description = document.querySelector<HTMLElement>(
      '[data-scope="switch"][data-part="description"]'
    );
    const input = screen.getByRole('switch');

    expect(description?.id).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toContain(
      description?.id as string
    );
  });

  test('the copy does not leak into the accessible name', () => {
    render(<Switch description="Applies to every member.">Enforce 2FA</Switch>);

    // The A2 trap this structure dodges: on `Checkbox` the root IS a <label>,
    // so copy inside it was absorbed into the name. Here the copy is a sibling
    // of the <label> (`SwitchButton`), so the name stays the label alone.
    expect(
      screen.getByRole('switch', { name: 'Enforce 2FA' })
    ).toBeInTheDocument();
  });

  test('a bare switch renders no supporting-copy wrapper at all', () => {
    const { container } = render(<Switch>Notifications</Switch>);

    // Gated rather than always mounted: an empty wrapper would still claim
    // the root's flex gap and grow a bare switch's box by it.
    const root = container.querySelector(
      '[data-scope="switch"][data-part="root"]'
    );
    expect(root?.childElementCount).toBe(1);
  });
});
