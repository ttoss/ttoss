import type { AuthHttpRequest, AuthHttpResponse } from './oauthServerTypes';

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

/**
 * The credential flows an application turns on. Each mode mounts its own
 * handlers and requires its own options, so an application that only signs
 * users in with a mailed code never exposes a password endpoint.
 */
export type EmailAuthMode =
  /** `signUp` + `signIn` with an email and a password. */
  | 'password'
  /** A mailed link carrying a high-entropy token that signs the user in. */
  | 'magicLink'
  /** A mailed short numeric code the user retypes to sign in. */
  | 'emailCode'
  /** A mailed link confirming the address after a password sign-up. */
  | 'emailVerification'
  /** The mailed forgot-password / reset-password pair. */
  | 'passwordReset';

/**
 * Why a one-time token was issued. Persisted alongside the hash so a token
 * minted for one flow can never be redeemed by another.
 */
export type OneTimeTokenPurpose =
  'magicLink' | 'emailCode' | 'emailVerification' | 'passwordReset';

// ---------------------------------------------------------------------------
// Store contracts (app-provided persistence)
// ---------------------------------------------------------------------------

/**
 * The application's user record, as far as this engine is concerned. Anything
 * else on the row (name, locale, …) is the application's business and is
 * carried through untouched by `hooks` and `issueSession`.
 */
export type EmailAuthUser = {
  id: string;
  email: string;
  /**
   * The stored password hash, or `null` for a user who has only ever signed in
   * with a link or a code. Never the plain password.
   */
  passwordHash?: string | null;
  emailVerified?: boolean;
  [key: string]: unknown;
};

/**
 * App-provided user persistence. The engine owns the flow mechanics; the app
 * owns the table (Sequelize via `@ttoss/postgresdb`, DynamoDB, …).
 *
 * `findByEmail` receives an already-normalized address, so the app must store
 * and query addresses in the same normalized form.
 */
export type EmailAuthUserStore = {
  findByEmail: (
    email: string
  ) => Promise<EmailAuthUser | null> | EmailAuthUser | null;
  create: (args: {
    email: string;
    passwordHash: string | null;
    emailVerified: boolean;
  }) => Promise<EmailAuthUser> | EmailAuthUser;
  update: (args: {
    id: string;
    passwordHash?: string;
    emailVerified?: boolean;
  }) => Promise<EmailAuthUser> | EmailAuthUser;
};

/**
 * A persisted one-time token. Only the hash is stored, so a store dump yields
 * nothing redeemable.
 *
 * `email` is carried alongside `userId` because the code flow can mint a token
 * for an address that has no user row yet, and because a wrong code has to be
 * counted against a record found by address rather than by its own hash.
 */
export type StoredOneTimeToken = {
  tokenHash: string;
  /** Normalized address the token was mailed to. */
  email: string;
  /** `null` when the token was minted before the user row existed. */
  userId: string | null;
  purpose: OneTimeTokenPurpose;
  expires: Date;
  /**
   * Wrong guesses recorded so far. Only meaningful for `emailCode`, whose
   * short keyspace has to be defended by a bounded attempt count.
   */
  attempts?: number;
};

/**
 * App-provided one-time token persistence.
 *
 * Every method takes or returns a `tokenHash`, never a redeemable token, which
 * makes storing a usable secret impossible rather than merely discouraged.
 */
