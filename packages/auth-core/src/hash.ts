import crypto from 'node:crypto';

/**
 * 1,000 iterations were used by the original `salt:hash` format. Kept only to
 * verify hashes created before the versioned format existed.
 */
const LEGACY_ITERATIONS = 1000;

/**
 * OWASP recommendation for PBKDF2-HMAC-SHA256.
 */
const DEFAULT_ITERATIONS = 600_000;

const KEY_LENGTH = 64;

const DIGEST = 'sha256';

const HASH_VERSION = 'pbkdf2-sha256';

const pbkdf2 = (
  plainPassword: string,
  salt: string,
  iterations: number
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      plainPassword,
      salt,
      iterations,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(derivedKey);
      }
    );
  });
};

const timingSafeEqualHex = (hexA: string, hexB: string): boolean => {
  const a = Buffer.from(hexA, 'hex');
  const b = Buffer.from(hexB, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
};

/**
 * Hashes a password with PBKDF2-HMAC-SHA256.
 *
 * The returned string is self-describing —
 * `pbkdf2-sha256$<iterations>$<salt>$<hash>` — so the iteration count can be
 * raised in the future without invalidating stored hashes.
 */
export const hashPassword = async (
  plainPassword: string,
  options?: { iterations?: number }
): Promise<string> => {
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2(plainPassword, salt, iterations);
  return `${HASH_VERSION}$${iterations}$${salt}$${derivedKey.toString('hex')}`;
};

/**
 * Compares a password against a stored hash using a constant-time comparison.
 *
 * Supports both the versioned `pbkdf2-sha256$<iterations>$<salt>$<hash>`
 * format and the legacy `salt:hash` format (1,000 iterations).
 */
export const comparePassword = async (
  plainPassword: string,
  storedHash: string
): Promise<boolean> => {
  if (storedHash.startsWith(`${HASH_VERSION}$`)) {
    const [, iterationsStr, salt, hash] = storedHash.split('$');
    const iterations = Number(iterationsStr);
    if (!Number.isInteger(iterations) || iterations <= 0 || !salt || !hash) {
      return false;
    }
    const derivedKey = await pbkdf2(plainPassword, salt, iterations);
    return timingSafeEqualHex(hash, derivedKey.toString('hex'));
  }

  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }
  const derivedKey = await pbkdf2(plainPassword, salt, LEGACY_ITERATIONS);
  return timingSafeEqualHex(hash, derivedKey.toString('hex'));
};

/**
 * Returns true if the stored hash uses the legacy format or fewer iterations
 * than currently recommended. Callers can re-hash the password on the user's
 * next successful login.
 */
export const needsRehash = (storedHash: string): boolean => {
  if (!storedHash.startsWith(`${HASH_VERSION}$`)) {
    return true;
  }
  const [, iterationsStr] = storedHash.split('$');
  return Number(iterationsStr) < DEFAULT_ITERATIONS;
};
