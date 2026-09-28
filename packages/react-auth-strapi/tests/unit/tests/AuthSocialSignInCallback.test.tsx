import { render, waitFor } from '@ttoss/test-utils/react';
import { AuthProvider, useAuth } from 'src/AuthProvider';
import { AuthSocialSignInCallback } from 'src/AuthSocialSignInCallback';

global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockAddNotification = jest.fn();

jest.mock('@ttoss/react-notifications', () => {
  return {
    useNotifications: () => {
      return {
        addNotification: mockAddNotification,
        setLoading: jest.fn(),
      };
    },
  };
});

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

const AuthStateProbe = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="userEmail">{user?.email ?? ''}</span>
    </div>
  );
};

const TestWrapper = ({
  children,
  apiUrl = 'https://api.test.com/api',
}: {
  children: React.ReactNode;
  apiUrl?: string;
}) => {
  return <AuthProvider apiUrl={apiUrl}>{children}</AuthProvider>;
};

describe('AuthSocialSignInCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    window.history.pushState(null, '', '?access_token=google-access-token');
  });

  afterEach(() => {
    window.history.pushState(null, '', '/');
  });

  test('exchanges the callback query string and authenticates the user', async () => {
    const onSuccess = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        return {
          jwt: 'jwt-from-google',
          refreshToken: 'refresh-from-google',
          user: { id: '1', email: 'user@example.com', confirmed: true },
        };
      },
    } as Response);

    render(
      <TestWrapper>
        <AuthSocialSignInCallback provider="google" onSuccess={onSuccess} />
        <AuthStateProbe />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/auth/google/callback?access_token=google-access-token'
      );
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('notifies and calls onError when the callback exchange fails', async () => {
    const onError = jest.fn();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        return { error: { message: 'Invalid token' } };
      },
    } as Response);

    render(
      <TestWrapper>
        <AuthSocialSignInCallback provider="google" onError={onError} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Invalid token');
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sign in failed',
        message: 'Invalid token',
        type: 'error',
      })
    );
  });
});
