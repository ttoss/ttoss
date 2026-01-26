import {
  AuthProvider as AuthProviderCore,
  useAuth,
} from '@ttoss/react-auth-core';
import { signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import * as React from 'react';

import { getAuthData } from './getAuthData';

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
      return getAuthData();
    } catch {
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
