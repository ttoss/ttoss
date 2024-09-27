import crypto from 'node:crypto';

const ITERATIONS = 1000;

const KEY_LENGTH = 64;

const DIGEST = 'sha256';

export const hashPassword = (plainPassword: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      plainPassword,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) {
          reject(err);
        }
        const hash = derivedKey.toString('hex');
        resolve(`${salt}:${hash}`);
      }
    );
  });
};

export const comparePassword = (
  plainPassword: string,
  storedHash: string
): Promise<boolean> => {
  const [salt, hash] = storedHash.split(':');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      plainPassword,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      DIGEST,
      (err, derivedKey) => {
        if (err) {
          reject(err);
        }
        const hashToCompare = derivedKey.toString('hex');
        resolve(hash === hashToCompare);
      }
    );
  });
};
