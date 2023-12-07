import { AuthSignIn } from '../../src/AuthSignIn';
import { jest } from '@jest/globals';
import { render, screen, userEvent } from '@ttoss/test-utils';

const onSignIn = jest.fn();

const onSignUp = jest.fn();

const onForgotPassword = jest.fn();

const userForm = {
  email: 'user@example.com',
  password: 'password',
};

test('Should not call the onSubmit function if click on the login button without filling in the fields', async () => {
  const user = userEvent.setup({ delay: null });

  render(
    <AuthSignIn
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
    />
  );

  const [submitButton] = screen.getAllByRole('button');

  await user.click(submitButton);

  expect(onSignIn).toHaveBeenCalledTimes(0);
});

test('Should call the onSubmit function if click on the login button with filling in the fields', async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  render(
    <AuthSignIn
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
    />
  );

  const emailInput = screen.getByLabelText('Email');
  const password = screen.getByLabelText('Password');
  const [buttonSubmit] = screen.getAllByRole('button');

  await user.type(emailInput, userForm.email);
  await user.type(password, userForm.password);
  await user.click(buttonSubmit);

  expect(onSignIn).toHaveBeenCalledWith(userForm);
});
