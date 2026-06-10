import {
  buildDeps,
  forgotPassword,
  resetPassword,
  sendMagicLink,
  setPasswordForUser,
  signIn,
  signUp,
  verifyEmail,
  verifyMagicLink,
} from './methods';
import type { AuthFlowsConfig, AuthFlowsUser } from './types';

export type {
  AuthFlowErrorCodeType,
  AuthFlowsConfig,
  AuthFlowsUser,
  EmailSender,
  OneTimeTokenStore,
  UserStore,
} from './types';
export { AuthFlowError, AuthFlowErrorCode } from './types';

export const createAuthFlows = (config: AuthFlowsConfig) => {
  const deps = buildDeps(config);
  return {
    sendMagicLink: (args: { email: string }) => {
      return sendMagicLink(args, deps);
    },
    verifyMagicLink: (args: { email: string; token: string }) => {
      return verifyMagicLink(args, deps);
    },
    signUp: (args: { email: string; password: string }) => {
      return signUp(args, deps);
    },
    verifyEmail: (args: { email: string; token: string }) => {
      return verifyEmail(args, deps);
    },
    signIn: (args: { email: string; password: string }) => {
      return signIn(args, deps);
    },
    forgotPassword: (args: { email: string }) => {
      return forgotPassword(args, deps);
    },
    resetPassword: (args: {
      email: string;
      token: string;
      newPassword: string;
    }) => {
      return resetPassword(args, deps);
    },
    setPasswordForUser: (args: {
      user: AuthFlowsUser;
      currentPassword?: string;
      newPassword: string;
    }) => {
      return setPasswordForUser(args, deps);
    },
  };
};
