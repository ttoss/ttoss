import { Input } from '../../src';
import { render, screen } from '@ttoss/test-utils';

import alertIcon from '@iconify-icons/mdi-light/alert';

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
      trailingIcon={trailingIconAsString}
      leadingIcon={leadingIconAsString}
    />
  );

  const [trailingIconEl, leadingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toBeInTheDocument();
  expect(leadingIconEl).toBeInTheDocument();
});

test('should render Input component with trailingIcon and leadingIcon as svg icon', () => {
  render(
    <Input
      placeholder="My Input"
      trailingIcon={alertIcon}
      leadingIcon={alertIcon}
    />
  );

  const [trailingIconEl, leadingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toBeInTheDocument();
  expect(leadingIconEl).toBeInTheDocument();
});
