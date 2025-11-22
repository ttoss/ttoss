import alertIcon from '@iconify-icons/mdi-light/alert';
import { render, screen, userEvent } from '@ttoss/test-utils/react';

import { Input } from '../../../src';

test('should render Input component without icon', () => {
  render(<Input placeholder="My Input" />);

  const inputElement = screen.getByPlaceholderText('My Input');

  expect(inputElement).toBeInTheDocument();
});

test('should render Input component with trailingIcon and leadingIcon as string', () => {
  const trailingIconAsString = 'ant-design:down-square-filled';
  const leadingIconAsString = 'ant-design:down-square-filled';

  render(
    <Input
      placeholder="My Input"
      trailingIcon={{ icon: trailingIconAsString }}
      leadingIcon={{ icon: leadingIconAsString }}
    />
  );

  const [leadingIconEl, trailingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toBeInTheDocument();
  expect(leadingIconEl).toBeInTheDocument();
});

test("should render Input component with trailingIcon 'warning-alt' when it's with aria-invalid as true", () => {
  render(<Input placeholder="My Input" aria-invalid="true" />);

  const [trailingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toHaveAttribute('icon', 'warning-alt');
});

test('should render Input component with trailingIcon and leadingIcon as svg icon', () => {
  render(
    <Input
      placeholder="My Input"
      trailingIcon={{ icon: alertIcon }}
      leadingIcon={{ icon: alertIcon }}
    />
  );

  const [leadingIconEl, trailingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toBeInTheDocument();
  expect(leadingIconEl).toBeInTheDocument();
});

test('should call functions onClick when the icons are clicked', async () => {
  const user = userEvent.setup({ delay: null });
  const icon = 'ant-design:down-square-filled';
  const onTrailingIconClick = jest.fn();
  const onLeadingIconClick = jest.fn();

  render(
    <Input
      trailingIcon={{ icon, onClick: onTrailingIconClick }}
      leadingIcon={{ icon, onClick: onLeadingIconClick }}
    />
  );

  const [leadingIconEl, trailingIconEl] = screen.getAllByTestId('iconify-icon');

  await user.click(leadingIconEl);
  expect(onLeadingIconClick).toHaveBeenCalled();

  await user.click(trailingIconEl);
  expect(onTrailingIconClick).toHaveBeenCalled();
});

test('should render tooltips when tooltip prop is provided', () => {
  render(
    <Input
      placeholder="My Input"
      leadingIcon={{
        icon: 'ant-design:search-outlined',
        tooltip: 'Search',
      }}
      trailingIcon={{
        icon: 'ant-design:info-circle-outlined',
        tooltip: 'More information',
      }}
    />
  );

  // Check if tooltip IDs are set on the icon elements
  const icons = screen.getAllByTestId('iconify-icon');
  expect(icons[0].parentElement).toHaveAttribute(
    'data-tooltip-id',
    'input-leading-icon-tooltip'
  );
  expect(icons[1].parentElement).toHaveAttribute(
    'data-tooltip-id',
    'input-trailing-icon-tooltip'
  );
});

test('should not set tooltip-id when tooltip prop is not provided', () => {
  render(
    <Input
      placeholder="My Input"
      leadingIcon={{ icon: 'ant-design:search-outlined' }}
      trailingIcon={{ icon: 'ant-design:info-circle-outlined' }}
    />
  );

  const icons = screen.getAllByTestId('iconify-icon');
  expect(icons[0].parentElement).not.toHaveAttribute('data-tooltip-id');
  expect(icons[1].parentElement).not.toHaveAttribute('data-tooltip-id');
});
