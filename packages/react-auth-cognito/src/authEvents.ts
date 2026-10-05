import type { AuthScreen } from '@ttoss/react-auth-core';
import * as React from 'react';

/**
 * An authentication step the user attempted. `autoSignIn` is the sign-in that
 * follows a confirmed sign-up when `autoSignInAfterSignUp` is on.
 */
export type AuthAction =
  | 'signIn'
  | 'signUp'
  | 'confirmSignUp'
  | 'autoSignIn'
  | 'forgotPassword'
  | 'confirmResetPassword'
  | 'socialSignIn';

/**
 * What `onAuthEvent` receives. It never carries the email, password or code
 * the user typed, so a consumer can forward it to analytics as is.
 */
export type AuthEvent =
  | { type: 'screenViewed'; screen: AuthScreen['value'] }
  | {
      type: 'actionSucceeded';
      action: AuthAction;
      /** Amplify's `nextStep` when the action returns one, e.g. `CONFIRM_SIGN_UP`. */
      nextStep?: string;
    }
  | {
      type: 'actionFailed';
      action: AuthAction;
      /** The Cognito error name, e.g. `NotAuthorizedException`. */
      errorName: string;
    };

export type Emit = (event: AuthEvent) => void;

export const errorNameOf = (error: unknown) => {
  return (error as { name?: string } | undefined)?.name || 'Error';
};

/**
 * Holds the latest `onAuthEvent` in a ref so an inline callback from the
 * consumer neither re-creates every handler nor re-fires `screenViewed` on
 * each render.
 */
export const useAuthEventEmitter = ({
  onAuthEvent,
  screen,
}: {
  onAuthEvent?: (event: AuthEvent) => void;
  screen: AuthScreen['value'];
}): Emit => {
  const onAuthEventRef = React.useRef(onAuthEvent);

  React.useEffect(() => {
    onAuthEventRef.current = onAuthEvent;
  }, [onAuthEvent]);

  const emit = React.useCallback<Emit>((event) => {
    onAuthEventRef.current?.(event);
  }, []);

  React.useEffect(() => {
    emit({ type: 'screenViewed', screen });
  }, [emit, screen]);

  return emit;
};
