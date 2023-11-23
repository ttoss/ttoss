import { Select } from '../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

const OPTIONS = ['orange', 'blue', 'red', 'pink'];

test('allow number as value', () => {
  const options = [
    {
      label: 'Orange',
      value: 0,
    },
    {
      label: 'Blue',
      value: 1,
    },
    {
      label: 'Red',
      value: 2,
    },
    {
      label: 'Pink',
      value: 3,
    },
  ];

  render(
    <Select
      placeholder="My Select"
      value={1}
      onChange={() => {}}
      options={options}
    />
  );

  expect(screen.getByText('Blue')).toBeInTheDocument();
});

test('work as a controlled component', () => {
  const value = 'orange';

  render(
    <Select
      placeholder="My Select"
      value={value}
      onChange={() => {}}
      options={OPTIONS.map((option) => {
        return {
          label: option.toUpperCase(),
          value: option,
        };
      })}
    />
  );

  expect(screen.getByText(value.toUpperCase())).toBeInTheDocument();
});

test('should filter options', async () => {
  const user = userEvent.setup({ delay: null });

  let selectedValue = '';

  render(
    <Select
      isSearchable
      placeholder="My Select"
      onChange={(newValue) => {
        if (typeof newValue === 'string') {
          selectedValue = newValue;
        }
      }}
      options={OPTIONS.map((option) => {
        return {
          label: option.toUpperCase(),
          value: option,
        };
      })}
    />
  );

  const selectElement = screen.getByText('My Select');

  await user.click(selectElement);

  await user.type(selectElement, 'oran');

  expect(screen.getByText('ORANGE')).toBeInTheDocument();
  expect(screen.queryByText('BLUE')).not.toBeInTheDocument();

  const orangeOption = screen.getByText('ORANGE');

  await user.click(orangeOption);

  expect(selectedValue).toEqual('orange');
});

test('should render and select options on Select component with options', async () => {
  const user = userEvent.setup({ delay: null });

  let selectedValue = '';

  render(
    <Select
      placeholder="My Select"
      onChange={(newValue) => {
        if (typeof newValue === 'string') {
          selectedValue = newValue;
        }
      }}
      options={OPTIONS.map((option) => {
        return {
          label: option.toUpperCase(),
          value: option,
        };
      })}
    />
  );

  const selectElement = screen.getByText('My Select');
  expect(selectElement).toBeInTheDocument();

  await user.click(selectElement);

  OPTIONS.forEach((option) => {
    expect(screen.getByText(option.toUpperCase())).toBeInTheDocument();
  });

  const firstOption = screen.getByText(OPTIONS[0].toUpperCase());

  await user.click(firstOption);

  expect(screen.getByText(OPTIONS[0].toUpperCase())).toBeInTheDocument();

  expect(selectedValue).toEqual(OPTIONS[0]);
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
