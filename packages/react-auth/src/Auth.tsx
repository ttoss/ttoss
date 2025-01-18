import { useNotifications } from '@ttoss/react-notifications';
import { Flex } from '@ttoss/ui';
import { useMachine } from '@xstate/react';
import {
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
} from 'aws-amplify/auth';
import * as React from 'react';
import { assign, createMachine } from 'xstate';

import { LogoContextProps, LogoProvider } from './AuthCard';
import { AuthConfirmSignUp } from './AuthConfirmSignUp';
import { AuthForgotPassword } from './AuthForgotPassword';
import { AuthForgotPasswordResetPassword } from './AuthForgotPasswordResetPassword';
import { AuthFullScreen } from './AuthFullScreen';
import { useAuth } from './AuthProvider';
import { AuthSignIn } from './AuthSignIn';
import { AuthSignUp, type AuthSignUpProps } from './AuthSignUp';
import type {
  OnConfirmSignUp,
  OnForgotPassword,
  OnForgotPasswordResetPassword,
  OnSignIn,
  OnSignUp,
} from './types';

type AuthState =
  | {
      value: 'signIn';
      context: { email?: string };
    }
  | {
      value: 'signUp';
      context: Record<string, never>;
    }
  | {
      value: 'signUpConfirm';
      context: { email: string };
    }
  | {
      value: 'signUpResendConfirmation';
      context: { email: string };
    }
  | {
      value: 'forgotPassword';
      context: Record<string, never>;
    }
  | {
      value: 'forgotPasswordResetPassword';
      context: { email: string };
    };

type AuthEvent =
  | { type: 'SIGN_UP' }
  | { type: 'SIGN_UP_CONFIRM'; email: string }
  | { type: 'SIGN_UP_CONFIRMED'; email: string }
  | { type: 'SIGN_UP_RESEND_CONFIRMATION'; email: string }
  | { type: 'RETURN_TO_SIGN_IN' }
  | { type: 'FORGOT_PASSWORD' }
  | { type: 'FORGOT_PASSWORD_RESET_PASSWORD'; email: string }
  | { type: 'FORGOT_PASSWORD_CONFIRMED'; email: string };

type AuthContext = { email?: string };

const authMachine = createMachine<AuthContext, AuthEvent, AuthState>(
  {
    predictableActionArguments: true,
    initial: 'signIn',
    states: {
      signIn: {
        on: {
          SIGN_UP: { target: 'signUp' },
          SIGN_UP_RESEND_CONFIRMATION: {
            actions: ['assignEmail'],
            target: 'signUpConfirm',
          },
          FORGOT_PASSWORD: { target: 'forgotPassword' },
        },
      },
      signUp: {
        on: {
          SIGN_UP_CONFIRM: {
            actions: ['assignEmail'],
            target: 'signUpConfirm',
          },
          RETURN_TO_SIGN_IN: { target: 'signIn' },
        },
      },
      signUpConfirm: {
        on: {
          SIGN_UP_CONFIRMED: {
            actions: ['assignEmail'],
            target: 'signIn',
          },
        },
      },
      forgotPassword: {
        on: {
          RETURN_TO_SIGN_IN: { target: 'signIn' },
          SIGN_UP: { target: 'signUp' },
          FORGOT_PASSWORD_RESET_PASSWORD: {
            actions: ['assignEmail'],
            target: 'forgotPasswordResetPassword',
          },
        },
      },
      forgotPasswordResetPassword: {
        on: {
          FORGOT_PASSWORD_CONFIRMED: {
            actions: ['assignEmail'],
            target: 'signIn',
          },
          RETURN_TO_SIGN_IN: { target: 'signIn' },
        },
      },
    },
  },
  {
    actions: {
      assignEmail: assign({
        email: (_, event) => {
          if ('email' in event) {
            return event.email;
          }

          return undefined;
        },
      }),
    },
  }
);

type AuthLogicProps = {
  signUpTerms?: AuthSignUpProps['signUpTerms'];
};

