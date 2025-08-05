import { render, screen, userEvent, waitFor } from '@ttoss/test-utils';
import { signIn } from 'aws-amplify/auth';
import { AuthSignIn } from 'src/AuthSignIn';

/**
 * mock signIn aws-amplify to return value RESET_PASSWORD
 */
jest.mock('aws-amplify/auth', () => {
  return {
    signIn: jest.fn().mockResolvedValue({
      nextStep: {
        signInStep: 'RESET_PASSWORD',
      },
      isSignedIn: false,
    }),
  };
});

const onSignUp = jest.fn();
const onForgotPassword = jest.fn();

const userForm = {
  username: 'user@example.com',
  password: 'password',
};

test('Should show error notification if the nextStep.signInStep is RESET_PASSWORD', async () => {
  const user = userEvent.setup();

  const setNotifications = jest.fn();

  /**
   * mock onSignIn
   */
  const onSignIn = jest.fn(async ({ email, password }) => {
    const result = await signIn({ username: email, password });
    if (result.nextStep.signInStep === 'RESET_PASSWORD') {
      setNotifications({
        type: 'error',
        message: `For your security, we have updated our system and you need to reset your password in 'forgot your password?' to proceed`,
      });
    }
  });

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

  await user.type(emailInput, userForm.username);
  await user.type(password, userForm.password);

  await user.tab(); // blur password field

  await user.click(buttonSubmit);

  await waitFor(() => {
    expect(onSignIn).toHaveBeenCalledWith({
      email: userForm.username,
      password: userForm.password,
    });
  });

  expect(setNotifications).toHaveBeenCalledWith({
    type: 'error',
    message: `For your security, we have updated our system and you need to reset your password in 'forgot your password?' to proceed`,
  });
});
