import { render, screen, userEvent, waitFor } from '@ttoss/test-utils';
import * as amplifyAuth from 'aws-amplify/auth';
import { Auth, AuthProvider } from 'src/index';

const email = 'some@email.com';
const password = 'somepassword';

jest.setTimeout(20_000);

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
  (amplifyAuth.signIn as jest.Mock).mockResolvedValueOnce({
    nextStep: {
      signInStep: 'DONE',
    },
  });

  const user = userEvent.setup({ delay: null });

  render(
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );

  await screen.findByLabelText('Email');

  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);

  const submitButton = screen.getByRole('button', { name: /Sign in/i });
  await user.click(submitButton);

  expect(amplifyAuth.signIn).toHaveBeenCalledWith({
    username: email,
    password,
  });

  expect(
    screen.getByText('Signed in successfully', { exact: false })
  ).toBeInTheDocument();
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

  await user.click(screen.getByRole('button', { name: /Sign up/i }));

  expect(amplifyAuth.signUp).toHaveBeenCalledWith({
    username: email,
    password,
    options: { userAttributes: { email } },
  });

  expect(screen.getByLabelText('Code')).toBeInTheDocument();

  const confirmationCode = '123456';
  await user.type(screen.getByLabelText('Code'), confirmationCode);
  await user.click(screen.getByRole('button', { name: 'Confirm' }));

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

  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  await waitFor(() => {
    expect(amplifyAuth.resendSignUpCode).toHaveBeenCalledWith({
      username: email,
    });
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  const confirmationCode = '111114';
  await user.type(screen.getByLabelText('Code'), confirmationCode);
  await user.click(screen.getByRole('button', { name: 'Confirm' }));

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

test('should call Amplify Auth.resetPassword when forgot password is triggered', async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <Auth />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  // Click "Forgot password?" link
  await user.click(screen.getByText('Forgot password?'));

  // Should be on forgot password screen
  expect(screen.getByText('Recovering Password')).toBeInTheDocument();
  expect(screen.getByLabelText('Registered Email')).toBeInTheDocument();

  // Enter email and submit
  await user.type(screen.getByLabelText('Registered Email'), email);
  await user.click(screen.getByRole('button', { name: 'Recover Password' }));

  // Should call resetPassword with correct email
  expect(amplifyAuth.resetPassword).toHaveBeenCalledWith({
    username: email,
  });

  await waitFor(() => {
    expect(screen.getByLabelText('Confirmation code')).toBeInTheDocument();
  });

  const code = '678901';
  await user.type(screen.getByLabelText('Confirmation code'), code);
  await user.type(screen.getByLabelText('New Password'), password);
  await user.click(screen.getByRole('button', { name: 'Reset Password' }));

  expect(amplifyAuth.confirmResetPassword).toHaveBeenCalledWith({
    confirmationCode: code,
    newPassword: password,
    username: email,
  });
});