export type OneTimeTokenStore = {
  save: (token: StoredOneTimeToken) => Promise<void> | void;
  /**
   * Look up by hash **and** purpose, so a token minted for one flow cannot be
   * redeemed by another. This is the lookup for the link flows, where the
   * token itself is the only thing the request carries.
   */
  find: (args: {
    tokenHash: string;
    purpose: OneTimeTokenPurpose;
  }) => Promise<StoredOneTimeToken | null> | StoredOneTimeToken | null;
  /**
   * Look up the outstanding token for an address. Required when `emailCode` is
   * enabled: a wrong code hashes to nothing on record, so the engine has to
   * find the record by address before it can compare and count the attempt.
   */
  findByEmail?: (args: {
    email: string;
    purpose: OneTimeTokenPurpose;
  }) => Promise<StoredOneTimeToken | null> | StoredOneTimeToken | null;
  /** Delete a token, enforcing single use. */
  delete: (args: {
    tokenHash: string;
    purpose: OneTimeTokenPurpose;
  }) => Promise<void> | void;
  /**
   * Delete every outstanding token of this purpose for this address, so
   * issuing a new one invalidates whatever preceded it.
   */
  deleteFor: (args: {
    email: string;
    purpose: OneTimeTokenPurpose;
  }) => Promise<void> | void;
  /**
   * Record a failed attempt. Required when `emailCode` is enabled; the engine
   * calls it on every wrong guess and destroys the token once `maxAttempts` is
   * reached.
   */
  incrementAttempts?: (args: {
    tokenHash: string;
    purpose: OneTimeTokenPurpose;
  }) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// Delivery and session contracts
// ---------------------------------------------------------------------------

/**
 * Everything the application needs to compose and send one auth email. The
 * engine mints and persists the token, then hands the plaintext here exactly
 * once — there is no transport dependency in this package, so the application
 * sends it with whichever provider it already uses (Resend, SES, SMTP, …).
 */
export type EmailAuthDelivery = {
  /** Normalized recipient address. */
  to: string;
  purpose: OneTimeTokenPurpose;
  /**
   * The plain token. For `emailCode` this is the digit code to show the user;
   * for the link flows it is already embedded in `url`.
   */
  token: string;
  /**
   * The absolute URL to put behind the call to action, present for every
   * purpose except `emailCode`. Built from `baseUrl` and the flow's `paths`.
   */
  url?: string;
  expires: Date;
  /**
   * The user the token was issued for, or `null` when a code was mailed to an
   * address that has no user row yet.
   */
  user: EmailAuthUser | null;
};

/**
 * Whatever the application hands back to the client on a successful
 * authentication. The engine never inspects it, which is what lets one
 * application return a bare JWT and another an access token plus a rotating
 * refresh token.
 */
export type EmailAuthSession = Record<string, unknown>;

export type EmailAuthHooks = {
  /**
   * Called after a user row is created, before a session is issued. The place
   * for application-specific bootstrapping (a default workspace, a free-plan
   * subscription, an analytics identify call).
   */
  onUserCreated?: (user: EmailAuthUser) => Promise<void> | void;
  /**
   * Called after `issueSession`, to fold application state into the response
   * body without the engine knowing about it.
   */
  enrichSession?: (args: {
    session: EmailAuthSession;
    user: EmailAuthUser;
  }) => Promise<EmailAuthSession> | EmailAuthSession;
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Lifetime in seconds for each purpose's token. */
export type EmailAuthTtl = {
  /** Defaults to 24 hours. */
  magicLink?: number;
  /** Defaults to 10 minutes — a short code needs a short window. */
  emailCode?: number;
  /** Defaults to 24 hours. */
  emailVerification?: number;
  /** Defaults to 1 hour. */
  passwordReset?: number;
};

export type EmailCodeOptions = {
  /** Number of digits. Defaults to 6. */
  digits?: number;
  /**
   * Wrong guesses a single code tolerates before it is destroyed. Defaults
   * to 5. Requires `oneTimeTokenStore.incrementAttempts`.
   */
  maxAttempts?: number;
  /**
   * Whether verifying a code for an unknown address creates the user, making
   * the code flow a combined sign-up and sign-in. Defaults to `true`.
   */
  createUserOnVerify?: boolean;
};

export type PasswordOptions = {
  /** Minimum plain-password length. Defaults to 8. */
  minLength?: number;
  /**
   * Whether `signUp` issues a session immediately, or withholds it until the
   * address is confirmed. Defaults to `false` when `emailVerification` is
   * enabled and `true` otherwise.
   */
  signInOnSignUp?: boolean;
  /** Whether `signIn` rejects a user whose address is unconfirmed. */
  requireVerifiedEmail?: boolean;
};

/** Route paths, so an application can mount the flows under its own scheme. */
export type EmailAuthPaths = {
  signUp?: string;
  signIn?: string;
  sendMagicLink?: string;
  verifyMagicLink?: string;
  sendEmailCode?: string;
  verifyEmailCode?: string;
  verifyEmail?: string;
  requestPasswordReset?: string;
  resetPassword?: string;
};

export type EmailAuthOptions = {
  /** The flows to enable. At least one is required. */
  modes: EmailAuthMode[];
  userStore: EmailAuthUserStore;
  oneTimeTokenStore: OneTimeTokenStore;
  /**
   * Mints whatever the application calls a session. Kept as a hook rather than
   * a built-in because session topology is the one thing consumers genuinely
   * disagree on — a long-lived JWT and a short access token with a rotating
   * refresh family are both valid, and neither belongs in this engine.
   */
  issueSession: (
    user: EmailAuthUser
  ) => Promise<EmailAuthSession> | EmailAuthSession;
  /**
   * Sends one auth email. Anything it throws propagates out of the handler to
   * the adapter's error handling rather than being folded into a response, so
   * a delivery outage surfaces as an error the application already reports.
   */
  sendEmail: (delivery: EmailAuthDelivery) => Promise<void> | void;
  /**
   * Absolute base URL of the application the emailed links point at, e.g.
   * `https://app.example.com`. Required by every mode except `emailCode`.
   */
  baseUrl?: string;
  /**
   * Client-side paths the emailed links land on, appended to `baseUrl` with
   * `?token=`. Default to `/auth/callback`, `/auth/verify-email` and
   * `/auth/reset-password`.
   */
  linkPaths?: {
    magicLink?: string;
    emailVerification?: string;
    passwordReset?: string;
  };
  ttl?: EmailAuthTtl;
  emailCode?: EmailCodeOptions;
  password?: PasswordOptions;
  paths?: EmailAuthPaths;
  hooks?: EmailAuthHooks;
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export type EmailAuthHandler = (
  request: AuthHttpRequest
) => Promise<AuthHttpResponse>;

/**
 * The mounted flows. A handler is present only when its mode is enabled, so an
 * adapter can mount exactly what the application configured.
 */
export type EmailAuthHandlers = {
  /** Resolved paths for every mounted handler. */
  paths: Required<EmailAuthPaths>;
  /** The modes that were enabled. */
  modes: EmailAuthMode[];
  signUp?: EmailAuthHandler;
  signIn?: EmailAuthHandler;
  sendMagicLink?: EmailAuthHandler;
  verifyMagicLink?: EmailAuthHandler;
  sendEmailCode?: EmailAuthHandler;
  verifyEmailCode?: EmailAuthHandler;
  verifyEmail?: EmailAuthHandler;
  requestPasswordReset?: EmailAuthHandler;
  resetPassword?: EmailAuthHandler;
};
