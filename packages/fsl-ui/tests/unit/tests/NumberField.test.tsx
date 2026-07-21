/**
 * NumberField — Input-entity numeric field with increment/decrement steppers.
 *
 * Verifies identity, the stepper buttons adjust the value, min/max clamping,
 * and that the validation message shows when invalid.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberField } from 'src/index';

describe('NumberField', () => {
  test('renders the root identity, label, and the numeric input', () => {
    render(<NumberField label="Quantity" defaultValue={1} />);
    expect(
      document.querySelector('[data-scope="number-field"][data-part="root"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-scope="number-field"][data-part="label"]')
    ).toHaveTextContent('Quantity');
    // RAC renders a text input with aria-roledescription="Number field".
    expect(screen.getByRole('textbox', { name: 'Quantity' })).toHaveValue('1');
  });

  test('the increment stepper raises the value', async () => {
    const user = userEvent.setup();
    render(<NumberField label="Quantity" defaultValue={1} />);
    // The icon-only stepper is named by its Icon label + the field label.
    await user.click(screen.getByRole('button', { name: /increase/i }));
    expect(screen.getByRole('textbox', { name: 'Quantity' })).toHaveValue('2');
  });

  test('respects minValue (decrement disabled at the floor)', () => {
    render(<NumberField label="Quantity" defaultValue={0} minValue={0} />);
    expect(screen.getByRole('button', { name: /decrease/i })).toBeDisabled();
  });

  test('shows the validation message when invalid', () => {
    render(
      <NumberField label="Quantity" isInvalid errorMessage="Enter a number" />
    );
    expect(
      document.querySelector(
        '[data-scope="number-field"][data-part="validationMessage"]'
      )
    ).toHaveTextContent('Enter a number');
  });
});
