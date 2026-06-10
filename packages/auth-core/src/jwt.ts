import crypto from 'node:crypto';

import { decode, encode } from './encodeDecode';

const ALGORITHM = 'HS256';

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

const sign = (input: string, secret: string): string => {
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

/**
 * Signs a JWT with HMAC-SHA256 (HS256).
 *
 * For Amazon Cognito tokens, use `@ttoss/auth-core/amazon-cognito` instead —
 * this helper is meant for self-hosted authentication where the application
 * owns the signing secret.
 */
export const signJwt = (args: {
  payload: JwtPayload;
  secret: string;
  /**
   * Token lifetime in seconds, e.g. `60 * 60 * 24 * 7` for 7 days. When
   * omitted, the token never expires.
   */
  expiresInSeconds?: number;
}): string => {
  const { payload, secret, expiresInSeconds } = args;

  const iat = Math.floor(Date.now() / 1000);

  const fullPayload: JwtPayload = {
    ...payload,
    iat,
    ...(expiresInSeconds !== undefined && { exp: iat + expiresInSeconds }),
  };

  const header = base64UrlEncode({ alg: ALGORITHM, typ: 'JWT' });
  const body = base64UrlEncode(fullPayload);
  const signature = sign(`${header}.${body}`, secret);

  return `${header}.${body}.${signature}`;
};

/**
 * Verifies an HS256 JWT signature and expiration.
 *
 * Returns the payload when the token is valid, or `null` when the token is
 * malformed, has an invalid signature, or is expired.
 */
export const verifyJwt = (args: {
  token: string;
  secret: string;
}): JwtPayload | null => {
  const { token, secret } = args;

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [header, body, signature] = parts;

  try {
    const decodedHeader = base64UrlDecode(header) as { alg?: string };
    if (decodedHeader.alg !== ALGORITHM) {
      return null;
    }

    const expectedSignature = sign(`${header}.${body}`, secret);
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
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
