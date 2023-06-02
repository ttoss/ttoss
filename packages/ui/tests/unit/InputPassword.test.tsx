import { InputPassword } from '../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

test('should hide password by default if prop showPasswordByDefault is not passed', () => {
  const RenderComponent = () => {
    return (
      <>
        <InputPassword name="password" aria-label="Password" />
        <InputPassword
          name="passwordConfirmation"
          aria-label="Password Confirmation"
          showPasswordByDefault
        />
      </>
    );
  };

  render(<RenderComponent />);

  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  expect(screen.getByLabelText('Password Confirmation')).toHaveAttribute(
    'type',
    'text'
  );
});

test('should change type visibility when click on icon', async () => {
  const user = userEvent.setup({ delay: null });

  const RenderComponent = () => {
    return (
      <>
        <InputPassword name="password" aria-label="Password" />
      </>
    );
  };

  render(<RenderComponent />);

  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

  await user.click(screen.getByTestId('iconify-icon'));

  // expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
});
