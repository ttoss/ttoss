import { type JwtPayload, signJwt, verifyJwt } from './jwt';
import {
  assertSigningKey,
  type JsonWebKeySet,
  type SigningKey,
  toPublicJwk,
} from './signingKeys';

/** Options for {@link createSigningKeySet}. */
export interface SigningKeySetOptions {
  /**
   * Every key the app holds: exactly one without `retiredAt` (the one that
   * signs), plus any retired keys still inside their grace window.
   */
  keys: SigningKey[];
  /**
   * How long, in seconds, a retired key stays published and accepted after
   * its `retiredAt` — set it to the longest lifetime of any token it signed
   * (the access-token TTL). Past that window the key is dropped from the JWKS
   * on its own, so a forgotten retired key does not stay trusted forever.
   */
  retiredKeyTtl: number;
}

/** The key set returned by {@link createSigningKeySet}. */
export interface SigningKeySet {
  /** The key that signs new tokens. */
  signingKey: SigningKey;
  /**
   * The JWKS document to serve at `jwks_uri`: the signing key plus every
   * retired key still inside its grace window. Computed per call, so a key
   * drops out once its window closes without a restart.
   */
  jwks: () => JsonWebKeySet;
  /** Signs a JWT with the current signing key (`kid` in the header). */
  sign: (args: {
    payload: JwtPayload;
    expiresInSeconds?: number;
    typ?: string;
  }) => string;
  /**
   * Verifies a JWT against the published keys — a token signed by a retired
   * key passes until that key leaves the JWKS. Returns `null` when invalid.
   */
  verify: (token: string) => JwtPayload | null;
}

/**
 * Builds the asymmetric key set an authorization server signs with and
 * publishes as its JWKS, with rotation:
 *
 * 1. Generate a new key with `generateSigningKey` and add it to `keys`.
 * 2. Set `retiredAt: Date.now()` on the old one — the new key signs from now
 *    on, and the old one stays published so tokens it signed keep verifying.
 * 3. After `retiredKeyTtl` the old key drops out of the JWKS by itself; remove
 *    it from config whenever convenient.
 *
 * Keys are validated up front, so a malformed secret fails at startup.
 *
 * @example
 * ```typescript
 * const keySet = createSigningKeySet({
 *   keys: JSON.parse(process.env.OAUTH_SIGNING_KEYS!),
 *   retiredKeyTtl: 3600,
 * });
 * keySet.jwks(); // => { keys: [{ kty: 'OKP', crv: 'Ed25519', kid, alg: 'EdDSA', … }] }
 * ```
 */
export const createSigningKeySet = (
  options: SigningKeySetOptions
): SigningKeySet => {
  const { keys, retiredKeyTtl } = options;

  for (const key of keys) {
    assertSigningKey(key);
  }

  const kids = new Set(
    keys.map((key) => {
      return key.kid;
    })
  );
  if (kids.size !== keys.length) {
    throw new Error('Signing keys must have distinct kids.');
  }

  const active = keys.filter((key) => {
    return key.retiredAt === undefined;
  });
  if (active.length !== 1) {
    throw new Error(
      `Exactly one signing key must be active (without retiredAt); found ${active.length}.`
    );
  }
  const [signingKey] = active;

  const jwks = (): JsonWebKeySet => {
    const now = Date.now();
    return {
      keys: keys
        .filter((key) => {
          return (
            key.retiredAt === undefined ||
            key.retiredAt + retiredKeyTtl * 1000 > now
          );
        })
        .map(toPublicJwk),
    };
  };

  return {
    signingKey,
    jwks,
    sign: (args) => {
      return signJwt({ ...args, key: signingKey });
    },
    verify: (token) => {
      return verifyJwt({ token, jwks: jwks() });
    },
  };
};
