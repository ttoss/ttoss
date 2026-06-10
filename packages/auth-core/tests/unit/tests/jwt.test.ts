import { signJwt, verifyJwt } from 'src/jwt';

const secret = 'test-secret';

test('it should sign and verify a token', () => {
  const token = signJwt({
    payload: { sub: 'user_123', email: 'user@example.com' },
    secret,
    expiresInSeconds: 60,
  });

  expect(token.split('.')).toHaveLength(3);

  const payload = verifyJwt({ token, secret });

  expect(payload).toMatchObject({
    sub: 'user_123',
    email: 'user@example.com',
  });
  expect(typeof payload?.iat).toBe('number');
  expect(typeof payload?.exp).toBe('number');
});

test('it should reject a token signed with another secret', () => {
  const token = signJwt({ payload: { sub: 'user_123' }, secret });
  expect(verifyJwt({ token, secret: 'other-secret' })).toBeNull();
});

test('it should reject a tampered payload', () => {
  const token = signJwt({ payload: { sub: 'user_123' }, secret });
  const [header, , signature] = token.split('.');
  const tamperedBody = Buffer.from(JSON.stringify({ sub: 'user_456' }))
    .toString('base64')
    .replace(/=+$/, '');
  const tampered = `${header}.${tamperedBody}.${signature}`;
  expect(verifyJwt({ token: tampered, secret })).toBeNull();
});

test('it should reject an expired token', () => {
  const token = signJwt({
    payload: { sub: 'user_123' },
    secret,
    expiresInSeconds: -1,
  });
  expect(verifyJwt({ token, secret })).toBeNull();
});

test('it should reject malformed tokens', () => {
  expect(verifyJwt({ token: 'not-a-jwt', secret })).toBeNull();
  expect(verifyJwt({ token: 'a.b', secret })).toBeNull();
  expect(verifyJwt({ token: 'a.b.c', secret })).toBeNull();
});

test('it should not expire tokens without expiresInSeconds', () => {
  const token = signJwt({ payload: { sub: 'user_123' }, secret });
  const payload = verifyJwt({ token, secret });
  expect(payload?.exp).toBeUndefined();
  expect(payload?.sub).toBe('user_123');
});
