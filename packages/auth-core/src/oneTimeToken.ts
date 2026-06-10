import crypto from 'node:crypto';

/**
 * Primitives for single-use, expiring tokens — the building block for magic
 * links, email verification, and password reset flows.
 *
 * The application stores only the token hash (never the plain token) together
 * with the identifier and expiration date, and destroys the record after a
 * successful verification.
 */

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

export const generateOneTimeToken = (args?: {
  /**
   * Number of random bytes. The token is the hex encoding, so the string
   * length is twice this value. Defaults to 32.
   */
  bytes?: number;
  /**
   * Token lifetime in seconds. Defaults to 24 hours.
   */
  expiresInSeconds?: number;
}): OneTimeToken => {
  const bytes = args?.bytes ?? 32;
  const expiresInSeconds = args?.expiresInSeconds ?? 60 * 60 * 24;

  const token = crypto.randomBytes(bytes).toString('hex');

  return {
    token,
    tokenHash: hashOneTimeToken(token),
    expires: new Date(Date.now() + expiresInSeconds * 1000),
  };
};

/**
 * Constant-time check of a plain token against a stored hash, also validating
 * the expiration date.
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
