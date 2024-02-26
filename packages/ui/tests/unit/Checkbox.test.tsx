import { Checkbox } from '../../src';
import { render, screen } from '@ttoss/test-utils';

describe('Checkbox component', () => {
  test('renders checkbox', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  test('handles indeterminate state', () => {
    render(<Checkbox indeterminate />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  test('handles checked state', () => {
    render(<Checkbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeChecked();
  });
});
