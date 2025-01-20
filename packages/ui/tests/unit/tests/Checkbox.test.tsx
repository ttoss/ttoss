import { fireEvent, render, screen } from '@ttoss/test-utils';

import { Checkbox } from '../../../src';

describe('Checkbox component', () => {
  test('renders checkbox', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  test('handles checked state', () => {
    render(<Checkbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeChecked();
  });

  test('handles indeterminate state', () => {
    render(<Checkbox indeterminate />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);

    fireEvent.click(checkbox);

    expect(checkbox.indeterminate).toBe(false);
  });
});
