import { AuthSignUp } from 'src/AuthSignUp';
import { jest } from '@jest/globals';
import { render, screen, userEvent } from '@ttoss/test-utils';

const onSignUp = jest.fn();

const onReturnToSignIn = jest.fn();

const userForm = {
  email: 'user@example.com',
  password: 'password',
  confirmPassword: 'password',
};

test('Should render the correct error message for password requirement', async () => {
  const user = userEvent.setup({ delay: null });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  const password = screen.getByLabelText('Password');
  const buttonSubmit = screen.getByLabelText('submit-button');

  await user.type(password, 'pass');
  await user.click(buttonSubmit);

  expect(
    screen.getByText('Password requires 8 characters')
  ).toBeInTheDocument();
});

test('Should not call the onSubmit function if click on the Signup button without filling in the fields', async () => {
  const user = userEvent.setup({ delay: null });

  render(<AuthSignUp {...{ onSignUp, onReturnToSignIn }} />);

  await user.click(screen.getByLabelText('submit-button'));

  expect(onSignUp).toHaveBeenCalledTimes(0);
});

test('Should call the onSubmit function if click on the Signup button with the fields filled', async () => {
  const user = userEvent.setup({ advanceTimers: jest.runAllTimersAsync });

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
