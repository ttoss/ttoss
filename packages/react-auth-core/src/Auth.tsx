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
  OnSocialSignIn,
  SignUpTerms,
  SocialProvider,
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
  socialProviders?: SocialProvider[];
  onSocialSignIn?: OnSocialSignIn;
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
  /** Federated identity providers to offer on the sign-in and sign-up screens. */
  socialProviders?: SocialProvider[];
  onSocialSignIn?: OnSocialSignIn;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotificationsWrapper = (fn: any) => any;

type ScreenProps = AuthLogicProps & {
  wrap: NotificationsWrapper;
  onGoToSignIn: () => void;
  onGoToSignUp: () => void;
  onGoToForgotPassword: () => void;
  // Wrapped once here rather than at each call site: it is passed to two
  // screens, and wrapping twice would make it two different functions.
  wrappedSocialSignIn?: OnSocialSignIn;
};

const AuthPrimaryScreens = (props: ScreenProps) => {
  const { screen, onSignUp, onForgotPassword, wrap } = props;

  if (screen.value === 'signIn') {
    return (
      <AuthSignIn
        onSignIn={wrap(props.onSignIn)}
        onGoToSignUp={onSignUp && props.onGoToSignUp}
        onGoToForgotPassword={onForgotPassword && props.onGoToForgotPassword}
        passwordMinimumLength={props.passwordMinimumLength}
        socialProviders={props.socialProviders}
        onSocialSignIn={props.wrappedSocialSignIn}
      />
    );
  }

  if (screen.value === 'signUp' && onSignUp) {
    return (
      <AuthSignUp
        onSignUp={wrap(onSignUp)}
        passwordMinimumLength={props.passwordMinimumLength}
        onGoToSignIn={props.onGoToSignIn}
        signUpTerms={props.signUpTerms}
        socialProviders={props.socialProviders}
        onSocialSignIn={props.wrappedSocialSignIn}
      />
    );
  }

  return null;
};

const AuthPasswordRecoveryScreens = (props: ScreenProps) => {
  const { screen, onSignUp, onForgotPassword, wrap } = props;

  if (screen.value === 'forgotPassword' && onForgotPassword) {
    return (
      <AuthForgotPassword
        onForgotPassword={wrap(onForgotPassword)}
        onGoToSignIn={props.onGoToSignIn}
        onGoToSignUp={onSignUp && props.onGoToSignUp}
      />
    );
  }

  if (
    screen.value === 'confirmResetPassword' &&
    props.onForgotPasswordResetPassword
  ) {
    return (
      <AuthForgotPasswordResetPassword
        onForgotPasswordResetPassword={wrap(
          props.onForgotPasswordResetPassword
        )}
        onGoToSignIn={props.onGoToSignIn}
        email={screen.context.email}
        maxCodeLength={props.maxForgotPasswordCodeLength}
      />
    );
  }

  return null;
};

const AuthConfirmSignUpScreens = (props: ScreenProps) => {
  const { screen, onConfirmSignUpWithCode, onConfirmSignUpCheckEmail } = props;

  if (screen.value === 'confirmSignUpWithCode' && onConfirmSignUpWithCode) {
    return (
      <AuthConfirmSignUpWithCode
        onConfirmSignUpWithCode={props.wrap(onConfirmSignUpWithCode)}
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

const AuthLogic = (props: AuthLogicProps) => {
  const { screen, setScreen, onSignUp, onForgotPassword, onSocialSignIn } =
    props;

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
  const wrap = (fn: any) => {
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

  const screenProps: ScreenProps = {
    ...props,
    wrap,
    onGoToSignIn,
    onGoToSignUp,
    onGoToForgotPassword,
    wrappedSocialSignIn: onSocialSignIn && wrap(onSocialSignIn),
  };

  return (
    <>
      <AuthPrimaryScreens {...screenProps} />
      <AuthPasswordRecoveryScreens {...screenProps} />
      <AuthConfirmSignUpScreens {...screenProps} />
    </>
  );
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
            socialProviders={props.socialProviders}
            onSocialSignIn={props.onSocialSignIn}
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
