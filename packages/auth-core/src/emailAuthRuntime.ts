import type {
  EmailAuthDelivery,
  EmailAuthOptions,
  EmailAuthPaths,
  EmailAuthSession,
  EmailAuthUser,
  OneTimeTokenPurpose,
} from './emailAuthTypes';
import { comparePassword, hashPassword } from './hash';
import type { AuthHttpRequest, AuthHttpResponse } from './oauthServerTypes';
import {
  generateOneTimeToken,
  hashOneTimeToken,
  verifyOneTimeToken,
} from './oneTimeToken';

/**
 * Shared plumbing behind the credential flows: option resolution, request
 * parsing, response shaping, and the one-time token lifecycle. The per-mode
 * handler factories (`./emailAuthPassword`, `./emailAuthLink`,
 * `./emailAuthCode`) build on the {@link EmailAuthRuntime} assembled here, so
 * each mode file holds only its own flow logic.
 */

const DEFAULT_PATHS: Required<EmailAuthPaths> = {
  signUp: '/auth/signup',
  signIn: '/auth/login',
  sendMagicLink: '/auth/magic-link',
  verifyMagicLink: '/auth/magic-link/verify',
  sendEmailCode: '/auth/code',
  verifyEmailCode: '/auth/code/verify',
  verifyEmail: '/auth/verify-email',
  requestPasswordReset: '/auth/password/reset-request',
  resetPassword: '/auth/password/reset',
};

const DEFAULT_LINK_PATHS = {
  magicLink: '/auth/callback',
  emailVerification: '/auth/verify-email',
  passwordReset: '/auth/reset-password',
};

const DEFAULT_TTL = {
  magicLink: 60 * 60 * 24,
  emailCode: 60 * 10,
  emailVerification: 60 * 60 * 24,
  passwordReset: 60 * 60,
} satisfies Record<OneTimeTokenPurpose, number>;

const DEFAULT_PASSWORD_MIN_LENGTH = 8;

const DEFAULT_CODE_DIGITS = 6;

const DEFAULT_MAX_ATTEMPTS = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Purposes whose token travels inside a link rather than as a typed code. */
export type LinkPurpose = Exclude<OneTimeTokenPurpose, 'emailCode'>;

/**
 * Error codes a handler can return. Stable strings, so a client can branch on
 * them without parsing prose.
 */
export const emailAuthErrorCodes = [
  'invalid_request',
  'invalid_credentials',
  'email_exists',
  'invalid_token',
  'expired_token',
  'too_many_attempts',
  'email_not_verified',
  'password_too_weak',
] as const;

export type EmailAuthErrorCode = (typeof emailAuthErrorCodes)[number];

export const error = (
  status: number,
  code: EmailAuthErrorCode,
  message: string
): AuthHttpResponse => {
  return { status, body: { error: { code, message } } };
};

export const ok = (body: unknown): AuthHttpResponse => {
  return { status: 200, body };
};

/**
 * Enumeration-safe acknowledgement. Every "mail me something" endpoint returns
 * this whether or not the address is on file, so the response cannot be used to
 * discover who has an account.
 */
