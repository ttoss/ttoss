import { render, screen, userEvent } from '@ttoss/test-utils';

import { Label } from '../../../src';

const LABEL_CONTENT = 'Label text';

const tooltip = 'Tooltip text';

test('should render Label', () => {
  render(<Label>{LABEL_CONTENT}</Label>);

  expect(screen.getByText(LABEL_CONTENT)).toBeInTheDocument();
});

test('should render Label with tooltip icon', () => {
  render(<Label tooltip>{LABEL_CONTENT}</Label>);

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'fluent:info-24-regular');
});

test('should call function onTooltipClick when click on it', async () => {
  const user = userEvent.setup({ delay: null });
  const onTooltipClick = jest.fn();
  render(
    <Label tooltip onTooltipClick={onTooltipClick}>
      {LABEL_CONTENT}
    </Label>
  );

  const icon = screen.getByLabelText('tooltip');

  await user.click(icon);

  expect(onTooltipClick).toHaveBeenCalled();
});

test('should render tooltip when hover on it', async () => {
  const user = userEvent.setup({ delay: null });
  render(<Label tooltip={tooltip}>{LABEL_CONTENT}</Label>);

  const label = screen.getByText(LABEL_CONTENT);

  await user.hover(label);

  expect(screen.getByText(tooltip)).toBeInTheDocument();
});

test('should not render tooltip when hover on it and tooltip is not provided', async () => {
  const user = userEvent.setup({ delay: null });
  render(<Label>{LABEL_CONTENT}</Label>);

  const label = screen.getByText(LABEL_CONTENT);

  await user.hover(label);

  expect(screen.queryByText(tooltip)).not.toBeInTheDocument();
});
