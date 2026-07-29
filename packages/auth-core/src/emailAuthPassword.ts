import {
  compareAgainstDecoy,
  type EmailAuthRuntime,
  error,
  ok,
  readEmail,
  readString,
} from './emailAuthRuntime';
import type { EmailAuthHandler } from './emailAuthTypes';
import { comparePassword, hashPassword, needsRehash } from './hash';

/**
 * The `password` mode: sign-up and sign-in with a stored password hash.
 */

const INVALID_CREDENTIALS = 'Invalid email or password.';

export const createPasswordHandlers = (
  runtime: EmailAuthRuntime
): { signUp: EmailAuthHandler; signIn: EmailAuthHandler } => {
  const { options, passwordMinLength, signInOnSignUp } = runtime;
  const { userStore, hooks } = options;

  const signUp: EmailAuthHandler = async (request) => {
    const email = readEmail(request);
    const password = readString(request, 'password');

    if (email === undefined) {
      return error(400, 'invalid_request', 'A valid email is required.');
    }

    if (password === undefined) {
      return error(400, 'invalid_request', 'password is required.');
    }

    if (password.length < passwordMinLength) {
      return error(
        400,
        'password_too_weak',
        `password must be at least ${passwordMinLength} characters.`
      );
    }

    if (await userStore.findByEmail(email)) {
      return error(
        409,
        'email_exists',
        'An account with this email already exists.'
      );
    }

    const user = await userStore.create({
      email,
      passwordHash: await hashPassword(password),
      emailVerified: false,
    });

    await hooks?.onUserCreated?.(user);

    if (options.modes.includes('emailVerification')) {
      await runtime.issueToken({ purpose: 'emailVerification', email, user });
    }

    if (!signInOnSignUp) {
      return {
        status: 201,
        body: { message: 'Account created. Check your email to confirm it.' },
      };
    }

    return { status: 201, body: await runtime.buildSession(user) };
  };

  const signIn: EmailAuthHandler = async (request) => {
    const email = readEmail(request);
    const password = readString(request, 'password');

    if (email === undefined || password === undefined) {
      return error(400, 'invalid_request', 'email and password are required.');
    }

    const user = await userStore.findByEmail(email);

    /**
     * The unknown-address and no-password cases both do the decoy compare, so
     * neither is distinguishable from a wrong password by response time.
     */
    if (!user?.passwordHash) {
      await compareAgainstDecoy(password);

      return error(401, 'invalid_credentials', INVALID_CREDENTIALS);
    }

    if (!(await comparePassword(password, user.passwordHash))) {
      return error(401, 'invalid_credentials', INVALID_CREDENTIALS);
    }

    /**
     * Checked after the password so an unconfirmed address is never disclosed
     * to someone who does not hold the credential.
     */
    if (options.password?.requireVerifiedEmail && !user.emailVerified) {
      return error(
        403,
        'email_not_verified',
        'Confirm your email address before signing in.'
      );
    }

    if (needsRehash(user.passwordHash)) {
      await userStore.update({
        id: user.id,
        passwordHash: await hashPassword(password),
      });
    }

    return ok(await runtime.buildSession(user));
  };

  return { signUp, signIn };
};
