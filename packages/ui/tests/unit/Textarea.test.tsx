import { Textarea } from '../../src';
import { render, screen } from '@ttoss/test-utils';

test('should not render trailingIcon in Textarea component', () => {
  render(<Textarea />);

  expect(screen.queryByTestId('iconify-icon')).not.toBeInTheDocument();
});

test('should render trailingIcon in Textarea component', () => {
  render(<Textarea trailingIcon="ant-design:down-square-filled" />);

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'ant-design:down-square-filled');
});