export const ACCEPTED: AuthHttpResponse = {
  status: 200,
  body: { message: 'If the address is registered, an email has been sent.' },
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Reads a field from the body, falling back to the query string so a link
 * redemption works whether the token arrives in either.
 */
export const readString = (
  request: AuthHttpRequest,
  field: string
): string | undefined => {
  const fromBody = request.body?.[field];

  if (typeof fromBody === 'string' && fromBody.length > 0) {
    return fromBody;
  }

  const fromQuery = request.query?.[field];

  return typeof fromQuery === 'string' && fromQuery.length > 0
    ? fromQuery
    : undefined;
};

/** Reads and normalizes an email, returning `undefined` when it is malformed. */
export const readEmail = (request: AuthHttpRequest): string | undefined => {
  const email = readString(request, 'email');

  if (email === undefined) {
    return undefined;
  }

  const normalized = normalizeEmail(email);

  return EMAIL_PATTERN.test(normalized) ? normalized : undefined;
};

/**
 * A real hash to compare against when there is no stored credential, so the
 * unknown-address and no-password paths cost the same PBKDF2 work as a wrong
 * password and cannot be told apart by response time. Derived once per process
 * and never used to authenticate anything.
 */
let decoyHash: Promise<string> | undefined;

export const compareAgainstDecoy = async (
  plainPassword: string
): Promise<void> => {
  decoyHash ??= hashPassword('decoy');

  await comparePassword(plainPassword, await decoyHash);
};

/** The outcome of redeeming a link token: a response to return, or the user. */
export type RedeemedToken =
  { response: AuthHttpResponse } | { user: EmailAuthUser; email: string };

export type EmailAuthRuntime = {
  options: EmailAuthOptions;
  paths: Required<EmailAuthPaths>;
  passwordMinLength: number;
  signInOnSignUp: boolean;
  codeDigits: number;
  maxAttempts: number;
  createUserOnVerify: boolean;
  /** Mints, persists and mails a token, invalidating any it supersedes. */
  issueToken: (args: {
    purpose: OneTimeTokenPurpose;
    email: string;
    user: EmailAuthUser | null;
  }) => Promise<void>;
  /** Issues a session and folds `enrichSession` into it. */
  buildSession: (user: EmailAuthUser) => Promise<EmailAuthSession>;
  /** Redeems a token the request carries in full — the link flows. */
  redeemLinkToken: (args: {
    request: AuthHttpRequest;
    purpose: LinkPurpose;
  }) => Promise<RedeemedToken>;
};

const validateOptions = (options: EmailAuthOptions): void => {
  if (options.modes.length === 0) {
    throw new Error('createEmailAuthHandlers requires at least one mode.');
  }

  const needsLinks = options.modes.some((mode) => {
    return mode !== 'password' && mode !== 'emailCode';
  });

  if (needsLinks && options.baseUrl === undefined) {
    throw new Error(
      'createEmailAuthHandlers requires baseUrl when a mode sends a link (magicLink, emailVerification, passwordReset).'
    );
  }

  if (!options.modes.includes('emailCode')) {
    return;
  }

  if (options.oneTimeTokenStore.findByEmail === undefined) {
    throw new Error(
      'createEmailAuthHandlers requires oneTimeTokenStore.findByEmail when the emailCode mode is enabled.'
    );
  }

  if (options.oneTimeTokenStore.incrementAttempts === undefined) {
    throw new Error(
      'createEmailAuthHandlers requires oneTimeTokenStore.incrementAttempts when the emailCode mode is enabled, so a short code cannot be brute-forced.'
    );
  }
};

const INVALID_LINK = 'This link is not valid.';

const buildUrl = (args: {
  purpose: LinkPurpose;
  token: string;
  baseUrl: string | undefined;
  linkPaths: typeof DEFAULT_LINK_PATHS;
}): string => {
  const url = new URL(args.linkPaths[args.purpose], args.baseUrl);
  url.searchParams.set('token', args.token);

  return url.toString();
};

const createIssueToken = (args: {
  options: EmailAuthOptions;
  codeDigits: number;
  ttl: Record<OneTimeTokenPurpose, number>;
  linkPaths: typeof DEFAULT_LINK_PATHS;
}): EmailAuthRuntime['issueToken'] => {
  const { options, codeDigits, ttl, linkPaths } = args;

  return async ({ purpose, email, user }) => {
    const isCode = purpose === 'emailCode';

    const { token, tokenHash, expires } = generateOneTimeToken(
      isCode
        ? {
            format: 'numeric',
            digits: codeDigits,
            expiresInSeconds: ttl[purpose],
          }
        : { expiresInSeconds: ttl[purpose] }
    );

    await options.oneTimeTokenStore.deleteFor({ email, purpose });

    await options.oneTimeTokenStore.save({
      tokenHash,
      email,
      userId: user?.id ?? null,
      purpose,
      expires,
      attempts: 0,
    });

    const delivery: EmailAuthDelivery = {
      to: email,
      purpose,
      token,
      expires,
      user,
      ...(isCode
        ? {}
        : {
            url: buildUrl({
              purpose: purpose as LinkPurpose,
              token,
              baseUrl: options.baseUrl,
              linkPaths,
            }),
          }),
    };

    await options.sendEmail(delivery);
  };
};

const createBuildSession = (
  options: EmailAuthOptions
): EmailAuthRuntime['buildSession'] => {
  return async (user) => {
    const session = await options.issueSession(user);

    return options.hooks?.enrichSession
      ? await options.hooks.enrichSession({ session, user })
      : session;
  };
};

const createRedeemLinkToken = (
  options: EmailAuthOptions
): EmailAuthRuntime['redeemLinkToken'] => {
  const tokenStore = options.oneTimeTokenStore;

  return async ({ request, purpose }) => {
    const token = readString(request, 'token');

    if (token === undefined) {
      return { response: error(400, 'invalid_request', 'token is required.') };
    }

    const tokenHash = hashOneTimeToken(token);
    const stored = await tokenStore.find({ tokenHash, purpose });

    if (!stored) {
      return { response: error(401, 'invalid_token', INVALID_LINK) };
    }

    await tokenStore.delete({ tokenHash, purpose });

    if (
      !verifyOneTimeToken({
        token,
        tokenHash: stored.tokenHash,
        expires: stored.expires,
      })
    ) {
      return {
        response: error(401, 'expired_token', 'This link has expired.'),
      };
    }

    /**
     * Looked up fresh rather than trusted from the token, so a token that
     * outlived the account it points at fails instead of resolving to a user
     * who no longer exists.
     */
    const user = await options.userStore.findByEmail(stored.email);

    if (!user) {
      return { response: error(401, 'invalid_token', INVALID_LINK) };
    }

    return { user, email: stored.email };
  };
};

/** The scalar knobs, with every default applied. */
type ResolvedSettings = Pick<
  EmailAuthRuntime,
  | 'codeDigits'
  | 'createUserOnVerify'
  | 'maxAttempts'
  | 'passwordMinLength'
  | 'signInOnSignUp'
>;

const resolvePasswordSettings = (
  options: EmailAuthOptions
): Pick<ResolvedSettings, 'passwordMinLength' | 'signInOnSignUp'> => {
  return {
    passwordMinLength:
      options.password?.minLength ?? DEFAULT_PASSWORD_MIN_LENGTH,
    /**
     * Withholding the session until the address is confirmed is only meaningful
     * when there is a confirmation flow to complete it.
     */
    signInOnSignUp:
      options.password?.signInOnSignUp ??
      !options.modes.includes('emailVerification'),
  };
};

const resolveCodeSettings = (
  options: EmailAuthOptions
): Pick<
  ResolvedSettings,
  'codeDigits' | 'createUserOnVerify' | 'maxAttempts'
> => {
  return {
    codeDigits: options.emailCode?.digits ?? DEFAULT_CODE_DIGITS,
    maxAttempts: options.emailCode?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    createUserOnVerify: options.emailCode?.createUserOnVerify ?? true,
  };
};

const resolveSettings = (options: EmailAuthOptions): ResolvedSettings => {
  return {
    ...resolvePasswordSettings(options),
    ...resolveCodeSettings(options),
  };
};

/**
 * Resolves options into the runtime the handler factories share. Throws on a
 * configuration that cannot be served safely, so a misconfiguration fails at
 * startup rather than on a request.
 */
export const createEmailAuthRuntime = (
  options: EmailAuthOptions
): EmailAuthRuntime => {
  validateOptions(options);

  const settings = resolveSettings(options);

  return {
    ...settings,
    options,
    paths: { ...DEFAULT_PATHS, ...options.paths },
    issueToken: createIssueToken({
      options,
      codeDigits: settings.codeDigits,
      ttl: { ...DEFAULT_TTL, ...options.ttl },
      linkPaths: { ...DEFAULT_LINK_PATHS, ...options.linkPaths },
    }),
    buildSession: createBuildSession(options),
    redeemLinkToken: createRedeemLinkToken(options),
  };
};
