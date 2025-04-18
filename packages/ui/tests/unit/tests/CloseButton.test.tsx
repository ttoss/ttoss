import { render, screen, userEvent } from '@ttoss/test-utils';

import { CloseButton } from '../../../src';

test('should render CloseButton without label', () => {
  render(<CloseButton />);
  expect(screen.getByTestId('iconify-icon')).toBeInTheDocument();
  expect(screen.getByTestId('iconify-icon')).toHaveAttribute('icon', 'close');
});

test('should render CloseButton with label', () => {
  const LABEL = 'Close Modal';
  render(<CloseButton label={LABEL} />);
  expect(screen.getByText(LABEL)).toBeInTheDocument();
});

test('should call onClick function', async () => {
  const LABEL = 'Close Modal';
  const user = userEvent.setup({ delay: null });
  const onClick = jest.fn();

  render(<CloseButton label={LABEL} onClick={onClick} />);

  await user.click(screen.getByText(LABEL));
  expect(onClick).toHaveBeenCalled();
});
