import { useNotifications } from '@ttoss/react-notifications';
import * as React from 'react';

import type { AuthContextValue, AuthData } from './types';

const AuthContext = React.createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: React.ReactNode;
  getAuthData: () => Promise<AuthData | null>;
  signOut: () => Promise<void>;
};

const UNAUTHENTICATED_USER: AuthData = {
  user: null,
  tokens: null,
  isAuthenticated: false,
};

export const AuthProvider = (props: AuthProviderProps) => {
  const { getAuthData, signOut: signOutProp } = props;

  const { setLoading } = useNotifications();

  const [authData, setAuthData] = React.useState<AuthData>({
    user: null,
    tokens: null,
    isAuthenticated: undefined,
  });

  /**
   * Update the loading state based on authentication status.
   */
  React.useEffect(() => {
    setLoading(authData.isAuthenticated === undefined);
  }, [authData.isAuthenticated, setLoading]);

  /**
   * Fetch the authentication data when the component mounts.
   */
  React.useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const data = await getAuthData?.();
        if (data) {
          setAuthData(data);
        } else {
          setAuthData(UNAUTHENTICATED_USER);
        }
      } catch {
        setAuthData(UNAUTHENTICATED_USER);
      }
    };

    fetchAuthData();
  }, [getAuthData]);

  const signOut = React.useCallback(async () => {
    await signOutProp?.();
    setAuthData(UNAUTHENTICATED_USER);
  }, [signOutProp]);

  if (authData.isAuthenticated === undefined) {
    return null; // Loading state
  }

  return (
    <AuthContext.Provider
      value={{
        signOut,
        isAuthenticated: authData.isAuthenticated ?? false,
        user: authData.user,
        tokens: authData.tokens,
        setAuthData,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
