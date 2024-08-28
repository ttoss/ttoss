import { Input } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';
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
      trailingIcon={alertIcon}
      leadingIcon={alertIcon}
    />
  );

  const [leadingIconEl, trailingIconEl] = screen.getAllByTestId('iconify-icon');

  expect(trailingIconEl).toBeInTheDocument();
  expect(leadingIconEl).toBeInTheDocument();
});

test('should call functions onLeadingIconClick and onTrailingIconClick when the icons are clicked', async () => {
  const user = userEvent.setup({ delay: null });
  const icon = 'ant-design:down-square-filled';
  const onTrailingIconClick = jest.fn();
  const onLeadingIconClick = jest.fn();

  render(
    <Input
      trailingIcon={icon}
      leadingIcon={icon}
      onTrailingIconClick={onTrailingIconClick}
      onLeadingIconClick={onLeadingIconClick}
    />
  );

  const [leadingIconEl, trailingIconEl] = screen.getAllByTestId('iconify-icon');

  await user.click(leadingIconEl);
  expect(onLeadingIconClick).toHaveBeenCalled();

  await user.click(trailingIconEl);
  expect(onTrailingIconClick).toHaveBeenCalled();
});
