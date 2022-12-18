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

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User>(null);

  const [tokens, setTokens] = React.useState<Tokens>(null);

  React.useEffect(() => {
    const updateUser = () => {
      Auth.currentAuthenticatedUser()
        .then(({ attributes, signInUserSession }) => {
          setUser({
            id: attributes.sub,
            email: attributes.email,
            emailVerified: attributes['email_verified'],
          });

          setTokens({
            idToken: signInUserSession.idToken.jwtToken,
            accessToken: signInUserSession.accessToken.jwtToken,
            refreshToken: signInUserSession.refreshToken.token,
          });
        })
        .catch(() => {
          setUser(null);
          setTokens(null);
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

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ signOut, isAuthenticated, user, tokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};

export default AuthProvider;
