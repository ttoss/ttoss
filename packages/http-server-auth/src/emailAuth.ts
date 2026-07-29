import {
  createEmailAuthHandlers,
  type EmailAuthHandler,
  type EmailAuthOptions,
} from '@ttoss/auth-core';
import { type Context, Router } from '@ttoss/http-server';

import { applyResponse, toAuthRequest } from './koaAdapter';

/**
 * The credential-flow option types and the runner-agnostic engine live in
 * `@ttoss/auth-core`; this is the Koa adapter that mounts it on an
 * `@ttoss/http-server` app. Re-exported so a consumer needs a single import.
 */
export {
  createEmailAuthHandlers,
  type EmailAuthDelivery,
  type EmailAuthErrorCode,
  emailAuthErrorCodes,
  type EmailAuthHandler,
  type EmailAuthHandlers,
  type EmailAuthHooks,
  type EmailAuthMode,
  type EmailAuthOptions,
  type EmailAuthPaths,
  type EmailAuthSession,
  type EmailAuthTtl,
  type EmailAuthUser,
  type EmailAuthUserStore,
  type EmailCodeOptions,
  normalizeEmail,
  type OneTimeTokenPurpose,
  type OneTimeTokenStore,
  type PasswordOptions,
  type RequestRateLimit,
  type RequestRateLimitStore,
  type StoredOneTimeToken,
} from '@ttoss/auth-core';

/**
 * Mounts the email and password credential flows as a Koa `Router`, adapting
 * the runner-agnostic engine from `@ttoss/auth-core`. Which routes appear is
 * decided by `modes`, so an app that only signs users in with a mailed code
 * never exposes a password endpoint.
 *
 * Every route is a `POST`, including the link redemptions: the token arrives in
 * the body from the page the user landed on, which keeps it out of server logs
 * and out of the `Referer` header. The engine also reads a token from the query
 * string, so a `GET` redemption can be added by an application that wants one.
 *
 * Mount it **before** `authMiddleware`, or exempt its paths — the sign-in
 * routes are what a client calls precisely because it has no token yet.
 *
 * @example
 * ```typescript
 * import { App, bodyParser } from '@ttoss/http-server';
 * import { emailAuth } from '@ttoss/http-server-auth';
 *
 * const app = new App();
 * app.use(bodyParser());
 * app.use(
 *   emailAuth({
 *     modes: ['emailCode'],
 *     userStore,
 *     oneTimeTokenStore,
 *     issueSession: (user) => issueSession(user),
 *     sendEmail: async ({ to, token }) => {
 *       await ses.send(buildCodeEmail({ to, code: token }));
 *     },
 *   }).routes()
 * );
 * ```
 */
export const emailAuth = (
  options: EmailAuthOptions & {
    /**
     * Prefix applied to every mounted path, e.g. `/v1`. Useful when the app
     * versions its API and the engine's default paths are otherwise fine.
     */
    prefix?: string;
  }
): Router => {
  const handlers = createEmailAuthHandlers(options);
  const router = new Router();

  const prefix = options.prefix ?? '';

  const mount = (path: string, handler: EmailAuthHandler | undefined): void => {
    if (!handler) {
      return;
    }

    router.post(`${prefix}${path}`, async (ctx: Context) => {
      applyResponse(ctx, await handler(toAuthRequest(ctx)));
    });
  };

  mount(handlers.paths.signUp, handlers.signUp);
  mount(handlers.paths.signIn, handlers.signIn);
  mount(handlers.paths.sendMagicLink, handlers.sendMagicLink);
  mount(handlers.paths.verifyMagicLink, handlers.verifyMagicLink);
  mount(handlers.paths.sendEmailCode, handlers.sendEmailCode);
  mount(handlers.paths.verifyEmailCode, handlers.verifyEmailCode);
  mount(handlers.paths.verifyEmail, handlers.verifyEmail);
  mount(handlers.paths.requestPasswordReset, handlers.requestPasswordReset);
  mount(handlers.paths.resetPassword, handlers.resetPassword);

  return router;
};
