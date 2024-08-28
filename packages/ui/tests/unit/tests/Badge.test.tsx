import { Badge } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

const LABEL = 'Badge Label';

test('should render Badge correctly without icon', () => {
  render(<Badge>{LABEL}</Badge>);
  expect(screen.queryByTestId('iconify-icon')).not.toBeInTheDocument();
});

test('should render Badge with label', () => {
  render(<Badge>{LABEL}</Badge>);
  expect(screen.getByText(LABEL)).toBeInTheDocument();
});

test('should render an close icon when the Badge is chip', () => {
  render(<Badge chip>{LABEL}</Badge>);
  expect(screen.getByTestId('iconify-icon')).toBeInTheDocument();
  expect(screen.getByTestId('iconify-icon')).toHaveAttribute('icon', 'close');
});

test('should call onDelete function on click close icon', async () => {
  const user = userEvent.setup({ delay: null });
  const onDelete = jest.fn();

  render(
    <Badge chip onDelete={onDelete}>
      {LABEL}
    </Badge>
  );

  await user.click(screen.getByTestId('iconify-icon'));
  expect(onDelete).toHaveBeenCalled();
});
