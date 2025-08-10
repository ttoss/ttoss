import { Flex } from '@ttoss/ui';
import * as React from 'react';

import { LogoContextProps, LogoProvider } from './AuthCard';
import { AuthConfirmSignUp } from './AuthConfirmSignUp';
import { AuthForgotPassword } from './AuthForgotPassword';
import { AuthForgotPasswordResetPassword } from './AuthForgotPasswordResetPassword';
import { AuthFullScreen } from './AuthFullScreen';
import { AuthSignIn } from './AuthSignIn';
import { AuthSignUp } from './AuthSignUp';
import { ErrorBoundary } from './ErrorBoundary';
import type {
  AuthScreen,
  OnConfirmSignUp,
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
  onConfirmSignUp?: OnConfirmSignUp;
  onForgotPassword?: OnForgotPassword;
  onForgotPasswordResetPassword?: OnForgotPasswordResetPassword;
};

const AuthLogic = (props: AuthLogicProps) => {
  const onGoToSignIn = () => {
    props.setScreen({ value: 'signIn', context: {} });
  };

  const onGoToSignUp = React.useCallback(() => {
    if (!props.onSignUp) {
      return undefined;
    }

    props.setScreen({ value: 'signUp', context: {} });
  }, [props]);

  const onGoToForgotPassword = React.useCallback(() => {
    if (!props.onForgotPassword) {
      return undefined;
    }

    props.setScreen({ value: 'forgotPassword', context: {} });
  }, [props]);

  if (props.screen.value === 'signIn') {
    return (
      <AuthSignIn
        onSignIn={props.onSignIn}
        onGoToSignUp={onGoToSignUp}
        onGoToForgotPassword={onGoToForgotPassword}
        passwordMinimumLength={props.passwordMinimumLength}
      />
    );
  }

  if (props.screen.value === 'signUp' && props.onSignUp) {
    return (
      <AuthSignUp
        onSignUp={props.onSignUp}
        passwordMinimumLength={props.passwordMinimumLength}
        onGoToSignIn={onGoToSignIn}
        signUpTerms={props.signUpTerms}
      />
    );
  }

  if (props.screen.value === 'forgotPassword' && props.onForgotPassword) {
    return (
      <AuthForgotPassword
        onForgotPassword={props.onForgotPassword}
        onGoToSignIn={onGoToSignIn}
        onGoToSignUp={onGoToSignUp}
      />
    );
  }

  if (
    props.screen.value === 'confirmResetPassword' &&
    props.onForgotPasswordResetPassword
  ) {
    return (
      <AuthForgotPasswordResetPassword
        onForgotPasswordResetPassword={props.onForgotPasswordResetPassword}
        onGoToSignIn={onGoToSignIn}
        email={props.screen.context.email}
      />
    );
  }

  if (props.screen.value === 'confirmSignUp' && props.onConfirmSignUp) {
    return (
      <AuthConfirmSignUp
        onConfirmSignUp={props.onConfirmSignUp}
        email={props.screen.context.email}
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
    initialScreen?: AuthScreen;
  };

export const Auth = (props: AuthProps) => {
  const { layout = { fullScreen: true } } = props;

  const withLogoNode = React.useMemo(() => {
    return (
      <LogoProvider logo={props.logo}>
        <ErrorBoundary>
          <AuthLogic signUpTerms={props.signUpTerms} />
        </ErrorBoundary>
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
