import { renderHook, waitFor } from '@ttoss/test-utils/react';
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';
import { AuthProvider, useAuth } from 'src/index';

jest.mock('aws-amplify/auth', () => {
  return {
    signOut: jest.fn(),
    fetchAuthSession: jest.fn(),
    fetchUserAttributes: jest.fn(),
    getCurrentUser: jest.fn(),
  };
});

jest.mock('aws-amplify/utils', () => {
  return {
    Hub: {
      listen: jest.fn().mockReturnValue(() => {}),
    },
  };
});

const mockUserSub = '35bc053d-23b5-458d-9b36-94614ed0c117';

const mockUser = {
  email: 'arantespp@gmail.com',
  email_verified: false,
  sub: mockUserSub,
};

const mockAccessToken = 'mockAccessToken';

const mockIdToken = 'mockIdToken';

beforeAll(() => {
  (fetchAuthSession as jest.Mock).mockResolvedValue({
    tokens: {
      accessToken: {
        toString: jest.fn().mockReturnValue(mockAccessToken),
      },
      idToken: {
        toString: jest.fn().mockReturnValue(mockIdToken),
      },
    },
    userSub: mockUserSub,
  });

  (fetchUserAttributes as jest.Mock).mockResolvedValue(mockUser);

  (getCurrentUser as jest.Mock).mockResolvedValue({
    userId: mockUserSub,
    username: mockUserSub,
  });
});

test('useAuth should return the correct values', async () => {
  const { result } = renderHook(
    () => {
      return useAuth();
    },
    {
      wrapper: AuthProvider,
    }
  );

  await waitFor(() => {
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: mockUserSub,
      email: mockUser.email,
      emailVerified: mockUser.email_verified,
    });
    expect(result.current.tokens).toEqual({
      idToken: '',
      accessToken: '',
      refreshToken: '',
    });
  });
});

describe('a session Cognito no longer accepts', () => {
  const rejectUserAttributes = (name: string) => {
    const error = new Error('rejected');
    error.name = name;
    jest.mocked(fetchUserAttributes).mockRejectedValue(error);
  };

  afterEach(() => {
    jest.mocked(fetchUserAttributes).mockResolvedValue(mockUser as never);
    jest.mocked(signOut).mockClear();
  });

  test.each(['NotAuthorizedException', 'UserNotFoundException'])(
    'is signed out when Cognito answers %s',
    async (name) => {
      rejectUserAttributes(name);

      const { result } = renderHook(useAuth, { wrapper: AuthProvider });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
      expect(signOut).toHaveBeenCalled();
    }
  );

  test('still reads as signed out when clearing it fails', async () => {
    rejectUserAttributes('NotAuthorizedException');
    jest.mocked(signOut).mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(useAuth, { wrapper: AuthProvider });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  test('is kept when the failure is not a rejection of the session', async () => {
    rejectUserAttributes('NetworkError');

    const { result } = renderHook(useAuth, { wrapper: AuthProvider });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe('onError', () => {
  afterEach(() => {
    jest.mocked(fetchUserAttributes).mockResolvedValue(mockUser as never);
  });

  test('receives the error when loading the session fails', async () => {
    const error = new Error('network down');
    error.name = 'NetworkError';
    jest.mocked(fetchUserAttributes).mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHook(useAuth, {
      wrapper: ({ children }) => {
        return <AuthProvider onError={onError}>{children}</AuthProvider>;
      },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(error);
    });
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('is not called when nobody is signed in', async () => {
    const signedOut = new Error('User needs to be authenticated');
    signedOut.name = 'UserUnAuthenticatedException';
    jest.mocked(getCurrentUser).mockRejectedValueOnce(signedOut);
    const onError = jest.fn();

    const { result } = renderHook(useAuth, {
      wrapper: ({ children }) => {
        return <AuthProvider onError={onError}>{children}</AuthProvider>;
      },
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(getCurrentUser).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  test('is not called when the session loads', async () => {
    const onError = jest.fn();

    const { result } = renderHook(useAuth, {
      wrapper: ({ children }) => {
        return <AuthProvider onError={onError}>{children}</AuthProvider>;
      },
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(onError).not.toHaveBeenCalled();
  });
});
