import {
  Auth as AuthCore,
  type OnConfirmSignUpCheckEmail,
  type OnForgotPassword,
  type OnSignIn,
  type OnSignUp,
  useAuthScreen,
} from '@ttoss/react-auth-core';
import { useNotifications } from '@ttoss/react-notifications';

import { useAuth } from './AuthProvider';

const API_URL = 'https://api.suryaenergia.com/api';

export const Auth = () => {
  const { setAuthState } = useAuth();

  const { screen, setScreen } = useAuthScreen();

  const { addNotification } = useNotifications();

  const onSignIn: OnSignIn = async ({ email, password }) => {
    const response = await fetch(`${API_URL}/auth/local`, {
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
          `${API_URL}/auth/send-email-confirmation`,
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

    setAuthState({
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.confirmed,
      },
      tokens: {
        accessToken: data.jwt,
      },
      isAuthenticated: true,
    });

    // console.log('Sign in successful:', data);
  };

  const onSignUp: OnSignUp = async ({ email, password }) => {
    const response = await fetch(`${API_URL}/auth/local/register`, {
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

    setScreen({ value: 'signIn' });
  };

  const onForgotPassword: OnForgotPassword = async ({ email }) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
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
          data.error?.message || 'An error occurred during forgot password.',
        type: 'error',
      });
      return;
    }
  };

  const onConfirmSignUpCheckEmail: OnConfirmSignUpCheckEmail = async () => {
    setScreen({ value: 'signIn' });
  };

  return (
    <AuthCore
      screen={screen}
      setScreen={setScreen}
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
      onConfirmSignUpCheckEmail={onConfirmSignUpCheckEmail}
    />
  );
};
