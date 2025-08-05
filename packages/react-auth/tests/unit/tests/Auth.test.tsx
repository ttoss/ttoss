import { render, screen, userEvent, waitFor } from '@ttoss/test-utils';
import * as amplifyAuth from 'aws-amplify/auth';
import { Auth, AuthProvider } from 'src/index';

const email = 'some@email.com';
const password = 'somepassword';

jest.mock('aws-amplify/auth', () => {
  return {
    signIn: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    resendSignUpCode: jest.fn(),
    fetchAuthSession: jest
      .fn()
      .mockRejectedValue(new Error('Not authenticated')),
    fetchUserAttributes: jest
      .fn()
      .mockRejectedValue(new Error('Not authenticated')),
    getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    signOut: jest.fn(),
    confirmResetPassword: jest.fn(),
    resetPassword: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('should call Amplify Auth.signIn', async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);

  await user.tab(); // blur password field

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.signIn).toHaveBeenCalledWith({
    username: email,
    password,
  });
});

test('should call Amplify Auth.signUp and Auth.confirmSignUp', async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  await user.click(screen.getByText('Sign up'));

  expect(screen.getByLabelText('Email')).toBeInTheDocument();

  expect(amplifyAuth.signIn).not.toHaveBeenCalled();

  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm password'), password);

  await user.tab();

  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.signUp).toHaveBeenCalledWith({
    username: email,
    password,
    options: { userAttributes: { email } },
  });

  expect(screen.getByLabelText('Code')).toBeInTheDocument();

  const confirmationCode = '123456';
  await user.type(screen.getByLabelText('Code'), confirmationCode);
  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.confirmSignUp).toHaveBeenCalledWith({
    confirmationCode,
    username: email,
  });
});

test('should render logo', async () => {
  const logo = <p>logo</p>;

  render(
    <AuthProvider>
      <Auth logo={logo} />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('logo')).toBeInTheDocument();
  });
});

test('should render confirmation code if email not confirmed', async () => {
  const user = userEvent.setup();

  (amplifyAuth.signIn as jest.Mock).mockResolvedValueOnce({
    nextStep: {
      signInStep: 'CONFIRM_SIGN_UP',
    },
  });

  render(
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);

  await user.tab();

  await user.click(screen.getByLabelText('submit-button'));

  await waitFor(() => {
    expect(amplifyAuth.resendSignUpCode).toHaveBeenCalledWith({
      username: email,
    });
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  const confirmationCode = '111114';
  await user.type(screen.getByLabelText('Code'), confirmationCode);
  await user.click(screen.getByLabelText('submit-button'));

  expect(amplifyAuth.confirmSignUp).toHaveBeenCalledWith({
    confirmationCode,
    username: email,
  });

  await waitFor(() => {
    expect(screen.queryByLabelText('Code')).not.toBeInTheDocument();
    const signInElements = screen.getAllByText('Sign in');
    expect(signInElements).toHaveLength(2);
  });
});
