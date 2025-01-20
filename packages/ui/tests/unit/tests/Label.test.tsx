import { render, screen, userEvent } from '@ttoss/test-utils';

import { Label } from '../../../src';

const LABEL_CONTENT = 'Label text';

test('should render Label', () => {
  render(<Label>{LABEL_CONTENT}</Label>);

  expect(screen.getByText(LABEL_CONTENT)).toBeInTheDocument();
});

test('should render Label with tooltip icon', () => {
  render(<Label tooltip>{LABEL_CONTENT}</Label>);

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'info');
});

test('should call function onTooltipClick when click on it', async () => {
  const user = userEvent.setup({ delay: null });

  render(<Label tooltip>{LABEL_CONTENT}</Label>);

  const icon = screen.getByLabelText('tooltip');

  await user.click(icon);
});
