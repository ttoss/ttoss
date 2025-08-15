import { render, screen, userEvent } from '@ttoss/test-utils';
import { AuthSignIn } from 'src/AuthSignIn';

const onSignIn = jest.fn();

const onGoToSignUp = jest.fn();

const onGoToForgotPassword = jest.fn();

const userForm = {
  email: 'user@example.com',
  password: 'password',
};

test('Should not call the onSubmit function if click on the login button without filling in the fields', async () => {
  const user = userEvent.setup({ delay: null });

  render(
    <AuthSignIn
      onSignIn={onSignIn}
      onGoToSignUp={onGoToSignUp}
      onGoToForgotPassword={onGoToForgotPassword}
    />
  );

  const [submitButton] = screen.getAllByRole('button');

  await user.click(submitButton);

  await user.tab();

  expect(onSignIn).toHaveBeenCalledTimes(0);
});

test('Should call the onSubmit function if click on the login button with the fields filled', async () => {
  const user = userEvent.setup({ advanceTimers: jest.runAllTimersAsync });

  render(
    <AuthSignIn
      onSignIn={onSignIn}
      onGoToSignUp={onGoToSignUp}
      onGoToForgotPassword={onGoToForgotPassword}
    />
  );

  const emailInput = screen.getByLabelText('Email');
  const password = screen.getByLabelText('Password');
  const [buttonSubmit] = screen.getAllByRole('button');

  await user.type(emailInput, userForm.email);
  await user.type(password, userForm.password);

  await user.tab();

  await user.click(buttonSubmit);

  expect(onSignIn).toHaveBeenCalledWith(userForm);
});
