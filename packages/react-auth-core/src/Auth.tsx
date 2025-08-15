import { useNotifications } from '@ttoss/react-notifications';
import { Flex } from '@ttoss/ui';
import * as React from 'react';

import { LogoContextProps, LogoProvider } from './AuthCard';
import { AuthConfirmSignUpCheckEmail } from './AuthConfirmSignUpCheckEmail';
import { AuthConfirmSignUpWithCode } from './AuthConfirmSignUpWithCode';
import { AuthForgotPassword } from './AuthForgotPassword';
import { AuthForgotPasswordResetPassword } from './AuthForgotPasswordResetPassword';
import { AuthFullScreen } from './AuthFullScreen';
import { AuthSignIn } from './AuthSignIn';
import { AuthSignUp } from './AuthSignUp';
import { ErrorBoundary } from './ErrorBoundary';
import type {
  AuthScreen,
  OnConfirmSignUpCheckEmail,
  OnConfirmSignUpWithCode,
  OnForgotPassword,
  OnForgotPasswordResetPassword,
  OnSignIn,
  OnSignUp,
  SignUpTerms,
} from './types';

type AuthLogicProps = {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  signUpTerms?: SignUpTerms;
  passwordMinimumLength?: number;
  onSignIn: OnSignIn;
  onSignUp?: OnSignUp;
  onConfirmSignUpCheckEmail?: OnConfirmSignUpCheckEmail;
  onConfirmSignUpWithCode?: OnConfirmSignUpWithCode;
  onForgotPassword?: OnForgotPassword;
  onForgotPasswordResetPassword?: OnForgotPasswordResetPassword;
};

const AuthLogic = (props: AuthLogicProps) => {
  const { clearNotifications, setLoading } = useNotifications();

  /**
   * Clear notifications when the state changes
   */
  React.useEffect(() => {
    clearNotifications();
  }, [props.screen.value, clearNotifications]);

  /**
   * Clear notifications when the component unmounts
   */
  React.useEffect(() => {
    return clearNotifications;
  }, [clearNotifications]);

  const onGoToSignIn = () => {
    props.setScreen({ value: 'signIn' });
  };

  const onGoToSignUp = React.useCallback(() => {
    if (!props.onSignUp) {
      return undefined;
    }

    props.setScreen({ value: 'signUp' });
  }, [props]);

  const onGoToForgotPassword = React.useCallback(() => {
    if (!props.onForgotPassword) {
      return undefined;
    }

    props.setScreen({ value: 'forgotPassword' });
  }, [props]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationsWrapper = (fn: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (input: any) => {
      if (fn) {
        clearNotifications();
        setLoading(true);
        const result = await fn(input);
        setLoading(false);
        return result;
      }
    };
  };

  if (props.screen.value === 'signIn') {
    return (
      <AuthSignIn
        onSignIn={notificationsWrapper(props.onSignIn)}
        onGoToSignUp={props.onSignUp && onGoToSignUp}
        onGoToForgotPassword={props.onForgotPassword && onGoToForgotPassword}
        passwordMinimumLength={props.passwordMinimumLength}
      />
    );
  }

  if (props.screen.value === 'signUp' && props.onSignUp) {
    return (
      <AuthSignUp
        onSignUp={notificationsWrapper(props.onSignUp)}
        passwordMinimumLength={props.passwordMinimumLength}
        onGoToSignIn={onGoToSignIn}
        signUpTerms={props.signUpTerms}
      />
    );
  }

  if (props.screen.value === 'forgotPassword' && props.onForgotPassword) {
    return (
      <AuthForgotPassword
        onForgotPassword={notificationsWrapper(props.onForgotPassword)}
        onGoToSignIn={onGoToSignIn}
        onGoToSignUp={props.onSignUp && onGoToSignUp}
      />
    );
  }

  if (
    props.screen.value === 'confirmResetPassword' &&
    props.onForgotPasswordResetPassword
  ) {
    return (
      <AuthForgotPasswordResetPassword
        onForgotPasswordResetPassword={notificationsWrapper(
          props.onForgotPasswordResetPassword
        )}
        onGoToSignIn={onGoToSignIn}
        email={props.screen.context.email}
      />
    );
  }

  if (
    props.screen.value === 'confirmSignUpWithCode' &&
    props.onConfirmSignUpWithCode
  ) {
    return (
      <AuthConfirmSignUpWithCode
        onConfirmSignUpWithCode={notificationsWrapper(
          props.onConfirmSignUpWithCode
        )}
        email={props.screen.context.email}
      />
    );
  }

  if (
    props.screen.value === 'confirmSignUpCheckEmail' &&
    props.onConfirmSignUpCheckEmail
  ) {
    return (
      <AuthConfirmSignUpCheckEmail
        onConfirmSignUpCheckEmail={props.onConfirmSignUpCheckEmail}
      />
    );
  }

  return null;
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
        <ErrorBoundary>
          <AuthLogic {...props} />
        </ErrorBoundary>
      </LogoProvider>
    );
  }, [props]);

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
