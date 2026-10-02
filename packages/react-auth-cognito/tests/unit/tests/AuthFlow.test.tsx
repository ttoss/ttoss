import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import * as amplifyAuth from 'aws-amplify/auth';
import { Auth, AuthProvider } from 'src/index';

const email = 'some@email.com';
const password = 'somepassword';

jest.setTimeout(20_000);

jest.mock('aws-amplify/auth', () => {
  return {
    autoSignIn: jest.fn(),
    signIn: jest.fn(),
    signInWithRedirect: jest.fn(),
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
    signOut: jest.fn().mockResolvedValue(undefined),
    confirmResetPassword: jest.fn(),
    resetPassword: jest.fn(),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

const signUpThroughForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.type(screen.getByLabelText('Confirm password'), password);
  await user.click(screen.getByRole('button', { name: /Sign up/i }));
  await waitFor(() => {
    expect(amplifyAuth.signUp).toHaveBeenCalled();
  });
};

const confirmCode = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Code'), '123456');
  await user.click(screen.getByRole('button', { name: 'Confirm' }));
};

describe('initialScreen', () => {
  test('opens on the sign-up form when initialScreen is signUp', async () => {
    render(
      <AuthProvider>
        <Auth initialScreen={{ value: 'signUp' }} />
      </AuthProvider>
    );

    expect(
      await screen.findByLabelText('Confirm password')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sign in' })
    ).not.toBeInTheDocument();
  });

  test('opens on sign-in when initialScreen is omitted', async () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    expect(
      await screen.findByRole('button', { name: /Sign in/i })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Confirm password')).not.toBeInTheDocument();
  });
});

describe('onAuthEvent', () => {
  test('reports the screen the user sees, on mount and on each change', async () => {
    const onAuthEvent = jest.fn();
    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'screenViewed',
        screen: 'signIn',
      });
    });

    await user.click(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'screenViewed',
        screen: 'signUp',
      });
    });
  });

  test('reports a wrong password as a failed sign-in, without the credentials', async () => {
    const onAuthEvent = jest.fn();
    const onError = jest.fn();
    const error = Object.assign(new Error('Incorrect username or password.'), {
      name: 'NotAuthorizedException',
    });
    (amplifyAuth.signIn as jest.Mock).mockRejectedValueOnce(error);
    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth onAuthEvent={onAuthEvent} onError={onError} />
      </AuthProvider>
    );

    await user.type(await screen.findByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Password'), password);
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionFailed',
        action: 'signIn',
        errorName: 'NotAuthorizedException',
      });
    });
    // A user mistake still stays out of onError.
    expect(onError).not.toHaveBeenCalled();
    expect(JSON.stringify(onAuthEvent.mock.calls)).not.toContain(email);
    expect(JSON.stringify(onAuthEvent.mock.calls)).not.toContain(password);
  });

  test('reports a successful sign-in with its next step', async () => {
    const onAuthEvent = jest.fn();
    (amplifyAuth.signIn as jest.Mock).mockResolvedValueOnce({
      nextStep: { signInStep: 'DONE' },
    });
    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await user.type(await screen.findByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Password'), password);
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionSucceeded',
        action: 'signIn',
        nextStep: 'DONE',
      });
    });
  });

  test('reports an existing email as a failed sign-up', async () => {
    const onAuthEvent = jest.fn();
    (amplifyAuth.signUp as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error('exists'), { name: 'UsernameExistsException' })
    );
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth initialScreen={{ value: 'signUp' }} onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await screen.findByLabelText('Confirm password');
    await signUpThroughForm(user);

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionFailed',
        action: 'signUp',
        errorName: 'UsernameExistsException',
      });
    });
  });

  test('reports sign-up, then a wrong code, then the confirmed code', async () => {
    const onAuthEvent = jest.fn();
    (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
    (amplifyAuth.confirmSignUp as jest.Mock)
      .mockRejectedValueOnce(
        Object.assign(new Error('mismatch'), { name: 'CodeMismatchException' })
      )
      .mockResolvedValueOnce({
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' },
      });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth initialScreen={{ value: 'signUp' }} onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await screen.findByLabelText('Confirm password');
    await signUpThroughForm(user);
    await screen.findByLabelText('Code');
    await confirmCode(user);

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionFailed',
        action: 'confirmSignUp',
        errorName: 'CodeMismatchException',
      });
    });

    await user.clear(screen.getByLabelText('Code'));
    await confirmCode(user);

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionSucceeded',
        action: 'confirmSignUp',
        nextStep: 'DONE',
      });
    });
    expect(onAuthEvent).toHaveBeenCalledWith({
      type: 'actionSucceeded',
      action: 'signUp',
    });
    expect(onAuthEvent).toHaveBeenCalledWith({
      type: 'screenViewed',
      screen: 'confirmSignUpWithCode',
    });
  });
});

