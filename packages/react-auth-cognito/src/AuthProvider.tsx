import {
  AuthProvider as AuthProviderCore,
  useAuth,
} from '@ttoss/react-auth-core';
import { signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import * as React from 'react';

import { getAuthData } from './getAuthData';

const STALE_SESSION_ERRORS = [
  'NotAuthorizedException',
  'UserNotFoundException',
];

const isStaleSessionError = (error: unknown) => {
  return error instanceof Error && STALE_SESSION_ERRORS.includes(error.name);
};

export const AuthProvider = (props: { children: React.ReactNode }) => {
  const [authListenerCount, setAuthListenerCount] = React.useState(0);

  /**
   * Listen to auth events to update the auth data.
   * This is needed because the Auth module does not provide a way to listen to auth changes.
   * We use a counter to trigger the getAuthData callback when an auth event occurs.
   */
  React.useEffect(() => {
    const listener = () => {
      setAuthListenerCount((count) => {
        return count + 1;
      });
    };

    const stopHubListener = Hub.listen('auth', listener);

    return () => {
      stopHubListener();
    };
  }, []);

  const getAuthDataCallback = React.useCallback(async () => {
    try {
      return await getAuthData();
    } catch (error) {
      if (isStaleSessionError(error)) {
        // Amplify still holds tokens Cognito rejects (revoked, or missing a
        // scope `GetUser` needs). Left in place, the app reads as signed out
        // while every new sign-in fails with UserAlreadyAuthenticatedException.
        await signOut().catch(() => {});
      }
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authListenerCount]);

  return (
    <AuthProviderCore getAuthData={getAuthDataCallback} signOut={signOut}>
      {props.children}
    </AuthProviderCore>
  );
};

export { useAuth };
