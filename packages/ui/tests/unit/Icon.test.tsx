import { Icon, Text } from '../../src';
import { render, screen } from '@ttoss/test-utils';

test('should render iconify-icon', () => {
  render(
    <Text>
      <Icon icon="ant-design:down-square-filled" />
    </Text>
  );

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'ant-design:down-square-filled');
});
