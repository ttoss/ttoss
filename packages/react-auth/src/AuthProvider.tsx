import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut as awsSignOut,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import * as React from 'react';

type User = {
  id: string;
  email: string;
  emailVerified: string;
} | null;

type Tokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
} | null;

const signOut = () => {
  return awsSignOut();
};

const AuthContext = React.createContext<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: () => Promise<any>;
  isAuthenticated: boolean;
  user: User;
  tokens: Tokens;
}>({
  signOut,
  isAuthenticated: false,
  user: null,
  tokens: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [{ user, tokens, isAuthenticated }, setAuthState] = React.useState<{
    user: User;
    tokens: Tokens;
    isAuthenticated: boolean | undefined;
  }>({
    user: null,
    tokens: null,
    isAuthenticated: undefined,
  });

  React.useEffect(() => {
    const updateUser = () => {
      getCurrentUser()
        .then(async ({ userId }) => {
          const [session, user] = await Promise.all([
            fetchAuthSession(),
            fetchUserAttributes(),
          ]);

          const idToken = session.tokens?.idToken?.toString() ?? '';
          const accessToken = session.tokens?.accessToken.toString() ?? '';

          setAuthState({
            user: {
              id: userId,
              email: user.email ?? '',
              emailVerified: user.email_verified ?? '',
            },
            tokens: {
              idToken,
              accessToken,
              refreshToken: '',
            },
            isAuthenticated: true,
          });
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          setAuthState({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        });
    };

    const updateUserListener = Hub.listen('auth', updateUser);

    /**
     * Check manually the first time.
     */
    updateUser();

    return () => {
      updateUserListener();
    };
  }, []);

  if (isAuthenticated === undefined) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        signOut,
        isAuthenticated,
        user,
        tokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
