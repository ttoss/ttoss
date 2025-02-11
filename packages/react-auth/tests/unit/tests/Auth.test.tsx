import { render, screen, userEvent } from '@ttoss/test-utils';
import * as amplifyAuth from 'aws-amplify/auth';
import { Auth } from 'src/index';

jest.mock('aws-amplify/auth', () => {
  return {
    signIn: jest.fn().mockResolvedValue({}),
    signUp: jest.fn().mockResolvedValue({}),
    confirmSignUp: jest.fn().mockResolvedValue({}),
    resendSignUpCode: jest.fn().mockResolvedValue({}),
  };
});

const email = 'some@email.com';

const password = 'somepassword';

test('should call Amplify Auth.signIn', async () => {
  const user = userEvent.setup();

  render(<Auth />);

  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.signIn).toHaveBeenCalledWith({
    username: email,
    password,
  });
});

test('should call Amplify Auth.signUp and Auth.confirmSignUp', async () => {
  const user = userEvent.setup();

  render(<Auth />);

  /**
   * Sign In screen
   */

  await user.click(screen.getByLabelText('sign-up'));

  expect(amplifyAuth.signIn).not.toHaveBeenCalled();

  /**
   * Sign Up screen
   */
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm password'), password);

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.signUp).toHaveBeenCalledWith({
    username: email,
    password,
    options: { userAttributes: { email } },
  });

  /**
   * Confirm Sign Up screen
   */
  const confirmationCode = '123456';

  await user.type(screen.getByLabelText('Code'), confirmationCode);

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.confirmSignUp).toHaveBeenCalledWith({
    confirmationCode,
    username: email,
  });
});

test('should render logo', () => {
  const logo = <p>logo</p>;

  render(<Auth logo={logo} />);

  expect(screen.getByText('logo')).toBeInTheDocument();
});

test('should render confirmation code if email not confirmed', async () => {
  const user = userEvent.setup();

  (amplifyAuth.signIn as jest.Mock).mockResolvedValueOnce({
    nextStep: {
      signInStep: 'CONFIRM_SIGN_UP',
    },
  });

  render(<Auth />);

  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.resendSignUpCode).toHaveBeenCalledWith({
    username: email,
  });

  expect(screen.getByLabelText('Code')).toBeInTheDocument();

  const confirmationCode = '111114';

  await user.type(screen.getByLabelText('Code'), confirmationCode);

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.confirmSignUp).toHaveBeenCalledWith({
    confirmationCode,
    username: email,
  });

  expect(screen.queryByLabelText('Code')).not.toBeInTheDocument();

  const signInElements = screen.getAllByText('Sign in');

  expect(signInElements).toHaveLength(2);
});
