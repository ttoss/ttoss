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
  signUp,
} from 'aws-amplify/auth';
import * as React from 'react';

export type AuthProps = Pick<AuthCoreProps, 'signUpTerms' | 'logo' | 'layout'>;

export const Auth = (props: AuthProps) => {
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
        addNotification({ type: 'error', message: error.message });
      }
    },
    [addNotification, intl, setScreen]
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
        addNotification({ type: 'error', message: error.message });
      }
    },
    [setScreen, addNotification]
  );

  const onConfirmSignUpWithCode = React.useCallback<OnConfirmSignUpWithCode>(
    async ({ email, code }) => {
      try {
        await confirmSignUp({ confirmationCode: code, username: email });
        setScreen({ value: 'signIn' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
      }
    },
    [setScreen, addNotification]
  );

  const onForgotPassword = React.useCallback<OnForgotPassword>(
    async ({ email }) => {
      try {
        await resetPassword({ username: email });
        setScreen({ value: 'confirmResetPassword', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
      }
    },
    [setScreen, addNotification]
  );

  const onForgotPasswordResetPassword =
    React.useCallback<OnForgotPasswordResetPassword>(
      async ({ email, code, newPassword }) => {
        try {
          await confirmResetPassword({
            confirmationCode: code,
            username: email,
            newPassword,
          });

          setScreen({ value: 'signIn' });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          addNotification({ type: 'error', message: error.message });
        }
      },
      [setScreen, addNotification]
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
    />
  );
};
