import { type AuthData } from '@ttoss/react-auth-core';
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from 'aws-amplify/auth';

export type { AuthData };

export const getAuthData = async ({
  includeTokens,
}: {
  includeTokens?: boolean;
} = {}): Promise<AuthData | null> => {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      user: null,
      tokens: null,
      isAuthenticated: false,
    };
  }

  const [session, user] = await Promise.all([
    includeTokens ? fetchAuthSession() : Promise.resolve(null),
    fetchUserAttributes(),
  ]);

  const idToken = session?.tokens?.idToken?.toString() ?? '';
  const accessToken = session?.tokens?.accessToken.toString() ?? '';
  const refreshToken = '';

  return {
    user: {
      id: currentUser.userId,
      email: user.email ?? '',
      emailVerified: user.email_verified === 'true',
    },
    tokens: {
      idToken,
      accessToken,
      refreshToken,
    },
    isAuthenticated: true,
  };
};
