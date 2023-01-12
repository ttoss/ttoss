import * as React from 'react';
import { Auth, Hub } from 'aws-amplify';

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
  return Auth.signOut();
};

const AuthContext = React.createContext<{
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
      Auth.currentAuthenticatedUser()
        .then(({ attributes, signInUserSession }) => {
          setAuthState({
            user: {
              id: attributes.sub,
              email: attributes.email,
              emailVerified: attributes['email_verified'],
            },
            tokens: {
              idToken: signInUserSession.idToken.jwtToken,
              accessToken: signInUserSession.accessToken.jwtToken,
              refreshToken: signInUserSession.refreshToken.token,
            },
            isAuthenticated: true,
          });
        })
        .catch(() => {
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
    <AuthContext.Provider value={{ signOut, isAuthenticated, user, tokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
