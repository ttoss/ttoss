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

export type AuthProviderProps = {
  children: React.ReactNode;
  /**
   * Called when loading the stored session fails. The provider still renders
   * the user as signed out, so without this the failure is invisible — pass
   * your error tracker here.
   */
  onError?: (error: unknown) => void;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const [authListenerCount, setAuthListenerCount] = React.useState(0);

  // A ref, so an inline `onError` does not recreate `getAuthDataCallback` on
  // every render and reload the session each time.
  const onErrorRef = React.useRef(props.onError);
  React.useEffect(() => {
    onErrorRef.current = props.onError;
  }, [props.onError]);

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
      onErrorRef.current?.(error);
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
