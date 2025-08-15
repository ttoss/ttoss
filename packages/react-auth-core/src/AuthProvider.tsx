import * as React from 'react';

import type { AuthContextValue, AuthScreen, AuthState } from './types';

const AuthContext = React.createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: React.ReactNode;
  initialScreen?: AuthScreen;
  signOut?: () => Promise<void>;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: undefined,
  });

  const signOut = React.useCallback(async () => {
    await props.signOut?.();
    setAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
    });
  }, [props]);

  // if (authState.isAuthenticated === undefined) {
  //   return null; // Loading state
  // }

  return (
    <AuthContext.Provider
      value={{
        signOut,
        isAuthenticated: authState.isAuthenticated ?? false,
        user: authState.user,
        tokens: authState.tokens,
        setAuthState,
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