const AuthLogic = (props: AuthLogicProps) => {
  const { isAuthenticated } = useAuth();

  const [state, send] = useMachine(authMachine);

  const { setLoading, addNotification, clearNotifications } =
    useNotifications();

  /**
   * Clear notifications when the state changes
   */
  React.useEffect(() => {
    clearNotifications();
  }, [state, clearNotifications]);

  /**
   * Clear notifications when the component unmounts
   */
  React.useEffect(() => {
    return clearNotifications;
  }, [clearNotifications]);

  const onSignIn = React.useCallback<OnSignIn>(
    async ({ email, password }) => {
      try {
        setLoading(true);
        const result = await signIn({ username: email, password });
        if (result.nextStep.signInStep === 'RESET_PASSWORD') {
          addNotification({
            type: 'error',
            message: `For your security, we have updated our system and you need to reset your password in 'forgot your password?' to proceed`,
          });
        }
        // toast('Signed In');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        switch (error.code) {
          case 'UserNotConfirmedException':
            await resendSignUpCode({ username: email });
            send({ type: 'SIGN_UP_RESEND_CONFIRMATION', email });
            break;
          default:
          // toast(JSON.stringify(error, null, 2));
        }
        addNotification({ type: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading, addNotification]
  );

  const onSignUp = React.useCallback<OnSignUp>(
    async ({ email, password }) => {
      try {
        setLoading(true);
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
            },
          },
        });
        // toast('Signed Up');
        send({ type: 'SIGN_UP_CONFIRM', email });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading, addNotification]
  );

  const onConfirmSignUp = React.useCallback<OnConfirmSignUp>(
    async ({ email, code }) => {
      try {
        setLoading(true);
        await confirmSignUp({ confirmationCode: code, username: email });
        // toast('Confirmed Signed In');
        send({ type: 'SIGN_UP_CONFIRMED', email });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading, addNotification]
  );

  const onReturnToSignIn = React.useCallback(() => {
    send({ type: 'RETURN_TO_SIGN_IN' });
  }, [send]);

  const onForgotPassword = React.useCallback<OnForgotPassword>(
    async ({ email }) => {
      try {
        setLoading(true);
        await resetPassword({ username: email });
        // toast('Forgot Password');
        send({ type: 'FORGOT_PASSWORD_RESET_PASSWORD', email });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading, addNotification]
  );

  const onForgotPasswordResetPassword =
    React.useCallback<OnForgotPasswordResetPassword>(
      async ({ email, code, newPassword }) => {
        try {
          setLoading(true);
          await confirmResetPassword({
            confirmationCode: code,
            username: email,
            newPassword,
          });
          // toast('Forgot Password Reset Password');
          send({ type: 'FORGOT_PASSWORD_CONFIRMED', email });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          addNotification({ type: 'error', message: error.message });
          // toast(JSON.stringify(error, null, 2));
        } finally {
          setLoading(false);
        }
      },
      [send, setLoading, addNotification]
    );

  if (isAuthenticated) {
    return null;
  }

  if (state.matches('signUp')) {
    return (
      <AuthSignUp
        onSignUp={onSignUp}
        onReturnToSignIn={onReturnToSignIn}
        signUpTerms={props.signUpTerms}
      />
    );
  }

  if (state.matches('signUpConfirm')) {
    return (
      <AuthConfirmSignUp
        onConfirmSignUp={onConfirmSignUp}
        email={state.context.email}
      />
    );
  }

  if (state.matches('forgotPassword')) {
    return (
      <AuthForgotPassword
        onForgotPassword={onForgotPassword}
        onCancel={onReturnToSignIn}
        onSignUp={() => {
          return send('SIGN_UP');
        }}
      />
    );
  }

  if (state.matches('forgotPasswordResetPassword')) {
    return (
      <AuthForgotPasswordResetPassword
        email={state.context.email}
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onCancel={onReturnToSignIn}
      />
    );
  }

  return (
    <AuthSignIn
      onSignIn={onSignIn}
      onSignUp={() => {
        return send('SIGN_UP');
      }}
      onForgotPassword={() => {
        return send('FORGOT_PASSWORD');
      }}
      defaultValues={{ email: state.context.email }}
    />
  );
};

type AuthLayout = {
  fullScreen?: boolean;
  sideContent?: React.ReactNode;
  sideContentPosition?: 'left' | 'right';
};

export type AuthProps = LogoContextProps &
  AuthLogicProps & {
    layout?: AuthLayout;
  };

export const Auth = (props: AuthProps) => {
  const { layout = { fullScreen: true } } = props;

  const withLogoNode = React.useMemo(() => {
    return (
      <LogoProvider logo={props.logo}>
        <AuthLogic signUpTerms={props.signUpTerms} />
      </LogoProvider>
    );
  }, [props.logo, props.signUpTerms]);

  if (layout.fullScreen) {
    if (layout.sideContentPosition) {
      return (
        <AuthFullScreen>
          <Flex
            sx={{
              width: '100%',
              height: '100%',
              flexDirection:
                layout.sideContentPosition === 'left' ? 'row' : 'row-reverse',
            }}
          >
            <Flex
              sx={{
                width: '100%',
                height: '100%',
                flex: [0, 0, 1],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {layout.sideContent}
            </Flex>
            <Flex
              sx={{
                width: '100%',
                height: '100%',
                flex: [1],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {withLogoNode}
            </Flex>
          </Flex>
        </AuthFullScreen>
      );
    }

    return <AuthFullScreen>{withLogoNode}</AuthFullScreen>;
  }

  return withLogoNode;
};
