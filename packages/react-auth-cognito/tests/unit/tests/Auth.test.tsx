import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
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
    signOut: jest.fn().mockResolvedValue(undefined),
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

describe('onError callback', () => {
  test('should call onError when signIn fails', async () => {
    const onError = jest.fn();
    const testError = new Error('Invalid credentials');
    (amplifyAuth.signIn as jest.Mock).mockRejectedValueOnce(testError);

    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth onError={onError} />
      </AuthProvider>
    );

    await screen.findByLabelText('Email');

    await user.type(screen.getByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Password'), password);

    const submitButton = screen.getByRole('button', { name: /Sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  test('should call onError when signUp fails', async () => {
    const onError = jest.fn();
    const testError = new Error('User already exists');
    (amplifyAuth.signUp as jest.Mock).mockRejectedValueOnce(testError);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth onError={onError} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sign up'));

    await user.type(screen.getByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Password'), password);
    await user.type(screen.getByLabelText('Confirm password'), password);

    await user.click(screen.getByRole('button', { name: /Sign up/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(testError);
      expect(amplifyAuth.signUp).toHaveBeenCalled();
    });
  });

  test('should call onError when confirmSignUp fails', async () => {
    const onError = jest.fn();
    const testError = new Error('Invalid code');

    // Mock signUp to succeed first, then confirmSignUp to fail
    (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
    (amplifyAuth.confirmSignUp as jest.Mock).mockRejectedValueOnce(testError);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <Auth onError={onError} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sign up'));

    await user.type(screen.getByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Password'), password);
    await user.type(screen.getByLabelText('Confirm password'), password);

    await user.click(screen.getByRole('button', { name: /Sign up/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Code')).toBeInTheDocument();
    });

    const confirmationCode = '123456';
    await user.type(screen.getByLabelText('Code'), confirmationCode);
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  test('should call onError when resetPassword fails', async () => {
    const onError = jest.fn();
    const testError = new Error('User not found');
    (amplifyAuth.resetPassword as jest.Mock).mockRejectedValueOnce(testError);

    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth onError={onError} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Forgot password?'));

    await user.type(screen.getByLabelText('Registered Email'), email);
    await user.click(screen.getByRole('button', { name: 'Recover Password' }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  test('should call onError when confirmResetPassword fails', async () => {
    const onError = jest.fn();
    const testError = new Error('Invalid confirmation code');
    (amplifyAuth.confirmResetPassword as jest.Mock).mockRejectedValueOnce(
      testError
    );

    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth onError={onError} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Forgot password?'));

    await user.type(screen.getByLabelText('Registered Email'), email);
    await user.click(screen.getByRole('button', { name: 'Recover Password' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Confirmation code')).toBeInTheDocument();
    });

    const code = '678901';
    await user.type(screen.getByLabelText('Confirmation code'), code);
    await user.type(screen.getByLabelText('New Password'), password);
    await user.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(testError);
    });
  });
});

describe('Cognito exception handling', () => {
  const makeError = (name: string, message: string) => {
    const err = new Error(message);
    err.name = name;
    return err;
  };

  describe('NotAuthorizedException — wrong password', () => {
    test('should show toast and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError(
        'NotAuthorizedException',
        'Incorrect username or password.'
      );
      (amplifyAuth.signIn as jest.Mock).mockRejectedValueOnce(err);

      const user = userEvent.setup({ delay: null });
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await screen.findByLabelText('Email');
      await user.type(screen.getByLabelText('Email'), email);
      await user.type(screen.getByLabelText('Password'), password);
      await user.click(screen.getByRole('button', { name: /Sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Incorrect username or password.', { exact: false })
        ).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('UserNotFoundException — unknown email', () => {
    test('should show toast on signIn and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError('UserNotFoundException', 'User does not exist.');
      (amplifyAuth.signIn as jest.Mock).mockRejectedValueOnce(err);

      const user = userEvent.setup({ delay: null });
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await screen.findByLabelText('Email');
      await user.type(screen.getByLabelText('Email'), email);
      await user.type(screen.getByLabelText('Password'), password);
      await user.click(screen.getByRole('button', { name: /Sign in/i }));

      await waitFor(() => {
        expect(
          screen.getByText('User does not exist.', { exact: false })
        ).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });

    test('should show toast on forgotPassword and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError('UserNotFoundException', 'User does not exist.');
      (amplifyAuth.resetPassword as jest.Mock).mockRejectedValueOnce(err);

      const user = userEvent.setup({ delay: null });
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await screen.findByLabelText('Email');
      await user.click(screen.getByText('Forgot password?'));
      await user.type(screen.getByLabelText('Registered Email'), email);
      await user.click(
        screen.getByRole('button', { name: 'Recover Password' })
      );

      await waitFor(() => {
        expect(
          screen.getByText('User does not exist.', { exact: false })
        ).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('CodeMismatchException — wrong confirmation code', () => {
    test('should call confirmSignUp and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError(
        'CodeMismatchException',
        'Invalid verification code provided, please try again.'
      );
      (amplifyAuth.signUp as jest.Mock).mockResolvedValueOnce({});
      (amplifyAuth.confirmSignUp as jest.Mock).mockRejectedValueOnce(err);

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await waitFor(() => {
        return expect(screen.getByText('Sign up')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Sign up'));
      await user.type(screen.getByLabelText('Email'), email);
      await user.type(screen.getByLabelText('Password'), password);
      await user.type(screen.getByLabelText('Confirm password'), password);
      await user.click(screen.getByRole('button', { name: /Sign up/i }));

      await waitFor(() => {
        return expect(screen.getByLabelText('Code')).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText('Code'), '000000');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(amplifyAuth.confirmSignUp).toHaveBeenCalled();
        // stayed on confirm screen (did not navigate away)
        expect(screen.getByLabelText('Code')).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });

    test('should show toast on confirmResetPassword and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError(
        'CodeMismatchException',
        'Invalid verification code provided, please try again.'
      );
      (amplifyAuth.resetPassword as jest.Mock).mockResolvedValueOnce({});
      (amplifyAuth.confirmResetPassword as jest.Mock).mockRejectedValueOnce(
        err
      );

      const user = userEvent.setup({ delay: null });
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await screen.findByLabelText('Email');
      await user.click(screen.getByText('Forgot password?'));
      await user.type(screen.getByLabelText('Registered Email'), email);
      await user.click(
        screen.getByRole('button', { name: 'Recover Password' })
      );

      await waitFor(() => {
        return expect(
          screen.getByLabelText('Confirmation code')
        ).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText('Confirmation code'), '678901');
      await user.type(screen.getByLabelText('New Password'), password);
      await user.click(screen.getByRole('button', { name: 'Reset Password' }));

      await waitFor(() => {
        expect(
          screen.getByText(
            'Invalid verification code provided, please try again.',
            { exact: false }
          )
        ).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('UsernameExistsException — duplicate sign-up', () => {
    test('should redirect to signIn screen and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError(
        'UsernameExistsException',
        'An account with the given email already exists.'
      );
      (amplifyAuth.signUp as jest.Mock).mockRejectedValueOnce(err);

      const user = userEvent.setup();
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await waitFor(() => {
        return expect(screen.getByText('Sign up')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Sign up'));
      await user.type(screen.getByLabelText('Email'), email);
      await user.type(screen.getByLabelText('Password'), password);
      await user.type(screen.getByLabelText('Confirm password'), password);
      await user.click(screen.getByRole('button', { name: /Sign up/i }));

      await waitFor(() => {
        // Should navigate back to sign-in
        expect(
          screen.getByRole('button', { name: /Sign in/i })
        ).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('UserAlreadyAuthenticatedException — stale session', () => {
    test('should call signOut and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError(
        'UserAlreadyAuthenticatedException',
        'There is already a signed in user.'
      );
      (amplifyAuth.signIn as jest.Mock)
        .mockRejectedValueOnce(err)
        .mockResolvedValueOnce({ nextStep: { signInStep: 'DONE' } });

      const user = userEvent.setup({ delay: null });
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await screen.findByLabelText('Email');
      await user.type(screen.getByLabelText('Email'), email);
      await user.type(screen.getByLabelText('Password'), password);
      await user.click(screen.getByRole('button', { name: /Sign in/i }));

      await waitFor(() => {
        expect(amplifyAuth.signOut).toHaveBeenCalled();
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('InvalidParameterException — unverified account reset', () => {
    test('should show specific guidance message and NOT call onError', async () => {
      const onError = jest.fn();
      const err = makeError(
        'InvalidParameterException',
        'Cannot reset password for the user as there is no registered/verified email or phone_number'
      );
      (amplifyAuth.resetPassword as jest.Mock).mockRejectedValueOnce(err);

      const user = userEvent.setup({ delay: null });
      render(
        <AuthProvider>
          <Auth onError={onError} />
        </AuthProvider>
      );

      await screen.findByLabelText('Email');
      await user.click(screen.getByText('Forgot password?'));
      await user.type(screen.getByLabelText('Registered Email'), email);
      await user.click(
        screen.getByRole('button', { name: 'Recover Password' })
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            /account.*not.*verified|not.*verified.*account|verify.*account|unverified/i
          )
        ).toBeInTheDocument();
      });
      expect(onError).not.toHaveBeenCalled();
    });
  });
});

describe('forgot password code length validation', () => {
  test('should show error when confirmation code has 7 digits', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    // Navigate to forgot password flow
    await user.click(screen.getByText('Forgot password?'));

    await user.type(screen.getByLabelText('Registered Email'), email);
    await user.click(screen.getByRole('button', { name: 'Recover Password' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Confirmation code')).toBeInTheDocument();
    });

    // Enter a 7-digit code (exceeds maxForgotPasswordCodeLength of 6)
    const longCode = '1234567';
    await user.type(screen.getByLabelText('Confirmation code'), longCode);
    await user.type(screen.getByLabelText('New Password'), password);

    // Should show error message for code exceeding max length
    await waitFor(() => {
      expect(screen.getByText('Maximum 6 characters')).toBeInTheDocument();
    });

    // Submit button should be disabled due to validation error
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    expect(submitButton).toBeDisabled();

    // confirmResetPassword should not be called
    expect(amplifyAuth.confirmResetPassword).not.toHaveBeenCalled();
  });

  test('should show error when confirmation code has 5 digits', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    // Navigate to forgot password flow
    await user.click(screen.getByText('Forgot password?'));

    await user.type(screen.getByLabelText('Registered Email'), email);
    await user.click(screen.getByRole('button', { name: 'Recover Password' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Confirmation code')).toBeInTheDocument();
    });

    // Enter a 5-digit code (below expected length of 6)
    const shortCode = '12345';
    await user.type(screen.getByLabelText('Confirmation code'), shortCode);
    await user.type(screen.getByLabelText('New Password'), password);

    // Should show error message for code below min length
    await waitFor(() => {
      expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
    });

    // Submit button should be disabled due to validation error
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    expect(submitButton).toBeDisabled();

    // confirmResetPassword should not be called
    expect(amplifyAuth.confirmResetPassword).not.toHaveBeenCalled();
  });
});
