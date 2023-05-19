import { AuthSignUp } from '../../src/AuthSignUp';
import { render, screen, userEvent } from '@ttoss/test-utils';

const onSignUp = jest.fn();

const onReturnToSignIn = jest.fn();

const userForm = {
  email: 'user@example.com',
  password: 'password',
  confirmPassword: 'password',
};

test('Should not call the onSubmit function if click on the Signup button without filling in the fields', async () => {
  const user = userEvent.setup({ delay: null });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  await user.click(screen.getByLabelText('submit-button'));

  expect(onSignUp).toHaveBeenCalledTimes(0);
});

test('Should call the onSubmit function if click on the Signup button with filling in the fields', async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  const emailInput = screen.getByLabelText('Email');
  const password = screen.getByLabelText('Password');
  const confirmPassword = screen.getByLabelText('Confirm password');
  const buttonSubmit = screen.getByLabelText('submit-button');

  await user.type(emailInput, userForm.email);
  await user.type(password, userForm.password);
  await user.type(confirmPassword, userForm.password);
  await user.click(buttonSubmit);

  expect(onSignUp).toHaveBeenCalledWith(userForm);
});
