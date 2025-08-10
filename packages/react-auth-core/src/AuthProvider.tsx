import * as React from 'react';

import type {
  AuthContextValue,
  AuthScreen,
  AuthTokens,
  AuthUser,
} from './types';

const AuthContext = React.createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: React.ReactNode;
  initialScreen?: AuthScreen;
  signOut?: () => Promise<void>;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const [authState, setAuthState] = React.useState<{
    user: AuthUser;
    tokens: AuthTokens;
    isAuthenticated: boolean | undefined;
  }>({
    user: null,
    tokens: null,
    isAuthenticated: undefined,
  });

  const [screen, setScreen] = React.useState<AuthScreen>(
    props.initialScreen || { value: 'signIn', context: {} }
  );

  const signOut = React.useCallback(async () => {
    await props.signOut?.();
    setAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
    });
    setScreen({ value: 'signIn', context: {} });
  }, [props]);

  if (authState.isAuthenticated === undefined) {
    return null; // Loading state
  }

  return (
    <AuthContext.Provider
      value={{
        signOut,
        isAuthenticated: authState.isAuthenticated ?? false,
        user: authState.user,
        tokens: authState.tokens,
        screen,
        setScreen,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};
