import { useI18n } from '@ttoss/react-i18n';
import { useNotifications } from '@ttoss/react-notifications';
import { Flex } from '@ttoss/ui';
import {
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
} from 'aws-amplify/auth';
import * as React from 'react';

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

type AuthScreen =
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

type AuthLogicProps = {
  signUpTerms?: AuthSignUpProps['signUpTerms'];
};

const AuthLogic = (props: AuthLogicProps) => {
  const { intl } = useI18n();

  const { isAuthenticated } = useAuth();

  const [screen, setScreen] = React.useState<AuthScreen>({
    value: 'signIn',
    context: {},
  });

  const { setLoading, addNotification, clearNotifications } =
    useNotifications();

  /**
   * Clear notifications when the state changes
   */
  React.useEffect(() => {
    clearNotifications();
  }, [screen.value, clearNotifications]);

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
        } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          await resendSignUpCode({ username: email });
          setScreen({ value: 'signUpResendConfirmation', context: { email } });
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
      } finally {
        setLoading(false);
      }
    },
    [addNotification, intl, setLoading]
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
        setScreen({ value: 'signUpConfirm', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, addNotification]
  );

  const onConfirmSignUp = React.useCallback<OnConfirmSignUp>(
    async ({ email, code }) => {
      try {
        setLoading(true);
        await confirmSignUp({ confirmationCode: code, username: email });
        // toast('Confirmed Signed In');
        setScreen({ value: 'signIn', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, addNotification]
  );

  const onReturnToSignIn = React.useCallback(() => {
    setScreen({ value: 'signIn', context: {} });
  }, []);

  const onForgotPassword = React.useCallback<OnForgotPassword>(
    async ({ email }) => {
      try {
        setLoading(true);
        await resetPassword({ username: email });
        // toast('Forgot Password');
        setScreen({ value: 'forgotPasswordResetPassword', context: { email } });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        addNotification({ type: 'error', message: error.message });
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [setLoading, addNotification]
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
          setScreen({ value: 'signIn', context: { email } });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          addNotification({ type: 'error', message: error.message });
          // toast(JSON.stringify(error, null, 2));
        } finally {
          setLoading(false);
        }
      },
      [setLoading, addNotification]
    );

  if (isAuthenticated) {
    return null;
  }

  if (screen.value === 'signUp') {
    return (
      <AuthSignUp
        onSignUp={onSignUp}
        onReturnToSignIn={onReturnToSignIn}
        signUpTerms={props.signUpTerms}
      />
    );
  }

  if (
    screen.value === 'signUpConfirm' ||
    screen.value === 'signUpResendConfirmation'
  ) {
    return (
      <AuthConfirmSignUp
        onConfirmSignUp={onConfirmSignUp}
        email={screen.context.email}
      />
    );
  }

  if (screen.value === 'forgotPassword') {
    return (
      <AuthForgotPassword
        onForgotPassword={onForgotPassword}
        onCancel={onReturnToSignIn}
        onSignUp={() => {
          setScreen({ value: 'signUp', context: {} });
        }}
      />
    );
  }

  if (screen.value === 'forgotPasswordResetPassword') {
    return (
      <AuthForgotPasswordResetPassword
        email={screen.context.email}
        onForgotPasswordResetPassword={onForgotPasswordResetPassword}
        onCancel={onReturnToSignIn}
      />
    );
  }

  return (
    <AuthSignIn
      onSignIn={onSignIn}
      onSignUp={() => {
        setScreen({ value: 'signUp', context: {} });
      }}
      onForgotPassword={() => {
        setScreen({ value: 'forgotPassword', context: {} });
      }}
      defaultValues={{ email: screen.context.email }}
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
