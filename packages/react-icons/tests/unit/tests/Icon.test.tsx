import { render, screen } from '@ttoss/test-utils/react';
import { Icon } from 'src/index';

test('should render iconify-icon', () => {
  render(
    <p>
      <Icon icon="ant-design:down-square-filled" />
    </p>
  );

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'ant-design:down-square-filled');
  expect(icon).toHaveAttribute('noobserver');
});

test('should allow overriding noobserver', () => {
  render(<Icon icon="ant-design:down-square-filled" noobserver={false} />);

  expect(screen.getByTestId('iconify-icon')).not.toHaveAttribute('noobserver');
});
