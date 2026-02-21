import {
  Auth as AuthCore,
  type AuthProps,
  type AuthScreen,
  type OnConfirmSignUpCheckEmail,
  type OnForgotPassword,
  type OnForgotPasswordResetPassword,
  type OnSignIn,
  type OnSignUp,
  useAuthScreen,
} from '@ttoss/react-auth-core';
import { useNotifications } from '@ttoss/react-notifications';
import * as React from 'react';

import { useAuth } from './AuthProvider';
import { storage } from './storage';

export const Auth = (
  props: Pick<AuthProps, 'logo' | 'layout'> & { initialScreen?: AuthScreen }
) => {
  const { setAuthData, apiUrl } = useAuth();

  const { screen, setScreen } = useAuthScreen(props.initialScreen);

  const { addNotification } = useNotifications();

  const onSignIn: OnSignIn = React.useCallback(
    async ({ email, password }) => {
      try {
        const response = await fetch(`${apiUrl}/auth/local`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identifier: email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error?.message;

          if (errorMessage === 'Your account email is not confirmed') {
            const resendResponse = await fetch(
              `${apiUrl}/auth/send-email-confirmation`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
              }
            );

            if (!resendResponse.ok) {
              const resendData = await resendResponse.json();
              addNotification({
                title: 'Resend confirmation email failed',
                message:
                  resendData.error?.message ||
                  'An error occurred while resending the confirmation email.',
                type: 'error',
              });
              return;
            }

            setScreen({ value: 'confirmSignUpCheckEmail' });
            return;
          }

          addNotification({
            title: 'Sign in failed',
            message: data.error?.message || 'An error occurred during sign in.',
            type: 'error',
          });
          return;
        }

        storage.setRefreshToken(data.refreshToken);

        setAuthData({
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
        });
      } catch {
        addNotification({
          title: 'Network Error',
          message:
            'Unable to connect to the server. Please check your connection.',
          type: 'error',
        });
      }
    },
    [setAuthData, setScreen, addNotification, apiUrl]
  );

  const onSignUp: OnSignUp = React.useCallback(
    async ({ email, password }) => {
      try {
        const response = await fetch(`${apiUrl}/auth/local/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: email, // Assuming username is the same as email
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          addNotification({
            title: 'Sign up failed',
            message: data.error?.message || 'An error occurred during sign up.',
            type: 'error',
          });
          return;
        }

        setScreen({ value: 'confirmSignUpCheckEmail' });
      } catch {
        addNotification({
          title: 'Network Error',
          message:
            'Unable to connect to the server. Please check your connection.',
          type: 'error',
        });
      }
    },
    [addNotification, setScreen, apiUrl]
  );

  const onForgotPassword: OnForgotPassword = React.useCallback(
    async ({ email }) => {
      try {
        const response = await fetch(`${apiUrl}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          addNotification({
            title: 'Forgot password failed',
            message:
              data.error?.message ||
              'An error occurred during forgot password.',
            type: 'error',
          });
          return;
        }

        // Transition to reset password screen after email is sent
        setScreen({ value: 'confirmResetPassword', context: { email } });
      } catch {
        addNotification({
          title: 'Network Error',
          message:
            'Unable to connect to the server. Please check your connection.',
          type: 'error',
        });
      }
    },
    [addNotification, setScreen, apiUrl]
  );

  const onForgotPasswordResetPassword: OnForgotPasswordResetPassword =
    React.useCallback(
      async ({ code, newPassword }) => {
        try {
          const response = await fetch(`${apiUrl}/auth/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              password: newPassword,
              passwordConfirmation: newPassword,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            addNotification({
              title: 'Reset password failed',
              message:
                data.error?.message ||
                'An error occurred during password reset.',
              type: 'error',
            });
            return;
          }

          addNotification({
            title: 'Password reset successful',
            message: 'You can now sign in with your new password.',
            type: 'success',
          });

          setScreen({ value: 'signIn' });
        } catch {
          addNotification({
            title: 'Network Error',
            message:
              'Unable to connect to the server. Please check your connection.',
            type: 'error',
          });
        }
      },
      [addNotification, setScreen, apiUrl]
    );

  const onConfirmSignUpCheckEmail: OnConfirmSignUpCheckEmail =
    React.useCallback(async () => {
      setScreen({ value: 'signIn' });
    }, [setScreen]);

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
    />
  );
};
