import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Auth, type AuthScreen } from 'src/Auth';
import { AuthProvider } from 'src/AuthProvider';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock storage to avoid refresh token fetch on mount
jest.mock('src/storage', () => {
  return {
    storage: {
      getRefreshToken: jest.fn(() => {
        return null;
      }),
      setRefreshToken: jest.fn(),
      clearRefreshToken: jest.fn(),
    },
  };
});

const TestWrapper = ({
  children,
  apiUrl = 'https://api.test.com/api',
}: {
  children: React.ReactNode;
  apiUrl?: string;
}) => {
  return <AuthProvider apiUrl={apiUrl}>{children}</AuthProvider>;
};

describe('Auth component with initialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  test('should render signIn screen by default when no initialScreen is provided', async () => {
    render(
      <TestWrapper>
        <Auth />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
    });
  });

  test('should render signUp screen when initialScreen is signUp', async () => {
    render(
      <TestWrapper>
        <Auth initialScreen={{ value: 'signUp' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign up' })
      ).toBeInTheDocument();
    });
  });

  test('should render forgotPassword screen when initialScreen is forgotPassword', async () => {
    render(
      <TestWrapper>
        <Auth initialScreen={{ value: 'forgotPassword' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Recovering Password' })
      ).toBeInTheDocument();
    });
  });

  test('should render confirmSignUpCheckEmail screen when initialScreen is confirmSignUpCheckEmail', async () => {
    render(
      <TestWrapper>
        <Auth initialScreen={{ value: 'confirmSignUpCheckEmail' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  test('should navigate between screens when using initialScreen', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TestWrapper>
        <Auth initialScreen={{ value: 'signIn' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    const forgotPasswordLink = screen.getByText('Forgot password?');
    await user.click(forgotPasswordLink);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Recovering Password' })
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
    });
  });

  test('should navigate from signIn to signUp when clicking sign up button', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TestWrapper>
        <Auth initialScreen={{ value: 'signIn' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
    });

    // Get the Sign up button by its role and type
    const signUpButton = screen.getByRole('button', { name: 'Sign up' });
    await user.click(signUpButton);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign up' })
      ).toBeInTheDocument();
    });
  });

  test('should navigate from signUp to signIn when clicking already registered', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TestWrapper>
        <Auth initialScreen={{ value: 'signUp' }} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("I'm already registered")).toBeInTheDocument();
    });

    const signInLink = screen.getByText("I'm already registered");
    await user.click(signInLink);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
    });
  });

  test('should render confirmResetPassword screen when initialScreen includes code context', async () => {
    render(
      <TestWrapper>
        <Auth
          initialScreen={{
            value: 'confirmResetPassword',
            context: { code: 'ABC123' }, // Valid 6-character code
          }}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Reset Password' })
      ).toBeInTheDocument();
    });

    // Verify that the code field is present
    const codeInput = screen.getByLabelText(/confirmation code/i);
    expect(codeInput).toBeInTheDocument();

    // Verify that new password field is also present
    const newPasswordInput = screen.getByLabelText(/new password/i);
    expect(newPasswordInput).toBeInTheDocument();
  });

  test('should handle password reset with code from URL parameters', async () => {
    const user = userEvent.setup({ delay: null });

    // Mock successful password reset
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        return {
          jwt: 'new-jwt-token',
          user: { id: '1', email: 'test@example.com', confirmed: true },
        };
      },
    } as Response);

    render(
      <TestWrapper>
        <Auth
          initialScreen={{
            value: 'confirmResetPassword',
            context: { code: '123456' }, // Valid 6-character code
          }}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Reset Password' })
      ).toBeInTheDocument();
    });

    // Fill in the code (must be 6 characters max based on validation)
    const codeInput = screen.getByLabelText(/confirmation code/i);
    await user.clear(codeInput);
    await user.type(codeInput, '123456');

    // Fill in new password
    const newPasswordInput = screen.getByLabelText(/new password/i);
    await user.type(newPasswordInput, 'NewSecurePass123!');

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /reset password/i,
    });
    await user.click(submitButton);

    // Verify API was called with correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/auth/reset-password',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: '123456',
            password: 'NewSecurePass123!',
            passwordConfirmation: 'NewSecurePass123!',
          }),
        })
      );
    });

    // Should navigate to sign in screen after successful password reset
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in' })
      ).toBeInTheDocument();
    });
  });

  test('should accept initialScreen with confirmResetPassword and code in URL format', async () => {
    // This test simulates the flow where user clicks email link:
    // /auth?initialScreen=confirmResetPassword&code=ABC123
    const urlCode = 'ABC123'; // 6 characters to pass validation
    const initialScreen: AuthScreen = {
      value: 'confirmResetPassword',
      context: { code: urlCode },
    };

    render(
      <TestWrapper>
        <Auth initialScreen={initialScreen} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Reset Password' })
      ).toBeInTheDocument();
    });

    // Verify reset password form is displayed
    expect(screen.getByLabelText(/confirmation code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /reset password/i })
    ).toBeInTheDocument();
  });
});
