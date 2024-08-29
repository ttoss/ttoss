import { Icon } from 'src/index';
import { render, screen } from '@ttoss/test-utils';

test('should render iconify-icon', () => {
  render(
    <p>
      <Icon icon="ant-design:down-square-filled" />
    </p>
  );

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'ant-design:down-square-filled');
});
