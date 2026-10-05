import type { useAuthScreen } from '@ttoss/react-auth-core';
import { defineMessages } from '@ttoss/react-i18n';
import type { useNotifications } from '@ttoss/react-notifications';

import type { Emit } from './authEvents';

export const messages = defineMessages({
  signedInSuccessfully: {
    defaultMessage: 'Signed in successfully',
    description: 'Success notification after sign in.',
  },
  resetPasswordRequired: {
    defaultMessage:
      "For your security, please reset your password using 'Forgot password?' before continuing.",
    description: 'Shown when Cognito requires a password reset on sign in.',
  },
  incorrectCredentials: {
    defaultMessage: 'Incorrect email or password.',
    description: 'Shown when the user enters wrong sign-in credentials.',
  },
  userNotFound: {
    defaultMessage: 'No account found with this email address.',
    description: 'Shown when no Cognito user exists for the given email.',
  },
  codeMismatch: {
    defaultMessage: 'The code you entered is incorrect. Please try again.',
    description: 'Shown when the user types a wrong confirmation code.',
  },
  usernameExists: {
    defaultMessage:
      'An account with this email already exists. Please sign in.',
    description: 'Shown when a user tries to sign up with an existing email.',
  },
  sessionExpired: {
    defaultMessage: 'Your session expired. Please sign in again.',
    description: 'Shown when a stale Amplify session is detected.',
  },
  unverifiedAccount: {
    defaultMessage:
      'Your account is not verified. Please contact support to verify your account before resetting your password.',
    description:
      'Shown on forgot-password when the account has no verified email.',
  },
  genericError: {
    defaultMessage: 'Something went wrong. Please try again.',
    description: 'Fallback message for unexpected authentication errors.',
  },
});

const USER_ERROR_NAMES = new Set([
  'NotAuthorizedException',
  'UserNotFoundException',
  'CodeMismatchException',
]);

export const isUserError = (error: { name?: string }) => {
  return Boolean(error.name && USER_ERROR_NAMES.has(error.name));
};

export type Fm = (m: { defaultMessage: string }) => string;

export const signInErrorMessage = (name: string | undefined, fm: Fm) => {
  if (name === 'NotAuthorizedException')
    return fm(messages.incorrectCredentials);
  if (name === 'UserNotFoundException') return fm(messages.userNotFound);
  return fm(messages.genericError);
};

export const confirmCodeErrorMessage = (name: string | undefined, fm: Fm) => {
  return name === 'CodeMismatchException'
    ? fm(messages.codeMismatch)
    : fm(messages.genericError);
};

export const forgotPasswordErrorMessage = (
  name: string | undefined,
  fm: Fm
) => {
  return name === 'UserNotFoundException'
    ? fm(messages.userNotFound)
    : fm(messages.genericError);
};

export type HandlerDeps = {
  onError?: (error: Error) => void;
  emit: Emit;
  autoSignInAfterSignUp?: boolean;
  fm: Fm;
  setScreen: ReturnType<typeof useAuthScreen>['setScreen'];
  addNotification: ReturnType<typeof useNotifications>['addNotification'];
};
