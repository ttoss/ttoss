import { createLocalJWKSet, jwtVerify } from 'jose';
import { signJwt, verifyJwt } from 'src/jwt';
import {
  algorithmOfJwk,
  assertSigningKey,
  generateSigningKey,
  type PublicJwk,
  toPublicJwk,
  verifyWithJwk,
} from 'src/signingKeys';

describe.each(['EdDSA', 'ES256'] as const)('%s keys', (alg) => {
  test('generate a key whose kid is its thumbprint and whose JWK is public only', () => {
    const key = generateSigningKey({ alg });
    const jwk = toPublicJwk(key);

    expect(key.alg).toBe(alg);
    expect(key.kid).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(jwk).toMatchObject({ kid: key.kid, alg, use: 'sig' });
    expect(jwk).not.toHaveProperty('d');
    expect(() => {
      return assertSigningKey(key);
    }).not.toThrow();
  });

  test('sign a JWT that our own verifier and a third party (jose) both accept', async () => {
    const key = generateSigningKey({ alg });
    const jwks = { keys: [toPublicJwk(key)] };
    const token = signJwt({
      payload: { sub: 'user-1', iss: 'https://issuer.example.com' },
      key,
      expiresInSeconds: 60,
    });

    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString()
    );
    expect(header).toEqual({ alg, typ: 'JWT', kid: key.kid });
    expect(verifyJwt({ token, jwks })).toMatchObject({ sub: 'user-1' });

    const { payload } = await jwtVerify(token, createLocalJWKSet(jwks), {
      issuer: 'https://issuer.example.com',
    });
    expect(payload.sub).toBe('user-1');
  });
});

test('a kid can be chosen and the default algorithm is EdDSA', () => {
  const key = generateSigningKey({ kid: 'key-2026-11' });
  expect(key).toMatchObject({ kid: 'key-2026-11', alg: 'EdDSA' });
});

test('two generated keys never share a kid', () => {
  expect(generateSigningKey().kid).not.toBe(generateSigningKey().kid);
});

test('a key whose material disagrees with its alg, or lacks a kid or private part, fails fast', () => {
  const ed = generateSigningKey({ alg: 'EdDSA' });

  expect(() => {
    return assertSigningKey({ ...ed, alg: 'ES256' });
  }).toThrow(/declares ES256/);
  expect(() => {
    return assertSigningKey({ ...ed, kid: '' });
  }).toThrow(/kid/);

  const { d: _d, ...publicOnly } = ed.privateJwk;
  expect(() => {
    return assertSigningKey({ ...ed, privateJwk: publicOnly });
  }).toThrow(/private part/);
});

test('only Ed25519 and P-256 map to an algorithm', () => {
  expect(algorithmOfJwk({ kty: 'RSA' })).toBeUndefined();
  expect(algorithmOfJwk({ kty: 'EC', crv: 'P-384' })).toBeUndefined();
});

describe('verifyJwt with a JWKS', () => {
  const key = generateSigningKey({ alg: 'EdDSA' });
  const jwks = { keys: [toPublicJwk(key)] };

  test('rejects a token whose kid is not published', () => {
    const other = generateSigningKey({ alg: 'EdDSA' });
    const token = signJwt({ payload: { sub: 'u' }, key: other });
    expect(verifyJwt({ token, jwks })).toBeNull();
  });

  test('rejects an HS256 token, and an asymmetric token checked against a secret', () => {
    const hs = signJwt({ payload: { sub: 'u' }, secret: 'shared' });
    expect(verifyJwt({ token: hs, jwks })).toBeNull();

    const asym = signJwt({ payload: { sub: 'u' }, key });
    expect(verifyJwt({ token: asym, secret: 'shared' })).toBeNull();
  });

  test('rejects a header alg that disagrees with the published key', () => {
    const token = signJwt({ payload: { sub: 'u' }, key });
    const [, body, signature] = token.split('.');
    const forgedHeader = Buffer.from(
      JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: key.kid })
    ).toString('base64url');

    expect(
      verifyJwt({ token: `${forgedHeader}.${body}.${signature}`, jwks })
    ).toBeNull();
  });

  test('rejects a tampered payload and an expired token', () => {
    const token = signJwt({ payload: { sub: 'u' }, key });
    const [header, , signature] = token.split('.');
    const body = Buffer.from(JSON.stringify({ sub: 'admin' })).toString(
      'base64url'
    );
    expect(verifyJwt({ token: `${header}.${body}.${signature}`, jwks })).toBe(
      null
    );

    const expired = signJwt({
      payload: { sub: 'u' },
      key,
      expiresInSeconds: -1,
    });
    expect(verifyJwt({ token: expired, jwks })).toBeNull();
  });

  test('refuses a JWK whose declared alg disagrees with its material', () => {
    const jwk: PublicJwk = { ...toPublicJwk(key), alg: 'ES256' };
    expect(verifyWithJwk({ input: 'a.b', signature: 'c', jwk })).toBe(false);
  });

  test('writes a custom typ', () => {
    const token = signJwt({ payload: {}, key, typ: 'at+jwt' });
    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString()
    );
    expect(header.typ).toBe('at+jwt');
  });
});
