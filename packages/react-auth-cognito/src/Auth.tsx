import {
  Auth as AuthCore,
  type AuthProps as AuthCoreProps,
  type AuthScreen,
  type OnForgotPassword,
  type OnForgotPasswordResetPassword,
  type OnSignIn,
  type OnSignUp,
  type OnSocialSignIn,
  type SocialProvider,
  useAuthScreen,
} from '@ttoss/react-auth-core';
import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';
import {
  confirmResetPassword,
  resendSignUpCode,
  resetPassword,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import * as React from 'react';

import { type AuthEvent, errorNameOf, useAuthEventEmitter } from './authEvents';
import {
  confirmCodeErrorMessage,
  forgotPasswordErrorMessage,
  type HandlerDeps,
  isUserError,
  messages,
  signInErrorMessage,
} from './authShared';
import { useConfirmSignUpHandler } from './useConfirmSignUpHandler';

export type { AuthAction, AuthEvent } from './authEvents';

const useSignHandlers = ({
  onError,
  emit,
  autoSignInAfterSignUp,
  fm,
  setScreen,
  addNotification,
}: HandlerDeps) => {
  const onSignIn = React.useCallback<OnSignIn>(
    async ({ email, password }) => {
      try {
        const result = await signIn({ username: email, password });
        emit({
          type: 'actionSucceeded',
          action: 'signIn',
          nextStep: result.nextStep.signInStep,
        });
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
        emit({
          type: 'actionFailed',
          action: 'signIn',
          errorName: errorNameOf(error),
        });
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
    [addNotification, fm, setScreen, onError, emit]
  );

  const onSignUp = React.useCallback<OnSignUp>(
    async ({ email, password }) => {
      try {
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: { email },
            ...(autoSignInAfterSignUp ? { autoSignIn: true } : {}),
          },
        });
        emit({ type: 'actionSucceeded', action: 'signUp' });
        setScreen({ value: 'confirmSignUpWithCode', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        emit({
          type: 'actionFailed',
          action: 'signUp',
          errorName: errorNameOf(error),
        });
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
    [setScreen, addNotification, onError, fm, emit, autoSignInAfterSignUp]
  );

  const onConfirmSignUpWithCode = useConfirmSignUpHandler({
    onError,
    emit,
    fm,
    setScreen,
    addNotification,
  });

  const onSocialSignIn = React.useCallback<OnSocialSignIn>(
    async ({ provider }) => {
      try {
        await signInWithRedirect({ provider });
        emit({ type: 'actionSucceeded', action: 'socialSignIn' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        emit({
          type: 'actionFailed',
          action: 'socialSignIn',
          errorName: errorNameOf(error),
        });
        // The hosted UI runs in the same tab, so a rejection here means the
        // redirect never started — there is no user mistake to report back.
        onError?.(error);
        addNotification({ type: 'error', message: fm(messages.genericError) });
      }
    },
    [addNotification, fm, onError, emit]
  );

  return { onSignIn, onSignUp, onConfirmSignUpWithCode, onSocialSignIn };
};

const usePasswordHandlers = ({
  onError,
  emit,
  fm,
  setScreen,
  addNotification,
}: HandlerDeps) => {
  const onForgotPassword = React.useCallback<OnForgotPassword>(
    async ({ email }) => {
      try {
        await resetPassword({ username: email });
        emit({ type: 'actionSucceeded', action: 'forgotPassword' });
        setScreen({ value: 'confirmResetPassword', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        emit({
          type: 'actionFailed',
          action: 'forgotPassword',
          errorName: errorNameOf(error),
        });
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
    [setScreen, addNotification, onError, fm, emit]
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
          emit({ type: 'actionSucceeded', action: 'confirmResetPassword' });
          setScreen({ value: 'signIn' });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          emit({
            type: 'actionFailed',
            action: 'confirmResetPassword',
            errorName: errorNameOf(error),
          });
          if (!isUserError(error)) onError?.(error);
          addNotification({
            type: 'error',
            message: confirmCodeErrorMessage(error.name, fm),
          });
        }
      },
      [setScreen, addNotification, onError, fm, emit]
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
  /**
   * Called on every screen the user sees and on the outcome of every
   * authentication action, failures included — the user mistakes `onError`
   * skips (wrong password, wrong code) are reported here. Meant for analytics:
   * the event never holds what the user typed.
   */
  onAuthEvent?: (event: AuthEvent) => void;
  /**
   * The screen shown first, e.g. `{ value: 'signUp' }` for a sign-up link.
   * Read on mount only, like `useState`'s initial value.
   */
  initialScreen?: AuthScreen;
  /**
   * Sign the user in right after they confirm their sign-up code, instead of
   * sending them back to the sign-in screen to type the password again.
   * Defaults to `false`.
   */
  autoSignInAfterSignUp?: boolean;
  /**
   * Federated identity providers to offer alongside email/password. Each one
   * must also be configured on the Cognito user pool and app client, and the
   * app's Amplify config must declare `Auth.Cognito.loginWith.oauth`.
   */
  socialProviders?: SocialProvider[];
};

export const Auth = (props: AuthProps) => {
  const { onError, onAuthEvent, autoSignInAfterSignUp } = props;
  const { intl } = useI18n();
  const { screen, setScreen } = useAuthScreen(props.initialScreen);
  const { addNotification } = useNotifications();
  const fm: Fm = (m) => {
    return intl.formatMessage(m) as unknown as string;
  };

  const emit = useAuthEventEmitter({ onAuthEvent, screen: screen.value });

  const { onSignIn, onSignUp, onConfirmSignUpWithCode, onSocialSignIn } =
    useSignHandlers({
      onError,
      emit,
      autoSignInAfterSignUp,
      fm,
      setScreen,
      addNotification,
    });

  const { onForgotPassword, onForgotPasswordResetPassword } =
    usePasswordHandlers({
      onError,
      emit,
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
      socialProviders={props.socialProviders}
      onSocialSignIn={onSocialSignIn}
      onError={onError as (error: unknown) => void}
    />
  );
};
