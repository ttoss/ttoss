import {
  Auth as AuthCore,
  type AuthProps,
  type AuthScreen,
  type OnConfirmSignUpCheckEmail,
  type OnForgotPassword,
  type OnForgotPasswordResetPassword,
  type OnSignIn,
  type OnSignUp,
  type OnSocialSignIn,
  useAuthScreen,
} from '@ttoss/react-auth-core';
import { useNotifications } from '@ttoss/react-notifications';
import * as React from 'react';

import { useAuth } from './AuthProvider';
import { storage } from './storage';
import type { AuthData } from './types';

export type { AuthScreen };

const GENERIC_ERROR_MESSAGE =
  'Unable to connect to the server. Please check your connection.';

type NotifyError = (params: { title: string; message?: string }) => void;

const signInWithEmail = async ({
  apiUrl,
  email,
  password,
  notifyError,
  onUnconfirmedEmail,
}: {
  apiUrl: string;
  email: string;
  password: string;
  notifyError: NotifyError;
  onUnconfirmedEmail: () => Promise<void>;
}): Promise<AuthData | undefined> => {
  const response = await fetch(`${apiUrl}/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.error?.message === 'Your account email is not confirmed') {
      await onUnconfirmedEmail();
      return undefined;
    }

    notifyError({
      title: 'Sign in failed',
      message: data.error?.message || 'An error occurred during sign in.',
    });
    return undefined;
  }

  storage.setRefreshToken(data.refreshToken);

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      emailVerified: data.user.confirmed,
    },
    tokens: {
      accessToken: data.jwt,
      refreshToken: data.refreshToken,
    },
    isAuthenticated: true,
  };
};

const resendEmailConfirmation = async ({
  apiUrl,
  email,
  notifyError,
}: {
  apiUrl: string;
  email: string;
  notifyError: NotifyError;
}): Promise<boolean> => {
  const response = await fetch(`${apiUrl}/auth/send-email-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await response.json();
    notifyError({
      title: 'Resend confirmation email failed',
      message:
        data.error?.message ||
        'An error occurred while resending the confirmation email.',
    });
    return false;
  }

  return true;
};

const registerWithEmail = async ({
  apiUrl,
  email,
  password,
  notifyError,
}: {
  apiUrl: string;
  email: string;
  password: string;
  notifyError: NotifyError;
}): Promise<boolean> => {
  const response = await fetch(`${apiUrl}/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, email, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    notifyError({
      title: 'Sign up failed',
      message: data.error?.message || 'An error occurred during sign up.',
    });
    return false;
  }

  return true;
};

const requestPasswordReset = async ({
  apiUrl,
  email,
  notifyError,
}: {
  apiUrl: string;
  email: string;
  notifyError: NotifyError;
}): Promise<boolean> => {
  const response = await fetch(`${apiUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = await response.json();
    notifyError({
      title: 'Forgot password failed',
      message:
        data.error?.message || 'An error occurred during forgot password.',
    });
    return false;
  }

  return true;
};

const resetPasswordWithCode = async ({
  apiUrl,
  code,
  newPassword,
  notifyError,
}: {
  apiUrl: string;
  code?: string;
  newPassword: string;
  notifyError: NotifyError;
}): Promise<boolean> => {
  const response = await fetch(`${apiUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      password: newPassword,
      passwordConfirmation: newPassword,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    notifyError({
      title: 'Reset password failed',
      message:
        data.error?.message || 'An error occurred during password reset.',
    });
    return false;
  }

  return true;
};

export const Auth = (
  props: Pick<AuthProps, 'logo' | 'layout' | 'socialProviders'> & {
    initialScreen?: AuthScreen;
  }
) => {
  const { setAuthData, apiUrl } = useAuth();

  const { screen, setScreen } = useAuthScreen(props.initialScreen);

  const { addNotification } = useNotifications();

  const notifyError: NotifyError = React.useCallback(
    ({ title, message }) => {
      addNotification({
        title,
        message: message || GENERIC_ERROR_MESSAGE,
        type: 'error',
      });
    },
    [addNotification]
  );

  const onSignIn: OnSignIn = React.useCallback(
    async ({ email, password }) => {
      try {
        const authData = await signInWithEmail({
          apiUrl,
          email,
          password,
          notifyError,
          onUnconfirmedEmail: async () => {
            const sent = await resendEmailConfirmation({
              apiUrl,
              email,
              notifyError,
            });
            if (sent) {
              setScreen({ value: 'confirmSignUpCheckEmail' });
            }
          },
        });

        if (authData) {
          setAuthData(authData);
        }
      } catch {
        notifyError({ title: 'Network Error' });
      }
    },
    [setAuthData, setScreen, notifyError, apiUrl]
  );

  const onSignUp: OnSignUp = React.useCallback(
    async ({ email, password }) => {
      try {
        const registered = await registerWithEmail({
          apiUrl,
          email,
          password,
          notifyError,
        });

        if (registered) {
          setScreen({ value: 'confirmSignUpCheckEmail' });
        }
      } catch {
        notifyError({ title: 'Network Error' });
      }
    },
    [setScreen, notifyError, apiUrl]
  );

  const onForgotPassword: OnForgotPassword = React.useCallback(
    async ({ email }) => {
      try {
        const sent = await requestPasswordReset({ apiUrl, email, notifyError });

        if (sent) {
          setScreen({ value: 'confirmResetPassword', context: { email } });
        }
      } catch {
        notifyError({ title: 'Network Error' });
      }
    },
    [setScreen, notifyError, apiUrl]
  );

  const onForgotPasswordResetPassword: OnForgotPasswordResetPassword =
    React.useCallback(
      async ({ code, newPassword }) => {
        try {
          const reset = await resetPasswordWithCode({
            apiUrl,
            code,
            newPassword,
            notifyError,
          });

          if (reset) {
            addNotification({
              title: 'Password reset successful',
              message: 'You can now sign in with your new password.',
              type: 'success',
            });
            setScreen({ value: 'signIn' });
          }
        } catch {
          notifyError({ title: 'Network Error' });
        }
      },
      [setScreen, notifyError, addNotification, apiUrl]
    );

  const onConfirmSignUpCheckEmail: OnConfirmSignUpCheckEmail =
    React.useCallback(async () => {
      setScreen({ value: 'signIn' });
    }, [setScreen]);

  const onSocialSignIn: OnSocialSignIn = React.useCallback(
    ({ provider }) => {
      /**
       * Kicks off Strapi's Users & Permissions provider flow. Strapi handles
       * the OAuth exchange and redirects back to the frontend's configured
       * redirect URL (e.g. `/connect/google/redirect`), which
       * `AuthSocialSignInCallback` consumes.
       */
      window.location.href = `${apiUrl}/connect/${provider.toLowerCase()}`;
    },
    [apiUrl]
  );

  return (
    <AuthCore
      logo={props.logo}
      layout={props.layout}
      screen={screen}
      setScreen={setScreen}
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
      onForgotPasswordResetPassword={onForgotPasswordResetPassword}
      onConfirmSignUpCheckEmail={onConfirmSignUpCheckEmail}
      socialProviders={props.socialProviders}
      onSocialSignIn={props.socialProviders ? onSocialSignIn : undefined}
    />
  );
};
