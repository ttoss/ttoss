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

type AuthScreen =
  | { value: 'signIn'; context: { email?: string } }
  | { value: 'signUp'; context: Record<string, never> }
  | { value: 'signUpConfirm'; context: { email: string } }
  | { value: 'signUpResendConfirmation'; context: { email: string } }
  | { value: 'forgotPassword'; context: Record<string, never> }
  | { value: 'forgotPasswordResetPassword'; context: { email: string } };

const signOut = () => {
  return awsSignOut();
};

const AuthContext = React.createContext<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: () => Promise<any>;
  isAuthenticated: boolean;
  user: User;
  tokens: Tokens;
  screen: AuthScreen;
  setScreen: React.Dispatch<React.SetStateAction<AuthScreen>>;
}>({
  signOut,
  isAuthenticated: false,
  user: null,
  tokens: null,
  screen: { value: 'signIn', context: {} },
  setScreen: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = React.useState<{
    user: User;
    tokens: Tokens;
    isAuthenticated: boolean | undefined;
  }>({
    user: null,
    tokens: null,
    isAuthenticated: undefined,
  });

  const [screen, setScreen] = React.useState<AuthScreen>({
    value: 'signIn',
    context: {},
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
        .catch(() => {
          setAuthState({
            user: null,
            tokens: null,
            isAuthenticated: false,
          });
        });
    };

    const updateUserListener = Hub.listen('auth', updateUser);
    updateUser();

    return () => {
      updateUserListener();
    };
  }, []);

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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return React.useContext(AuthContext);
};
