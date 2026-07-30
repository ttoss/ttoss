import {
  ACCEPTED,
  type EmailAuthRuntime,
  error,
  ok,
  readEmail,
  readString,
} from './emailAuthRuntime';
import type {
  EmailAuthHandler,
  EmailAuthUser,
  StoredOneTimeToken,
} from './emailAuthTypes';
import type { AuthHttpResponse } from './oauthServerTypes';
import { verifyOneTimeToken } from './oneTimeToken';

/**
 * The `emailCode` mode: a short numeric code mailed to the user, who types it
 * back. Unlike the link flows, the code is looked up by address rather than by
 * its own hash — a wrong guess hashes to nothing on record, so there would
 * otherwise be no row to charge the failed attempt to, and the bounded attempt
 * count is the only thing standing between ~20 bits of entropy and a
 * brute-force.
 */

const INVALID_CODE = 'This code is not valid.';

/**
 * Charges a wrong guess to the stored code, destroying it once the allowance is
 * spent — refusing while the record lives would let an attacker keep guessing
 * until it expired.
 */
const chargeFailedAttempt = async (args: {
  runtime: EmailAuthRuntime;
  stored: StoredOneTimeToken;
}): Promise<AuthHttpResponse> => {
  const tokenStore = args.runtime.options.oneTimeTokenStore;
  const { tokenHash } = args.stored;

  if ((args.stored.attempts ?? 0) + 1 >= args.runtime.maxAttempts) {
    await tokenStore.delete({ tokenHash, purpose: 'emailCode' });

    return error(
      429,
      'too_many_attempts',
      'Too many incorrect attempts. Request a new code.'
    );
  }

  await tokenStore.incrementAttempts?.({ tokenHash, purpose: 'emailCode' });

  return error(401, 'invalid_token', INVALID_CODE);
};

/**
 * Resolves the account behind a redeemed code, creating it when the mode
 * doubles as sign-up. A code that outlived its user row must not silently
 * recreate the account when sign-up is disabled.
 */
const resolveUser = async (args: {
  runtime: EmailAuthRuntime;
  email: string;
}): Promise<EmailAuthUser | undefined> => {
  const { userStore, hooks } = args.runtime.options;

  const existing = await userStore.findByEmail(args.email);

  if (existing) {
    return existing.emailVerified
      ? existing
      : await userStore.update({ id: existing.id, emailVerified: true });
  }

  if (!args.runtime.createUserOnVerify) {
    return undefined;
  }

  /**
   * A code-only account has no password to store; the address itself, proven by
   * the code, is the credential.
   */
  const created = await userStore.create({
    email: args.email,
    passwordHash: null,
    emailVerified: true,
  });

  await hooks?.onUserCreated?.(created);

  return created;
};

export const createEmailCodeHandlers = (
  runtime: EmailAuthRuntime
): { sendEmailCode: EmailAuthHandler; verifyEmailCode: EmailAuthHandler } => {
  const { options, createUserOnVerify } = runtime;
  const { userStore, oneTimeTokenStore: tokenStore } = options;

  const sendEmailCode: EmailAuthHandler = async (request) => {
    const email = readEmail(request);

    if (email === undefined) {
      return error(400, 'invalid_request', 'A valid email is required.');
    }

    /**
     * Before the lookup, so the verdict depends only on the address — see
     * `createCheckRequestRate`.
     */
    const limited = await runtime.checkRequestRate({
      email,
      purpose: 'emailCode',
    });

    if (limited) {
      return limited;
    }

    const user = await userStore.findByEmail(email);

    if (user || createUserOnVerify) {
      await runtime.issueToken({
        purpose: 'emailCode',
        email,
        user: user ?? null,
      });
    }

    return ACCEPTED;
  };

  const verifyEmailCode: EmailAuthHandler = async (request) => {
    const email = readEmail(request);
    const code = readString(request, 'code');

    if (email === undefined || code === undefined) {
      return error(400, 'invalid_request', 'email and code are required.');
    }

    const stored = await tokenStore.findByEmail?.({
      email,
      purpose: 'emailCode',
    });

    if (!stored) {
      return error(401, 'invalid_token', INVALID_CODE);
    }

    if (stored.expires.getTime() <= Date.now()) {
      await tokenStore.delete({
        tokenHash: stored.tokenHash,
        purpose: 'emailCode',
      });

      return error(401, 'expired_token', 'This code has expired.');
    }

    if (
      !verifyOneTimeToken({
        token: code,
        tokenHash: stored.tokenHash,
        expires: stored.expires,
      })
    ) {
      return chargeFailedAttempt({ runtime, stored });
    }

    await tokenStore.delete({
      tokenHash: stored.tokenHash,
      purpose: 'emailCode',
    });

    const user = await resolveUser({ runtime, email });

    if (!user) {
      return error(401, 'invalid_token', INVALID_CODE);
    }

    return ok(await runtime.buildSession(user));
  };

  return { sendEmailCode, verifyEmailCode };
};
