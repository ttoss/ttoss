import crypto from 'node:crypto';

/**
 * Symmetric encryption helpers (AES-256-GCM) for storing sensitive values
 * at rest — e.g., third-party API keys or user secrets in a database.
 *
 * The ciphertext is a single base64 string containing the IV, the
 * authentication tag, and the encrypted payload, so no extra columns are
 * needed to store it.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Generates a random 32-byte encryption key, hex encoded (64 characters).
 * Store it in a secret manager or environment variable.
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

const parseKey = (key: string): Buffer => {
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new Error(
      'Encryption key must be a 64-character hex string (32 bytes)'
    );
  }
  return buf;
};

export const encryptValue = (args: {
  plaintext: string;
  /**
   * 32-byte key, hex encoded (64 characters). See `generateEncryptionKey`.
   */
  key: string;
}): string => {
  const key = parseKey(args.key);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(args.plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

/**
 * Decrypts a value produced by `encryptValue`. Throws when the key is wrong
 * or the ciphertext was tampered with (GCM authentication failure).
 */
export const decryptValue = (args: {
  ciphertext: string;
  /**
   * 32-byte key, hex encoded (64 characters). See `generateEncryptionKey`.
   */
  key: string;
}): string => {
  const key = parseKey(args.key);
  const buf = Buffer.from(args.ciphertext, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
};
