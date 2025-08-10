import * as React from 'react';

import type { AuthContextValue } from './types';

const AuthContext = React.createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  tokens: null,
  screen: { value: 'signIn', context: {} },
  setScreen: () => {},
  signOut: () => {
    return Promise.resolve();
  },
});

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
