import { createEmailCodeHandlers } from './emailAuthCode';
import {
  createEmailVerificationHandler,
  createMagicLinkHandlers,
  createPasswordResetHandlers,
} from './emailAuthLink';
import { createPasswordHandlers } from './emailAuthPassword';
import { createEmailAuthRuntime } from './emailAuthRuntime';
import type { EmailAuthHandlers, EmailAuthOptions } from './emailAuthTypes';

export {
  type EmailAuthErrorCode,
  emailAuthErrorCodes,
  normalizeEmail,
} from './emailAuthRuntime';

/**
 * Runner-agnostic engine for the email and password credential flows —
 * password sign-up and sign-in, magic links, mailed numeric codes, address
 * confirmation and password reset.
 *
 * It owns the security mechanics and nothing else: persistence arrives as
 * stores, session minting as `issueSession`, and mail delivery as `sendEmail`,
 * so the package carries no database and no mail-transport dependency. Mount it
 * with an adapter — `emailAuth()` from `@ttoss/http-server-auth` for Koa.
 *
 * `modes` decides which handlers exist, so an application that only signs users
 * in with a mailed code never exposes a password endpoint. A configuration that
 * cannot be served safely throws here, at startup, rather than on a request.
 *
 * @example
 * ```typescript
 * const handlers = createEmailAuthHandlers({
 *   modes: ['emailCode'],
 *   userStore,
 *   oneTimeTokenStore,
 *   issueSession: (user) => issueSession(user),
 *   sendEmail: async ({ to, token }) => ses.send(buildCodeEmail(to, token)),
 * });
 * ```
 */
export const createEmailAuthHandlers = (
  options: EmailAuthOptions
): EmailAuthHandlers => {
  const runtime = createEmailAuthRuntime(options);

  const handlers: EmailAuthHandlers = {
    paths: runtime.paths,
    modes: [...options.modes],
  };

  if (options.modes.includes('password')) {
    const { signUp, signIn } = createPasswordHandlers(runtime);

    handlers.signUp = signUp;
    handlers.signIn = signIn;
  }

  if (options.modes.includes('magicLink')) {
    const { sendMagicLink, verifyMagicLink } = createMagicLinkHandlers(runtime);

    handlers.sendMagicLink = sendMagicLink;
    handlers.verifyMagicLink = verifyMagicLink;
  }

  if (options.modes.includes('emailCode')) {
    const { sendEmailCode, verifyEmailCode } = createEmailCodeHandlers(runtime);

    handlers.sendEmailCode = sendEmailCode;
    handlers.verifyEmailCode = verifyEmailCode;
  }

  if (options.modes.includes('emailVerification')) {
    handlers.verifyEmail = createEmailVerificationHandler(runtime);
  }

  if (options.modes.includes('passwordReset')) {
    const { requestPasswordReset, resetPassword } =
      createPasswordResetHandlers(runtime);

    handlers.requestPasswordReset = requestPasswordReset;
    handlers.resetPassword = resetPassword;
  }

  return handlers;
};
