import crypto from 'node:crypto';

/**
 * Primitives for long-lived API tokens (personal access tokens).
 *
 * Tokens look like `<prefix>_<64 base62 chars>` — e.g. `myapp_3F2a…` — so
 * they are recognizable in logs and secret scanners. The application stores
 * only the SHA-256 hash and the display prefix, never the plain token.
 */

export type GeneratedApiToken = {
  /**
   * The plain token to show to the user once, at creation time.
   */
  token: string;
  /**
   * SHA-256 hash of the token, safe to persist and index for lookups.
   */
  tokenHash: string;
  /**
   * First characters of the token, safe to persist for display purposes
   * (e.g., `myapp_3F2a…`).
   */
  displayPrefix: string;
};

export type ApiTokenEncoding = 'hex' | 'base62';

const BASE62_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** The largest multiple of 62 a byte holds; bytes at or above it are redrawn. */
const BASE62_BYTE_LIMIT = 248;

const randomBase62 = (length: number): string => {
  let result = '';
  while (result.length < length) {
    for (const byte of crypto.randomBytes(length)) {
      if (byte < BASE62_BYTE_LIMIT && result.length < length) {
        result += BASE62_ALPHABET[byte % 62];
      }
    }
  }
  return result;
};

export const hashApiToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateApiToken = (args: {
  /**
   * Application prefix, e.g. `myapp` produces tokens like `myapp_<body>`.
   */
  prefix: string;
  /**
   * Size of the token body: `2 * bytes` characters in either encoding.
   * Defaults to 32 (64 characters).
   */
  bytes?: number;
  /**
   * Alphabet of the token body. `base62` (`[0-9A-Za-z]`) carries about 5.95
   * bits per character instead of hex's 4. Defaults to `base62`.
   */
  encoding?: ApiTokenEncoding;
  /**
   * Number of characters of the token kept as `displayPrefix`. Defaults
   * to 12.
   */
  displayPrefixLength?: number;
}): GeneratedApiToken => {
  const bytes = args.bytes ?? 32;
  const displayPrefixLength = args.displayPrefixLength ?? 12;

  const body =
    args.encoding === 'hex'
      ? crypto.randomBytes(bytes).toString('hex')
      : randomBase62(bytes * 2);
  const token = `${args.prefix}_${body}`;

  return {
    token,
    tokenHash: hashApiToken(token),
    displayPrefix: token.slice(0, displayPrefixLength),
  };
};

/**
 * Constant-time check of a plain token against a stored hash, optionally
 * validating expiration.
 */
export const verifyApiToken = (args: {
  token: string;
  tokenHash: string;
  /**
   * When provided, the token is rejected after this date. Omit (or pass
   * `null`) for tokens that never expire.
   */
  expiresAt?: Date | null;
}): boolean => {
  if (args.expiresAt && args.expiresAt.getTime() <= Date.now()) {
    return false;
  }
  const a = Buffer.from(hashApiToken(args.token), 'hex');
  const b = Buffer.from(args.tokenHash, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
};
