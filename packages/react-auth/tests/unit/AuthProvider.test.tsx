import { AuthProvider, useAuth } from '../../src';
import { render, renderHook, screen, waitFor } from '@ttoss/test-utils';

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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      listen: jest.fn().mockReturnValue(() => {}),
    },
  };
});

import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from 'aws-amplify/auth';

const mockUserSub = '35bc053d-23b5-458d-9b36-94614ed0c117';

const mockUser = {
  email: 'arantespp@gmail.com',
  email_verified: 'true',
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
  const { result } = renderHook(() => useAuth(), {
    wrapper: AuthProvider,
  });

  await waitFor(() => {
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({
      id: mockUserSub,
      email: mockUser.email,
      emailVerified: mockUser.email_verified,
    });
    expect(result.current.tokens).toEqual({
      idToken: mockIdToken,
      accessToken: mockAccessToken,
      refreshToken: '',
    });
  });
});
