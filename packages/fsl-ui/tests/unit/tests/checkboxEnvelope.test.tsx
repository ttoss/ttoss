/**
 * Checkbox supporting copy — the confirmation-checkbox shape.
 *
 * A required checkbox used to turn invalid and have nowhere to say why (F-033).
 * The parts that fix it must not cost the control its accessible name: React
 * Aria computes that name from the label's content, and the label IS the row, so
 * supporting copy placed there gets absorbed into the name. These assert the
 * name stays the label alone, that the copy is linked as a description instead,
 * and that the message appears only once the field is actually invalid.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, Form, FormSubmit } from 'src/index';

describe('Checkbox supporting copy', () => {
  test('the accessible name stays the label, not label + description', () => {
    render(
      <Checkbox description="You agree to the terms.">Accept terms</Checkbox>
    );

    expect(
      screen.getByRole('checkbox', { name: 'Accept terms' })
    ).toBeInTheDocument();
  });

  test('the description is linked as a description', () => {
    render(
      <Checkbox description="You agree to the terms.">Accept terms</Checkbox>
    );

    const box = screen.getByRole('checkbox', { name: 'Accept terms' });
    const describedBy = box.getAttribute('aria-describedby');

    expect(describedBy).not.toBeNull();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'You agree to the terms.'
    );
  });

  test('the description part carries the checkbox scope', () => {
    render(<Checkbox description="Hint">Accept</Checkbox>);

    expect(
      document.querySelector('[data-scope="checkbox"][data-part="description"]')
    ).toHaveTextContent('Hint');
  });

  test('the message is silent until the field is invalid, then states the rule', async () => {
    const user = userEvent.setup();

    render(
      <Form>
        <Checkbox
          isRequired
          name="terms"
          errorMessage="Confirm you have read the terms."
        >
          Accept terms
        </Checkbox>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );

    expect(screen.queryByText('Confirm you have read the terms.')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByText('Confirm you have read the terms.')
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  test('checking it clears the message and lets the form through', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    render(
      <Form onSubmit={onSubmit}>
        <Checkbox isRequired name="terms" errorMessage="Confirm first.">
          Accept terms
        </Checkbox>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('without supporting copy the row is unchanged', () => {
    render(<Checkbox>Accept</Checkbox>);

    const root = document.querySelector(
      '[data-scope="checkbox"][data-part="root"]'
    ) as HTMLElement;

    expect(root.style.display).toBe('inline-flex');
    expect(root.getAttribute('aria-labelledby')).toBeNull();
    expect(
      screen.getByRole('checkbox', { name: 'Accept' })
    ).toBeInTheDocument();
  });
});
