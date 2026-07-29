import crypto from 'node:crypto';

/**
 * Primitives for single-use, expiring tokens — the building block for magic
 * links, email verification, and password reset flows.
 *
 * The application stores only the token hash (never the plain token) together
 * with the identifier and expiration date, and destroys the record after a
 * successful verification.
 */

/**
 * How the plain token is encoded.
 *
 * `hex` produces a high-entropy string for tokens that travel inside a link
 * the user clicks. `numeric` produces a short digit code the user retypes from
 * their email or SMS — human-transcribable, and therefore low-entropy enough
 * that it is only safe with a short lifetime and a bounded attempt count.
 */
export type OneTimeTokenFormat = 'hex' | 'numeric';

export const MIN_NUMERIC_DIGITS = 4;

export const MAX_NUMERIC_DIGITS = 12;

/**
 * Largest multiple of 10 that fits in a byte. Bytes at or above it are
 * discarded so that `byte % 10` stays uniform over `0-9`.
 */
const NUMERIC_REJECTION_CEILING = 250;

const DEFAULT_NUMERIC_DIGITS = 6;

const DEFAULT_NUMERIC_TTL = 60 * 10;

const DEFAULT_HEX_TTL = 60 * 60 * 24;

const assertDigits = (digits: number): number => {
  if (
    !Number.isInteger(digits) ||
    digits < MIN_NUMERIC_DIGITS ||
    digits > MAX_NUMERIC_DIGITS
  ) {
    throw new Error(
      `digits must be an integer between ${MIN_NUMERIC_DIGITS} and ${MAX_NUMERIC_DIGITS}, received ${digits}.`
    );
  }

  return digits;
};

export type OneTimeToken = {
  /**
   * The plain token to deliver to the user (e.g., in a link sent by email).
   * Never store it — store `tokenHash` instead.
   */
  token: string;
  /**
   * SHA-256 hash of the token, safe to persist.
   */
  tokenHash: string;
  expires: Date;
};

export const hashOneTimeToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Uniformly random decimal string via rejection sampling.
 *
 * `crypto.randomInt` would also be unbiased, but drawing the whole code from a
 * single integer caps the length at the safe-integer range; sampling per digit
 * keeps every supported length uniform.
 */
const randomDigits = (digits: number): string => {
  let code = '';

  while (code.length < digits) {
    /**
     * Over-draw so that the expected number of rejections (a little under 2%
     * of bytes) rarely costs a second pass.
     */
    const bytes = crypto.randomBytes(digits - code.length + 8);

    for (const byte of bytes) {
      if (code.length === digits) {
        break;
      }

      if (byte >= NUMERIC_REJECTION_CEILING) {
        continue;
      }

      code += String(byte % 10);
    }
  }

  return code;
};

const defaultTtl = (format: OneTimeTokenFormat): number => {
  return format === 'numeric' ? DEFAULT_NUMERIC_TTL : DEFAULT_HEX_TTL;
};

const randomToken = (args: {
  format: OneTimeTokenFormat;
  bytes?: number;
  digits?: number;
}): string => {
  if (args.format === 'numeric') {
    return randomDigits(assertDigits(args.digits ?? DEFAULT_NUMERIC_DIGITS));
  }

  return crypto.randomBytes(args.bytes ?? 32).toString('hex');
};

export const generateOneTimeToken = (args?: {
  /**
   * Token encoding. Defaults to `hex`.
   */
  format?: OneTimeTokenFormat;
  /**
   * Number of random bytes. The token is the hex encoding, so the string
   * length is twice this value. Defaults to 32. Ignored when `format` is
   * `numeric`.
   */
  bytes?: number;
  /**
   * Number of digits when `format` is `numeric`. Defaults to 6, and must be
   * between {@link MIN_NUMERIC_DIGITS} and {@link MAX_NUMERIC_DIGITS}.
   * Ignored when `format` is `hex`.
   */
  digits?: number;
  /**
   * Token lifetime in seconds. Defaults to 24 hours for `hex` and 10 minutes
   * for `numeric`, whose smaller keyspace makes a long window a guessing
   * window.
   */
  expiresInSeconds?: number;
}): OneTimeToken => {
  const format = args?.format ?? 'hex';

  const expiresInSeconds = args?.expiresInSeconds ?? defaultTtl(format);

  const expires = new Date(Date.now() + expiresInSeconds * 1000);

  const token = randomToken({
    format,
    bytes: args?.bytes,
    digits: args?.digits,
  });

  return { token, tokenHash: hashOneTimeToken(token), expires };
};

/**
 * Constant-time check of a plain token against a stored hash, also validating
 * the expiration date.
 *
 * This is a single-guess check and deliberately keeps no state, so a `numeric`
 * token needs the caller to bound how many guesses a stored record accepts —
 * `createEmailAuthHandlers` does that through
 * `OneTimeTokenStore.incrementAttempts`.
 */
export const verifyOneTimeToken = (args: {
  token: string;
  tokenHash: string;
  expires: Date;
}): boolean => {
  if (args.expires.getTime() <= Date.now()) {
    return false;
  }
  const a = Buffer.from(hashOneTimeToken(args.token), 'hex');
  const b = Buffer.from(args.tokenHash, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
};
