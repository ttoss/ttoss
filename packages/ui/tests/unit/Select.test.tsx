import { Select } from '../../src';
import { render, screen } from '@ttoss/test-utils';

const OPTIONS = ['orange', 'blue', 'red', 'pink'];

test('should render Select component with options', () => {
  render(
    <Select placeholder="My Select">
      {OPTIONS.map((option) => {
        return (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        );
      })}
    </Select>
  );

  const selectElement = screen.getByPlaceholderText('My Select');
  expect(selectElement).toBeInTheDocument();

  const options = screen.getAllByRole('option');

  OPTIONS.forEach((option, idx) => {
    expect(options[idx]).toHaveValue(option);
    expect(options[idx]).toHaveTextContent(option.toUpperCase());
  });
});

test('should render Input component with trailingIcon and leadingIcon', () => {
  const trailingIcon = 'language';
  const leadingIcon = 'email';

  render(
    <Select
      placeholder="My Select"
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
    />
  );

  const [leadingIconEl, trailingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toBeInTheDocument();
  expect(leadingIconEl).toBeInTheDocument();
});

test("should render Select component with trailingIcon 'warning-alt' when it's aria-invalid as true", () => {
  render(<Select placeholder="My Select" aria-invalid="true" />);

  const icons = screen.getAllByTestId('iconify-icon');

  const errorIcon = icons.find((iconEl) => {
    return iconEl.parentElement?.className.includes('error-icon');
  });

  expect(errorIcon).toHaveAttribute('icon', 'warning-alt');
});