describe('autoSignInAfterSignUp', () => {
  test('is off by default: sign-up does not ask Amplify to auto sign in', async () => {
    (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth initialScreen={{ value: 'signUp' }} />
      </AuthProvider>
    );

    await screen.findByLabelText('Confirm password');
    await signUpThroughForm(user);

    expect(amplifyAuth.signUp).toHaveBeenCalledWith({
      username: email,
      password,
      options: { userAttributes: { email } },
    });
  });

  test('signs the user in after the code is confirmed', async () => {
    const onAuthEvent = jest.fn();
    (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
    (amplifyAuth.confirmSignUp as jest.Mock).mockResolvedValueOnce({
      isSignUpComplete: true,
      nextStep: { signUpStep: 'COMPLETE_AUTO_SIGN_IN' },
    });
    (amplifyAuth.autoSignIn as jest.Mock).mockResolvedValueOnce({
      isSignedIn: true,
      nextStep: { signInStep: 'DONE' },
    });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth
          initialScreen={{ value: 'signUp' }}
          autoSignInAfterSignUp
          onAuthEvent={onAuthEvent}
        />
      </AuthProvider>
    );

    await screen.findByLabelText('Confirm password');
    await signUpThroughForm(user);

    expect(amplifyAuth.signUp).toHaveBeenCalledWith({
      username: email,
      password,
      options: { userAttributes: { email }, autoSignIn: true },
    });

    await screen.findByLabelText('Code');
    await confirmCode(user);

    await waitFor(() => {
      expect(amplifyAuth.autoSignIn).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText('Signed in successfully', { exact: false })
    ).toBeInTheDocument();
    expect(onAuthEvent).toHaveBeenCalledWith({
      type: 'actionSucceeded',
      action: 'autoSignIn',
      nextStep: 'DONE',
    });
    expect(onAuthEvent).not.toHaveBeenCalledWith({
      type: 'screenViewed',
      screen: 'signIn',
    });
  });

  test('falls back to the sign-in screen when Amplify does not offer auto sign-in', async () => {
    (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
    (amplifyAuth.confirmSignUp as jest.Mock).mockResolvedValueOnce({
      isSignUpComplete: true,
      nextStep: { signUpStep: 'DONE' },
    });
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth initialScreen={{ value: 'signUp' }} autoSignInAfterSignUp />
      </AuthProvider>
    );

    await screen.findByLabelText('Confirm password');
    await signUpThroughForm(user);
    await screen.findByLabelText('Code');
    await confirmCode(user);

    expect(
      await screen.findByRole('button', { name: /Sign in/i })
    ).toBeInTheDocument();
    expect(amplifyAuth.autoSignIn).not.toHaveBeenCalled();
  });

  test('falls back to the sign-in screen and reports the error when auto sign-in fails', async () => {
    const onAuthEvent = jest.fn();
    const onError = jest.fn();
    const error = Object.assign(new Error('boom'), {
      name: 'AutoSignInException',
    });
    (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
    (amplifyAuth.confirmSignUp as jest.Mock).mockResolvedValueOnce({
      isSignUpComplete: true,
      nextStep: { signUpStep: 'COMPLETE_AUTO_SIGN_IN' },
    });
    (amplifyAuth.autoSignIn as jest.Mock).mockRejectedValueOnce(error);
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth
          initialScreen={{ value: 'signUp' }}
          autoSignInAfterSignUp
          onAuthEvent={onAuthEvent}
          onError={onError}
        />
      </AuthProvider>
    );

    await screen.findByLabelText('Confirm password');
    await signUpThroughForm(user);
    await screen.findByLabelText('Code');
    await confirmCode(user);

    expect(
      await screen.findByRole('button', { name: /Sign in/i })
    ).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(error);
    expect(onAuthEvent).toHaveBeenCalledWith({
      type: 'actionFailed',
      action: 'autoSignIn',
      errorName: 'AutoSignInException',
    });
  });
});

describe('onAuthEvent — password recovery and social sign-in', () => {
  test('reports the recovery request and the password reset', async () => {
    const onAuthEvent = jest.fn();
    (amplifyAuth.resetPassword as jest.Mock).mockResolvedValueOnce({});
    (amplifyAuth.confirmResetPassword as jest.Mock).mockResolvedValueOnce(
      undefined
    );
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await screen.findByLabelText('Email');
    await user.click(screen.getByText('Forgot password?'));
    await user.type(screen.getByLabelText('Registered Email'), email);
    await user.click(screen.getByRole('button', { name: 'Recover Password' }));

    await screen.findByLabelText('Confirmation code');
    await user.type(screen.getByLabelText('Confirmation code'), '678901');
    await user.type(screen.getByLabelText('New Password'), password);
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionSucceeded',
        action: 'confirmResetPassword',
      });
    });
    expect(onAuthEvent).toHaveBeenCalledWith({
      type: 'actionSucceeded',
      action: 'forgotPassword',
    });
  });

  test('reports a failed recovery request, naming a nameless error "Error"', async () => {
    const onAuthEvent = jest.fn();
    (amplifyAuth.resetPassword as jest.Mock).mockRejectedValueOnce({});
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await screen.findByLabelText('Email');
    await user.click(screen.getByText('Forgot password?'));
    await user.type(screen.getByLabelText('Registered Email'), email);
    await user.click(screen.getByRole('button', { name: 'Recover Password' }));

    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionFailed',
        action: 'forgotPassword',
        errorName: 'Error',
      });
    });
  });

  test('reports the social redirect starting and failing', async () => {
    const onAuthEvent = jest.fn();
    jest
      .mocked(amplifyAuth.signInWithRedirect)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(
        Object.assign(new Error('nope'), { name: 'OAuthNotConfigureException' })
      );
    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth socialProviders={['Google']} onAuthEvent={onAuthEvent} />
      </AuthProvider>
    );

    await user.click(await screen.findByText('Continue with Google'));
    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionSucceeded',
        action: 'socialSignIn',
      });
    });

    await user.click(screen.getByText('Continue with Google'));
    await waitFor(() => {
      expect(onAuthEvent).toHaveBeenCalledWith({
        type: 'actionFailed',
        action: 'socialSignIn',
        errorName: 'OAuthNotConfigureException',
      });
    });
  });
});
