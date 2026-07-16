/**
 * CheckboxGroup — Selection-entity multi-select container over RAC
 * `CheckboxGroup`, hosting `Checkbox` items.
 *
 * Verifies identity, multi-selection, the group label, and that group-level
 * invalid state propagates to the child checkboxes.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, CheckboxGroup } from 'src/index';

const renderGroup = (props?: { isInvalid?: boolean }) => {
  return render(
    <CheckboxGroup
      aria-label="Notifications"
      label="Notifications"
      description="Pick at least one"
      errorMessage="Select one"
      {...props}
    >
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms">SMS</Checkbox>
    </CheckboxGroup>
  );
};

describe('CheckboxGroup', () => {
  test('renders the group identity and label', () => {
    renderGroup();
    expect(
      document.querySelector('[data-scope="checkbox-group"][data-part="root"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-scope="checkbox-group"][data-part="label"]')
    ).toHaveTextContent('Notifications');
  });

  test('multiple checkboxes can be selected independently', async () => {
    const user = userEvent.setup();
    renderGroup();
    const email = screen.getByRole('checkbox', { name: 'Email' });
    const sms = screen.getByRole('checkbox', { name: 'SMS' });

    await user.click(email);
    await user.click(sms);
    expect(email).toBeChecked();
    expect(sms).toBeChecked();
  });

  test('group invalid propagates to the child checkboxes', () => {
    renderGroup({ isInvalid: true });
    // React Aria marks each child checkbox invalid when the group is invalid.
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toHaveAttribute('aria-invalid', 'true');
    }
  });

  test('shows the validation message when invalid', () => {
    renderGroup({ isInvalid: true });
    expect(
      document.querySelector(
        '[data-scope="checkbox-group"][data-part="validationMessage"]'
      )
    ).toHaveTextContent('Select one');
  });
});
