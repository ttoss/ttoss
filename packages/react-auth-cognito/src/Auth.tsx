import {
  Auth as AuthCore,
  type AuthProps as AuthCoreProps,
  type OnConfirmSignUpWithCode,
  type OnForgotPassword,
  type OnForgotPasswordResetPassword,
  type OnSignIn,
  type OnSignUp,
  useAuthScreen,
} from '@ttoss/react-auth-core';
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';
import {
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import * as React from 'react';

const USER_ERROR_NAMES = new Set([
  'NotAuthorizedException',
  'UserNotFoundException',
  'CodeMismatchException',
]);

const isUserError = (error: { name?: string }) => {
  return Boolean(error.name && USER_ERROR_NAMES.has(error.name));
};

export type AuthProps = Pick<
  AuthCoreProps,
  'signUpTerms' | 'logo' | 'layout'
> & {
  /**
   * Callback function invoked when an error occurs during authentication operations.
   * Receives the error object that was caught.
   */
  onError?: (error: Error) => void;
};

export const Auth = (props: AuthProps) => {
  const { onError } = props;

  const { intl } = useI18n();

  const { screen, setScreen } = useAuthScreen();

  const { addNotification } = useNotifications();

  const onSignIn = React.useCallback<OnSignIn>(
    async ({ email, password }) => {
      try {
        const result = await signIn({ username: email, password });

        if (result.nextStep.signInStep === 'RESET_PASSWORD') {
          addNotification({
            type: 'error',
            message: `For your security, we have updated our system and you need to reset your password in 'forgot your password?' to proceed`,
          });
        } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          await resendSignUpCode({ username: email });
          setScreen({ value: 'confirmSignUpWithCode', context: { email } });
        } else if (result.nextStep.signInStep === 'DONE') {
          addNotification({
            viewType: 'toast',
            type: 'success',
            message: intl.formatMessage({
              defaultMessage: 'Signed in successfully',
            }),
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === 'UserAlreadyAuthenticatedException') {
          await signOut();
          return;
        }

        if (!isUserError(error)) {
          onError?.(error);
        }

        addNotification({ type: 'error', message: error.message });
      }
    },
    [addNotification, intl, setScreen, onError]
  );

  const onSignUp = React.useCallback<OnSignUp>(
    async ({ email, password }) => {
      try {
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
            },
          },
        });

        setScreen({ value: 'confirmSignUpWithCode', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === 'UsernameExistsException') {
          setScreen({ value: 'signIn' });
          return;
        }

        if (!isUserError(error)) {
          onError?.(error);
        }

        addNotification({ type: 'error', message: error.message });
      }
    },
    [setScreen, addNotification, onError]
  );

  const onConfirmSignUpWithCode = React.useCallback<OnConfirmSignUpWithCode>(
    async ({ email, code }) => {
      try {
        await confirmSignUp({ confirmationCode: code, username: email });
        setScreen({ value: 'signIn' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (!isUserError(error)) {
          onError?.(error);
        }

        addNotification({ type: 'error', message: error.message });
      }
    },
    [setScreen, addNotification, onError]
  );

  const onForgotPassword = React.useCallback<OnForgotPassword>(
    async ({ email }) => {
      try {
        await resetPassword({ username: email });
        setScreen({ value: 'confirmResetPassword', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === 'InvalidParameterException') {
          addNotification({
            type: 'error',
            message: intl.formatMessage({
              defaultMessage:
                'Your account is not verified. Please contact support to verify your account before resetting your password.',
            }),
          });
          return;
        }

        if (!isUserError(error)) {
          onError?.(error);
        }

        addNotification({ type: 'error', message: error.message });
      }
    },
    [setScreen, addNotification, onError, intl]
  );

  const onForgotPasswordResetPassword =
    React.useCallback<OnForgotPasswordResetPassword>(
      async ({ email, code, newPassword }) => {
        try {
          if (!email) {
            throw new Error('Email is required to reset password');
          }

          if (!code) {
            throw new Error('Confirmation code is required to reset password');
          }

          await confirmResetPassword({
            confirmationCode: code,
            username: email,
            newPassword,
          });

          setScreen({ value: 'signIn' });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (!isUserError(error)) {
            onError?.(error);
          }

          addNotification({ type: 'error', message: error.message });
        }
      },
      [setScreen, addNotification, onError]
    );

  return (
    <AuthCore
      screen={screen}
      setScreen={setScreen}
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onConfirmSignUpWithCode={onConfirmSignUpWithCode}
      onForgotPassword={onForgotPassword}
      onForgotPasswordResetPassword={onForgotPasswordResetPassword}
      signUpTerms={props.signUpTerms}
      logo={props.logo}
      layout={props.layout}
      maxForgotPasswordCodeLength={6}
    />
  );
};
