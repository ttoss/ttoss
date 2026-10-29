import * as awsAmplifyAuth from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { checkAuth, getAuthData } from 'src/index';

jest.mock('aws-amplify/auth', () => {
  return {
    fetchAuthSession: jest.fn(),
    fetchUserAttributes: jest.fn(),
    getCurrentUser: jest.fn(),
  };
});

jest.mock('aws-amplify/auth/cognito', () => {
  return {
    cognitoUserPoolsTokenProvider: {
      authTokenStore: { loadTokens: jest.fn() },
    },
  };
});

const mockUserSub = '35bc053d-23b5-458d-9b36-94614ed0c117';

const mockUser = {
  email: 'test@example.com',
  email_verified: 'true',
  sub: mockUserSub,
};

const mockSignedIn = () => {
  jest.mocked(awsAmplifyAuth.getCurrentUser).mockResolvedValue({
    userId: mockUserSub,
    username: mockUser.email,
  });
  jest.mocked(awsAmplifyAuth.fetchUserAttributes).mockResolvedValue(mockUser);
};

test('getAuthData should include tokens when includeTokens is true', async () => {
  const mockAccessToken = 'mockAccessToken';
  const mockIdToken = 'mockIdToken';

  mockSignedIn();
  (awsAmplifyAuth.fetchAuthSession as jest.Mock).mockResolvedValue({
    tokens: {
      idToken: mockIdToken,
      accessToken: mockAccessToken,
    },
  });
  jest
    .mocked(cognitoUserPoolsTokenProvider.authTokenStore.loadTokens)
    .mockResolvedValue({ refreshToken: 'mockRefreshToken' } as never);

  const authData = await getAuthData({ includeTokens: true });
  expect(authData).toStrictEqual({
    isAuthenticated: true,
    tokens: {
      idToken: mockIdToken,
      accessToken: mockAccessToken,
      refreshToken: 'mockRefreshToken',
    },
    user: {
      email: mockUser.email,
      emailVerified: true,
      id: mockUser.sub,
    },
  });
});

test('getAuthData should read no token when includeTokens is false', async () => {
  mockSignedIn();

  const authData = await getAuthData();

  expect(authData?.tokens).toStrictEqual({
    idToken: '',
    accessToken: '',
    refreshToken: '',
  });
  expect(
    cognitoUserPoolsTokenProvider.authTokenStore.loadTokens
  ).not.toHaveBeenCalled();
});

test('getAuthData should return an empty refresh token when the store has none', async () => {
  mockSignedIn();
  jest.mocked(awsAmplifyAuth.fetchAuthSession).mockResolvedValue({});
  jest
    .mocked(cognitoUserPoolsTokenProvider.authTokenStore.loadTokens)
    .mockResolvedValue(null);

  const authData = await getAuthData({ includeTokens: true });

  expect(authData?.tokens?.refreshToken).toBe('');
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
