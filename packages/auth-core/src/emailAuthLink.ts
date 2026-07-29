import {
  ACCEPTED,
  type EmailAuthRuntime,
  error,
  type LinkPurpose,
  ok,
  readEmail,
  readString,
} from './emailAuthRuntime';
import type { EmailAuthHandler } from './emailAuthTypes';
import { hashPassword } from './hash';

/**
 * The three link-carrying modes — `magicLink`, `emailVerification` and
 * `passwordReset`. All of them mint a high-entropy token, mail it inside a URL,
 * and redeem it by hash, which is why a wrong token matches no record at all.
 */

/**
 * Builds the "mail me a link" half of a flow. The acknowledgement is identical
 * whether or not the address is on file, so it cannot be used to enumerate
 * accounts.
 */
const createSendHandler = (args: {
  runtime: EmailAuthRuntime;
  purpose: LinkPurpose;
}): EmailAuthHandler => {
  return async (request) => {
    const email = readEmail(request);

    if (email === undefined) {
      return error(400, 'invalid_request', 'A valid email is required.');
    }

    const user = await args.runtime.options.userStore.findByEmail(email);

    if (user) {
      await args.runtime.issueToken({ purpose: args.purpose, email, user });
    }

    return ACCEPTED;
  };
};

export const createMagicLinkHandlers = (
  runtime: EmailAuthRuntime
): { sendMagicLink: EmailAuthHandler; verifyMagicLink: EmailAuthHandler } => {
  const { userStore } = runtime.options;

  const verifyMagicLink: EmailAuthHandler = async (request) => {
    const result = await runtime.redeemLinkToken({
      request,
      purpose: 'magicLink',
    });

    if ('response' in result) {
      return result.response;
    }

    /**
     * Holding the mailed token proves control of the address, so a previously
     * unconfirmed user is confirmed by redeeming it.
     */
    const user = result.user.emailVerified
      ? result.user
      : await userStore.update({ id: result.user.id, emailVerified: true });

    return ok(await runtime.buildSession(user));
  };

  return {
    sendMagicLink: createSendHandler({ runtime, purpose: 'magicLink' }),
    verifyMagicLink,
  };
};

export const createEmailVerificationHandler = (
  runtime: EmailAuthRuntime
): EmailAuthHandler => {
  return async (request) => {
    const result = await runtime.redeemLinkToken({
      request,
      purpose: 'emailVerification',
    });

    if ('response' in result) {
      return result.response;
    }

    const user = await runtime.options.userStore.update({
      id: result.user.id,
      emailVerified: true,
    });

    return ok(await runtime.buildSession(user));
  };
};

export const createPasswordResetHandlers = (
  runtime: EmailAuthRuntime
): {
  requestPasswordReset: EmailAuthHandler;
  resetPassword: EmailAuthHandler;
} => {
  const resetPassword: EmailAuthHandler = async (request) => {
    const password = readString(request, 'password');

    if (password === undefined) {
      return error(400, 'invalid_request', 'password is required.');
    }

    if (password.length < runtime.passwordMinLength) {
      return error(
        400,
        'password_too_weak',
        `password must be at least ${runtime.passwordMinLength} characters.`
      );
    }

    /**
     * The new password is validated first, so a rejected one leaves the token
     * unspent and the user can simply try again.
     */
    const result = await runtime.redeemLinkToken({
      request,
      purpose: 'passwordReset',
    });

    if ('response' in result) {
      return result.response;
    }

    /**
     * Completing a reset proves control of the address, so it confirms an
     * unverified one too — otherwise a user who never clicked the original
     * confirmation link could reset their password and still not sign in.
     */
    await runtime.options.userStore.update({
      id: result.user.id,
      passwordHash: await hashPassword(password),
      emailVerified: true,
    });

    return ok({ message: 'Password has been reset.' });
  };

  return {
    requestPasswordReset: createSendHandler({
      runtime,
      purpose: 'passwordReset',
    }),
    resetPassword,
  };
};
