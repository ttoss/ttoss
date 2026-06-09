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
import { defineMessages, useI18n } from '@ttoss/react-i18n';
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

const messages = defineMessages({
  signedInSuccessfully: {
    defaultMessage: 'Signed in successfully',
    description: 'Success notification after sign in.',
  },
  resetPasswordRequired: {
    defaultMessage:
      "For your security, please reset your password using 'Forgot password?' before continuing.",
    description: 'Shown when Cognito requires a password reset on sign in.',
  },
  incorrectCredentials: {
    defaultMessage: 'Incorrect email or password.',
    description: 'Shown when the user enters wrong sign-in credentials.',
  },
  userNotFound: {
    defaultMessage: 'No account found with this email address.',
    description: 'Shown when no Cognito user exists for the given email.',
  },
  codeMismatch: {
    defaultMessage: 'The code you entered is incorrect. Please try again.',
    description: 'Shown when the user types a wrong confirmation code.',
  },
  usernameExists: {
    defaultMessage:
      'An account with this email already exists. Please sign in.',
    description: 'Shown when a user tries to sign up with an existing email.',
  },
  sessionExpired: {
    defaultMessage: 'Your session expired. Please sign in again.',
    description: 'Shown when a stale Amplify session is detected.',
  },
  unverifiedAccount: {
    defaultMessage:
      'Your account is not verified. Please contact support to verify your account before resetting your password.',
    description:
      'Shown on forgot-password when the account has no verified email.',
  },
  genericError: {
    defaultMessage: 'Something went wrong. Please try again.',
    description: 'Fallback message for unexpected authentication errors.',
  },
});

const USER_ERROR_NAMES = new Set([
  'NotAuthorizedException',
  'UserNotFoundException',
  'CodeMismatchException',
]);

const isUserError = (error: { name?: string }) => {
  return Boolean(error.name && USER_ERROR_NAMES.has(error.name));
};

type Fm = (m: { defaultMessage: string }) => string;

const signInErrorMessage = (name: string | undefined, fm: Fm) => {
  if (name === 'NotAuthorizedException')
    return fm(messages.incorrectCredentials);
  if (name === 'UserNotFoundException') return fm(messages.userNotFound);
  return fm(messages.genericError);
};

const confirmCodeErrorMessage = (name: string | undefined, fm: Fm) => {
  return name === 'CodeMismatchException'
    ? fm(messages.codeMismatch)
    : fm(messages.genericError);
};

const forgotPasswordErrorMessage = (name: string | undefined, fm: Fm) => {
  return name === 'UserNotFoundException'
    ? fm(messages.userNotFound)
    : fm(messages.genericError);
};

type HandlerDeps = {
  onError?: (error: Error) => void;
  fm: Fm;
  setScreen: ReturnType<typeof useAuthScreen>['setScreen'];
  addNotification: ReturnType<typeof useNotifications>['addNotification'];
};

const useSignHandlers = ({
  onError,
  fm,
  setScreen,
  addNotification,
}: HandlerDeps) => {
  const onSignIn = React.useCallback<OnSignIn>(
    async ({ email, password }) => {
      try {
        const result = await signIn({ username: email, password });
        if (result.nextStep.signInStep === 'RESET_PASSWORD') {
          addNotification({
            type: 'error',
            message: fm(messages.resetPasswordRequired),
          });
        } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          await resendSignUpCode({ username: email });
          setScreen({ value: 'confirmSignUpWithCode', context: { email } });
        } else if (result.nextStep.signInStep === 'DONE') {
          addNotification({
            viewType: 'toast',
            type: 'success',
            message: fm(messages.signedInSuccessfully),
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === 'UserAlreadyAuthenticatedException') {
          await signOut();
          addNotification({
            type: 'error',
            message: fm(messages.sessionExpired),
          });
          return;
        }
        if (!isUserError(error)) onError?.(error);
        addNotification({
          type: 'error',
          message: signInErrorMessage(error.name, fm),
        });
      }
    },
    [addNotification, fm, setScreen, onError]
  );

  const onSignUp = React.useCallback<OnSignUp>(
    async ({ email, password }) => {
      try {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } },
        });
        setScreen({ value: 'confirmSignUpWithCode', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.name === 'UsernameExistsException') {
          addNotification({
            type: 'error',
            message: fm(messages.usernameExists),
          });
          return;
        }
        if (!isUserError(error)) onError?.(error);
        addNotification({ type: 'error', message: fm(messages.genericError) });
      }
    },
    [setScreen, addNotification, onError, fm]
  );

  const onConfirmSignUpWithCode = React.useCallback<OnConfirmSignUpWithCode>(
    async ({ email, code }) => {
      try {
        await confirmSignUp({ confirmationCode: code, username: email });
        setScreen({ value: 'signIn' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (!isUserError(error)) onError?.(error);
        addNotification({
          type: 'error',
          message: confirmCodeErrorMessage(error.name, fm),
        });
      }
    },
    [setScreen, addNotification, onError, fm]
  );

  return { onSignIn, onSignUp, onConfirmSignUpWithCode };
};

const usePasswordHandlers = ({
  onError,
  fm,
  setScreen,
  addNotification,
}: HandlerDeps) => {
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
            message: fm(messages.unverifiedAccount),
          });
          return;
        }
        if (!isUserError(error)) onError?.(error);
        addNotification({
          type: 'error',
          message: forgotPasswordErrorMessage(error.name, fm),
        });
      }
    },
    [setScreen, addNotification, onError, fm]
  );

  const onForgotPasswordResetPassword =
    React.useCallback<OnForgotPasswordResetPassword>(
      async ({ email, code, newPassword }) => {
        try {
          if (!email) throw new Error('Email is required to reset password');
          if (!code)
            throw new Error('Confirmation code is required to reset password');
          await confirmResetPassword({
            confirmationCode: code,
            username: email,
            newPassword,
          });
          setScreen({ value: 'signIn' });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (!isUserError(error)) onError?.(error);
          addNotification({
            type: 'error',
            message: confirmCodeErrorMessage(error.name, fm),
          });
        }
      },
      [setScreen, addNotification, onError, fm]
    );

  return { onForgotPassword, onForgotPasswordResetPassword };
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
  const fm = intl.formatMessage.bind(intl) as unknown as Fm;

  const { onSignIn, onSignUp, onConfirmSignUpWithCode } = useSignHandlers({
    onError,
    fm,
    setScreen,
    addNotification,
  });

  const { onForgotPassword, onForgotPasswordResetPassword } =
    usePasswordHandlers({
      onError,
      fm,
      setScreen,
      addNotification,
    });

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
