import { Label } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

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
