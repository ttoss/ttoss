import { useNotifications } from '@ttoss/react-notifications';
import { Flex } from '@ttoss/ui';
import * as React from 'react';

import type { LogoContextProps } from './AuthCard';
import { LogoProvider } from './AuthCard';
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
import { useAuthScreen } from './useAuthScreen';

type AuthLogicProps = {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  signUpTerms?: SignUpTerms;
  passwordMinimumLength?: number;
  maxForgotPasswordCodeLength?: number;
  onSignIn: OnSignIn;
  onSignUp?: OnSignUp;
  onConfirmSignUpCheckEmail?: OnConfirmSignUpCheckEmail;
  onConfirmSignUpWithCode?: OnConfirmSignUpWithCode;
  onForgotPassword?: OnForgotPassword;
  onForgotPasswordResetPassword?: OnForgotPasswordResetPassword;
};

type AuthPropsBase = {
  signUpTerms?: SignUpTerms;
  passwordMinimumLength?: number;
  maxForgotPasswordCodeLength?: number;
  onSignIn: OnSignIn;
  onSignUp?: OnSignUp;
  onConfirmSignUpCheckEmail?: OnConfirmSignUpCheckEmail;
  onConfirmSignUpWithCode?: OnConfirmSignUpWithCode;
  onForgotPassword?: OnForgotPassword;
  onForgotPasswordResetPassword?: OnForgotPasswordResetPassword;
};

type AuthPropsWithScreen = AuthPropsBase & {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  initialScreen?: never;
};

type AuthPropsWithInitialScreen = AuthPropsBase & {
  screen?: never;
  setScreen?: never;
  initialScreen?: AuthScreen;
};

const AuthLogic = (props: AuthLogicProps) => {
  const {
    screen,
    setScreen,
    onSignUp,
    onForgotPassword,
    onSignIn,
    onConfirmSignUpCheckEmail,
    onConfirmSignUpWithCode,
    onForgotPasswordResetPassword,
    passwordMinimumLength,
    signUpTerms,
    maxForgotPasswordCodeLength,
  } = props;

  const { clearNotifications, setLoading } = useNotifications();

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

  const onGoToSignIn = () => {
    setScreen({ value: 'signIn' });
  };

  const onGoToSignUp = React.useCallback(() => {
    if (!onSignUp) {
      return undefined;
    }

    setScreen({ value: 'signUp' });
  }, [onSignUp, setScreen]);

  const onGoToForgotPassword = React.useCallback(() => {
    if (!onForgotPassword) {
      return undefined;
    }

    setScreen({ value: 'forgotPassword' });
  }, [onForgotPassword, setScreen]);

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

  if (screen.value === 'signIn') {
    return (
      <AuthSignIn
        onSignIn={notificationsWrapper(onSignIn)}
        onGoToSignUp={onSignUp && onGoToSignUp}
        onGoToForgotPassword={onForgotPassword && onGoToForgotPassword}
        passwordMinimumLength={passwordMinimumLength}
      />
    );
  }

  if (screen.value === 'signUp' && onSignUp) {
    return (
      <AuthSignUp
        onSignUp={notificationsWrapper(onSignUp)}
        passwordMinimumLength={passwordMinimumLength}
        onGoToSignIn={onGoToSignIn}
        signUpTerms={signUpTerms}
      />
    );
  }

  if (screen.value === 'forgotPassword' && onForgotPassword) {
    return (
      <AuthForgotPassword
        onForgotPassword={notificationsWrapper(onForgotPassword)}
        onGoToSignIn={onGoToSignIn}
        onGoToSignUp={onSignUp && onGoToSignUp}
      />
    );
  }

  if (
    screen.value === 'confirmResetPassword' &&
    onForgotPasswordResetPassword
  ) {
    return (
      <AuthForgotPasswordResetPassword
        onForgotPasswordResetPassword={notificationsWrapper(
          onForgotPasswordResetPassword
        )}
        onGoToSignIn={onGoToSignIn}
        email={screen.context.email}
        maxCodeLength={maxForgotPasswordCodeLength}
      />
    );
  }

  if (screen.value === 'confirmSignUpWithCode' && onConfirmSignUpWithCode) {
    return (
      <AuthConfirmSignUpWithCode
        onConfirmSignUpWithCode={notificationsWrapper(onConfirmSignUpWithCode)}
        email={screen.context.email}
      />
    );
  }

  if (screen.value === 'confirmSignUpCheckEmail' && onConfirmSignUpCheckEmail) {
    return (
      <AuthConfirmSignUpCheckEmail
        onConfirmSignUpCheckEmail={onConfirmSignUpCheckEmail}
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
  (AuthPropsWithScreen | AuthPropsWithInitialScreen) & {
    layout?: AuthLayout;
  };

export const Auth = (props: AuthProps) => {
  const { layout = { fullScreen: true } } = props;

  // Use provided screen/setScreen or create them from initialScreen
  const authScreenHook = useAuthScreen(props.initialScreen);
  const screen = props.screen ?? authScreenHook.screen;
  const setScreen = props.setScreen ?? authScreenHook.setScreen;

  const withLogoNode = React.useMemo(() => {
    return (
      <LogoProvider logo={props.logo}>
        <ErrorBoundary>
          <AuthLogic
            screen={screen}
            setScreen={setScreen}
            signUpTerms={props.signUpTerms}
            passwordMinimumLength={props.passwordMinimumLength}
            maxForgotPasswordCodeLength={props.maxForgotPasswordCodeLength}
            onSignIn={props.onSignIn}
            onSignUp={props.onSignUp}
            onConfirmSignUpCheckEmail={props.onConfirmSignUpCheckEmail}
            onConfirmSignUpWithCode={props.onConfirmSignUpWithCode}
            onForgotPassword={props.onForgotPassword}
            onForgotPasswordResetPassword={props.onForgotPasswordResetPassword}
          />
        </ErrorBoundary>
      </LogoProvider>
    );
  }, [props, screen, setScreen]);

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
