import type { OnConfirmSignUpWithCode } from '@ttoss/react-auth-core';
import { autoSignIn, confirmSignUp } from 'aws-amplify/auth';
import * as React from 'react';

import { errorNameOf } from './authEvents';
import {
  confirmCodeErrorMessage,
  type HandlerDeps,
  isUserError,
  messages,
} from './authShared';

type Deps = Omit<HandlerDeps, 'autoSignInAfterSignUp'>;

const completeAutoSignIn = async ({
  emit,
  onError,
  fm,
  setScreen,
  addNotification,
}: Deps) => {
  try {
    const result = await autoSignIn();
    emit({
      type: 'actionSucceeded',
      action: 'autoSignIn',
      nextStep: result?.nextStep?.signInStep,
    });
    addNotification({
      viewType: 'toast',
      type: 'success',
      message: fm(messages.signedInSuccessfully),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // The account is confirmed either way, so the user is not stuck:
    // falling back to the sign-in screen is the pre-autoSignIn flow.
    emit({
      type: 'actionFailed',
      action: 'autoSignIn',
      errorName: errorNameOf(error),
    });
    onError?.(error);
    setScreen({ value: 'signIn' });
  }
};

export const useConfirmSignUpHandler = (deps: Deps) => {
  const { emit, onError, fm, setScreen, addNotification } = deps;

  return React.useCallback<OnConfirmSignUpWithCode>(
    async ({ email, code }) => {
      let signUpStep: string | undefined;
      try {
        const result = await confirmSignUp({
          confirmationCode: code,
          username: email,
        });
        signUpStep = result?.nextStep?.signUpStep;
        emit({
          type: 'actionSucceeded',
          action: 'confirmSignUp',
          nextStep: signUpStep,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        emit({
          type: 'actionFailed',
          action: 'confirmSignUp',
          errorName: errorNameOf(error),
        });
        if (!isUserError(error)) onError?.(error);
        addNotification({
          type: 'error',
          message: confirmCodeErrorMessage(error.name, fm),
        });
        return;
      }

      // Amplify only offers this step when `signUp` ran with `autoSignIn` in
      // this same browser session. A user confirming after reloading, or
      // after signing in with an unconfirmed account, gets `DONE` instead and
      // signs in by hand, as before.
      if (signUpStep !== 'COMPLETE_AUTO_SIGN_IN') {
        setScreen({ value: 'signIn' });
        return;
      }

      await completeAutoSignIn({
        emit,
        onError,
        fm,
        setScreen,
        addNotification,
      });
    },
    [emit, onError, fm, setScreen, addNotification]
  );
};
