import * as awsAmplifyAuth from 'aws-amplify/auth';
import { checkAuth, getAuthData } from 'src/index';

jest.mock('aws-amplify/auth', () => {
  return {
    fetchAuthSession: jest.fn(),
    fetchUserAttributes: jest.fn(),
    getCurrentUser: jest.fn(),
  };
});

test('getAuthData should include tokens when includeTokens is true', async () => {
  const mockUserSub = '35bc053d-23b5-458d-9b36-94614ed0c117';

  const mockUser = {
    email: 'test@example.com',
    email_verified: 'true',
    sub: mockUserSub,
  };

  const mockAccessToken = 'mockAccessToken';
  const mockIdToken = 'mockIdToken';

  (awsAmplifyAuth.getCurrentUser as jest.Mock).mockResolvedValue({
    userId: mockUserSub,
  });
  (awsAmplifyAuth.fetchUserAttributes as jest.Mock).mockResolvedValue(mockUser);
  (awsAmplifyAuth.fetchAuthSession as jest.Mock).mockResolvedValue({
    tokens: {
      idToken: mockIdToken,
      accessToken: mockAccessToken,
    },
  });

  const authData = await getAuthData({ includeTokens: true });
  expect(authData).toStrictEqual({
    isAuthenticated: true,
    tokens: {
      idToken: mockIdToken,
      accessToken: mockAccessToken,
      refreshToken: '',
    },
    user: {
      email: mockUser.email,
      emailVerified: true,
      id: mockUser.sub,
    },
  });
});

test('checkAuth should return false when not authenticated', async () => {
  (awsAmplifyAuth.getCurrentUser as jest.Mock).mockRejectedValue(
    new Error('Not authenticated')
  );
  const isAuthenticated = await checkAuth();
  expect(isAuthenticated).toBe(false);
});

test('checkAuth should return true when authenticated', async () => {
  (awsAmplifyAuth.getCurrentUser as jest.Mock).mockResolvedValue({
    userId: '123',
  });
  const isAuthenticated = await checkAuth();
  expect(isAuthenticated).toBe(true);
});
