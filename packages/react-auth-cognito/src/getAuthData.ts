import { type AuthData } from '@ttoss/react-auth-core';
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from 'aws-amplify/auth';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';

export type { AuthData };

/**
 * `fetchAuthSession` never returns the refresh token, so it is read from
 * Amplify's token store, after the session call has refreshed what it had to.
 */
const getTokens = async (): Promise<NonNullable<AuthData['tokens']>> => {
  const session = await fetchAuthSession();
  const stored =
    await cognitoUserPoolsTokenProvider.authTokenStore.loadTokens();

  return {
    idToken: session.tokens?.idToken?.toString() ?? '',
    accessToken: session.tokens?.accessToken?.toString() ?? '',
    refreshToken: stored?.refreshToken ?? '',
  };
};

const NO_TOKENS = { idToken: '', accessToken: '', refreshToken: '' };

export const getAuthData = async ({
  includeTokens,
}: {
  includeTokens?: boolean;
} = {}): Promise<AuthData | null> => {
  const currentUser = await getCurrentUser();

  const [tokens, user] = await Promise.all([
    includeTokens ? getTokens() : Promise.resolve(NO_TOKENS),
    fetchUserAttributes(),
  ]);

  return {
    user: {
      id: currentUser.userId,
      email: user.email ?? '',
      emailVerified: user.email_verified === 'true',
    },
    tokens,
    isAuthenticated: true,
  };
};

export const checkAuth = async (): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    return !!currentUser;
  } catch {
    return false;
  }
};
