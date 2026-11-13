import crypto from 'node:crypto';

import { decode, encode } from './encodeDecode';
import {
  type JsonWebKeySet,
  type SigningKey,
  signWithKey,
  verifyWithJwk,
} from './signingKeys';

const HS256 = 'HS256';

const base64UrlFromBase64 = (base64: string): string => {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlEncode = (obj: unknown): string => {
  return base64UrlFromBase64(encode(obj));
};

const base64UrlDecode = (base64Url: string): unknown => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return decode(base64);
};

const hmac = (input: string, secret: string): string => {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(input)
    .digest('base64');
  return base64UrlFromBase64(signature);
};

export type JwtPayload = Record<string, unknown> & {
  /**
   * Issued at, in seconds since epoch. Added automatically by `signJwt`.
   */
  iat?: number;
  /**
   * Expiration time, in seconds since epoch. Added automatically by `signJwt`
   * when `expiresInSeconds` is provided.
   */
  exp?: number;
};

/** The key a JWT is signed with: a shared HS256 secret, or an asymmetric key. */
export type JwtSigningKeyArgs =
  | {
      /** HS256 shared secret. Anyone who can verify can also mint. */
      secret: string;
      key?: never;
    }
  | {
      /**
       * Asymmetric private key (`EdDSA` or `ES256`). The header carries its
       * `kid`, so a verifier picks the matching public key from a JWKS.
       */
      key: SigningKey;
      secret?: never;
    };

/** What a JWT is verified against: the HS256 secret, or a public key set. */
export type JwtVerificationKeyArgs =
  | { secret: string; jwks?: never }
  | {
      /**
       * Public keys (e.g. the issuer's `jwks_uri` document). The token's
       * header `kid` selects the key, and the algorithm comes from that key —
       * a header `alg` that disagrees is rejected.
       */
      jwks: JsonWebKeySet;
      secret?: never;
    };

/**
 * Signs a JWT, with HMAC-SHA256 (HS256) given a `secret`, or with an
 * asymmetric `key` (`EdDSA` / `ES256`, `kid` in the header) whose public half
 * a third party verifies through a JWKS.
 *
 * For Amazon Cognito tokens, use `@ttoss/auth-core/amazon-cognito` instead —
 * this helper is meant for self-hosted authentication where the application
 * owns the signing key.
 */
export const signJwt = (
  args: {
    payload: JwtPayload;
    /**
     * Token lifetime in seconds, e.g. `60 * 60 * 24 * 7` for 7 days. When
     * omitted, the token never expires.
     */
    expiresInSeconds?: number;
    /**
     * Header `typ`. Defaults to `JWT`; OAuth access tokens use `at+jwt`
     * (RFC 9068).
     */
    typ?: string;
  } & JwtSigningKeyArgs
): string => {
  const { payload, expiresInSeconds, typ = 'JWT' } = args;

  const iat = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    iat,
    ...(expiresInSeconds !== undefined && { exp: iat + expiresInSeconds }),
  };

  const header = base64UrlEncode(
    args.key
      ? { alg: args.key.alg, typ, kid: args.key.kid }
      : { alg: HS256, typ }
  );
  const body = base64UrlEncode(fullPayload);
  const input = `${header}.${body}`;
  const signature = args.key
    ? signWithKey({ input, key: args.key })
    : hmac(input, args.secret);

  return `${input}.${signature}`;
};

const verifyHs256 = (args: {
  input: string;
  signature: string;
  alg: unknown;
  secret: string;
}): boolean => {
  if (args.alg !== HS256) {
    return false;
  }
  const a = Buffer.from(args.signature);
  const b = Buffer.from(hmac(args.input, args.secret));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const verifyAsymmetric = (args: {
  input: string;
  signature: string;
  header: { alg?: unknown; kid?: unknown };
  jwks: JsonWebKeySet;
}): boolean => {
  const jwk = args.jwks.keys.find((key) => {
    return key.kid === args.header.kid;
  });
  if (!jwk || jwk.alg !== args.header.alg) {
    return false;
  }
  return verifyWithJwk({
    input: args.input,
    signature: args.signature,
    jwk,
  });
};

/**
 * Verifies a JWT's signature and expiration — HS256 against a `secret`, or
 * `EdDSA` / `ES256` against a `jwks`. Each mode accepts only its own
 * algorithms, so an HS256 token never passes a JWKS check or vice versa.
 *
 * Returns the payload when the token is valid, or `null` when the token is
 * malformed, has an invalid signature, names an unknown `kid`, or is expired.
 */
export const verifyJwt = (
  args: { token: string } & JwtVerificationKeyArgs
): JwtPayload | null => {
  const parts = args.token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [header, body, signature] = parts;
  const input = `${header}.${body}`;

  try {
    const decodedHeader = base64UrlDecode(header) as {
      alg?: unknown;
      kid?: unknown;
    };

    const valid = args.jwks
      ? verifyAsymmetric({
          input,
          signature,
          header: decodedHeader,
          jwks: args.jwks,
        })
      : verifyHs256({
          input,
          signature,
          alg: decodedHeader.alg,
          secret: args.secret,
        });
    if (!valid) {
      return null;
    }

    const payload = base64UrlDecode(body) as JwtPayload;

    if (payload.exp !== undefined && payload.exp <= Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
