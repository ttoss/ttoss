import * as React from 'react';
import { Auth as AmplifyAuth } from 'aws-amplify';
import { AuthConfirmSignUp } from './AuthConfirmSignUp';
import { AuthFullScreen } from './AuthFullScreen';
import { AuthSignIn } from './AuthSignIn';
import { AuthSignUp } from './AuthSignUp';
import { LogoContextProps, LogoProvider } from './AuthCard';
import { assign, createMachine } from 'xstate';
import { useAuth } from './AuthProvider';
import { useMachine } from '@xstate/react';
import { useNotifications } from '@ttoss/react-notifications';
import type { OnConfirmSignUp, OnSignIn, OnSignUp } from './types';

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
    };

type AuthEvent =
  | { type: 'SIGN_UP' }
  | { type: 'SIGN_UP_CONFIRM'; email: string }
  | { type: 'SIGN_UP_CONFIRMED'; email: string }
  | { type: 'SIGN_UP_RESEND_CONFIRMATION'; email: string }
  | { type: 'RETURN_TO_SIGN_IN' };

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
    },
  },
  {
    actions: {
      assignEmail: assign({
        email: (_, event) => {
          return (event as any).email;
        },
      }),
    },
  }
);

const AuthLogic = () => {
  const { isAuthenticated } = useAuth();

  const [state, send] = useMachine(authMachine);

  const { setLoading } = useNotifications();

  const onSignIn = React.useCallback<OnSignIn>(
    async ({ email, password }) => {
      try {
        setLoading(true);
        await AmplifyAuth.signIn(email, password);
        // toast('Signed In');
      } catch (error) {
        switch ((error as any).code) {
          case 'UserNotConfirmedException':
            await AmplifyAuth.resendSignUp(email);
            send({ type: 'SIGN_UP_RESEND_CONFIRMATION', email } as any);
            break;
          default:
          // toast(JSON.stringify(error, null, 2));
        }
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading]
  );

  const onSignUp = React.useCallback<OnSignUp>(
    async ({ email, password }) => {
      try {
        setLoading(true);
        await AmplifyAuth.signUp({
          username: email,
          password,
          attributes: { email },
        });
        // toast('Signed Up');
        send({ type: 'SIGN_UP_CONFIRM', email } as any);
      } catch (error) {
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading]
  );

  const onConfirmSignUp = React.useCallback<OnConfirmSignUp>(
    async ({ email, code }) => {
      try {
        setLoading(true);
        await AmplifyAuth.confirmSignUp(email, code);
        // toast('Confirmed Signed In');
        send({ type: 'SIGN_UP_CONFIRMED', email } as any);
      } catch (error) {
        // toast(JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    },
    [send, setLoading]
  );

  const onReturnToSignIn = React.useCallback(() => {
    send({ type: 'RETURN_TO_SIGN_IN' });
  }, [send]);

  if (isAuthenticated) {
    return null;
  }

  if (state.matches('signUp')) {
    return (
      <AuthSignUp onSignUp={onSignUp} onReturnToSignIn={onReturnToSignIn} />
    );
  }

  if (state.matches('signUpConfirm')) {
    return (
      <AuthConfirmSignUp
        onConfirmSignUp={onConfirmSignUp}
        email={(state.context as any).email}
      />
    );
  }

  return (
    <AuthSignIn
      onSignIn={onSignIn}
      onSignUp={() => {
        return send('SIGN_UP');
      }}
      defaultValues={{ email: (state.context as any).email }}
    />
  );
};

type AuthProps = LogoContextProps & {
  fullScreen?: boolean;
};

export const Auth = ({ logo, fullScreen = true }: AuthProps) => {
  const withLogoNode = React.useMemo(() => {
    return (
      <LogoProvider logo={logo}>
        <AuthLogic />
      </LogoProvider>
    );
  }, [logo]);

  if (fullScreen) {
    return <AuthFullScreen>{withLogoNode}</AuthFullScreen>;
  }

  return withLogoNode;
};
