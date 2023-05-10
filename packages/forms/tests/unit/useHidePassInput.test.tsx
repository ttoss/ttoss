import { render, screen, userEvent } from '@ttoss/test-utils';
import { useHidePassInput } from '../../src/useHidePassInput';

const INPUT_LABEL = 'INPUT';

const Component = () => {
  const { handleClick, icon, inputType } = useHidePassInput();
  return (
    <div>
      <button onClick={handleClick}>hide</button>

      <input aria-label={INPUT_LABEL} value={icon} type={inputType} />
    </div>
  );
};

test('should start with correct default values', () => {
  render(<Component />);

  const input = screen.getByLabelText(INPUT_LABEL);

  expect(input).toHaveValue('view-off');
  expect(input).toHaveAttribute('type', 'password');
});

test('should change the values when handleClick function is called', async () => {
  const user = userEvent.setup({ delay: null });
  render(<Component />);

  const button = screen.getByRole('button');

  await user.click(button);

  const input = screen.getByLabelText(INPUT_LABEL);

  expect(input).toHaveValue('view-on');
  expect(input).toHaveAttribute('type', 'text');
});
