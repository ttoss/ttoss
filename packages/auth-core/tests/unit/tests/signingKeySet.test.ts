import { createLocalJWKSet, jwtVerify } from 'jose';
import { generateSigningKey } from 'src/signingKeys';
import { createSigningKeySet } from 'src/signingKeySet';

const HOUR = 3600;

afterEach(() => {
  jest.useRealTimers();
});

test('signs with the one active key and publishes it', async () => {
  const key = generateSigningKey();
  const keySet = createSigningKeySet({ keys: [key], retiredKeyTtl: HOUR });

  const token = keySet.sign({ payload: { sub: 'u' }, expiresInSeconds: 60 });

  expect(keySet.signingKey).toBe(key);
  expect(
    keySet.jwks().keys.map((jwk) => {
      return jwk.kid;
    })
  ).toEqual([key.kid]);
  expect(keySet.verify(token)).toMatchObject({ sub: 'u' });
  await expect(
    jwtVerify(token, createLocalJWKSet(keySet.jwks()))
  ).resolves.toBeDefined();
});

test('rotating keeps tokens signed by the old key valid until its window closes', () => {
  jest.useFakeTimers({ now: new Date('2026-11-13T12:00:00Z') });

  const oldKey = generateSigningKey({ alg: 'ES256' });
  const before = createSigningKeySet({ keys: [oldKey], retiredKeyTtl: HOUR });
  const liveToken = before.sign({
    payload: { sub: 'u' },
    expiresInSeconds: HOUR,
  });

  // Rotate: a new key signs, the old one is retired now.
  const newKey = generateSigningKey({ alg: 'EdDSA' });
  const after = createSigningKeySet({
    keys: [newKey, { ...oldKey, retiredAt: Date.now() }],
    retiredKeyTtl: HOUR,
  });

  expect(after.signingKey.kid).toBe(newKey.kid);
  expect(
    after.jwks().keys.map((jwk) => {
      return jwk.kid;
    })
  ).toEqual([newKey.kid, oldKey.kid]);
  expect(after.verify(liveToken)).toMatchObject({ sub: 'u' });

  const fresh = after.sign({ payload: { sub: 'v' } });
  expect(after.verify(fresh)).toMatchObject({ sub: 'v' });

  // Once the longest token lifetime has passed, the old key leaves the JWKS.
  jest.setSystemTime(new Date('2026-11-13T13:00:01Z'));
  expect(
    after.jwks().keys.map((jwk) => {
      return jwk.kid;
    })
  ).toEqual([newKey.kid]);
  expect(after.verify(liveToken)).toBeNull();
});

test('requires exactly one active key and distinct kids', () => {
  const a = generateSigningKey();
  const b = generateSigningKey();

  expect(() => {
    return createSigningKeySet({ keys: [], retiredKeyTtl: HOUR });
  }).toThrow(/found 0/);
  expect(() => {
    return createSigningKeySet({ keys: [a, b], retiredKeyTtl: HOUR });
  }).toThrow(/found 2/);
  expect(() => {
    return createSigningKeySet({
      keys: [a, { ...b, kid: a.kid, retiredAt: 1 }],
      retiredKeyTtl: HOUR,
    });
  }).toThrow(/distinct kids/);
});

test('rejects a malformed key at construction', () => {
  const key = generateSigningKey();
  expect(() => {
    return createSigningKeySet({
      keys: [{ ...key, alg: 'ES256' }],
      retiredKeyTtl: HOUR,
    });
  }).toThrow(/declares ES256/);
});
