import { generateApiToken, hashApiToken, verifyApiToken } from 'src/apiToken';

test('it should generate a prefixed token with hash and display prefix', () => {
  const { token, tokenHash, displayPrefix } = generateApiToken({
    prefix: 'myapp',
  });

  expect(token.startsWith('myapp_')).toBe(true);
  expect(token).toHaveLength('myapp_'.length + 64);
  expect(tokenHash).toBe(hashApiToken(token));
  expect(displayPrefix).toBe(token.slice(0, 12));
});

test('it should verify a valid token', () => {
  const { token, tokenHash } = generateApiToken({ prefix: 'myapp' });
  expect(verifyApiToken({ token, tokenHash })).toBe(true);
});

test('it should reject a wrong token', () => {
  const { tokenHash } = generateApiToken({ prefix: 'myapp' });
  const { token: otherToken } = generateApiToken({ prefix: 'myapp' });
  expect(verifyApiToken({ token: otherToken, tokenHash })).toBe(false);
});

test('it should respect expiresAt', () => {
  const { token, tokenHash } = generateApiToken({ prefix: 'myapp' });

  expect(
    verifyApiToken({ token, tokenHash, expiresAt: new Date(Date.now() - 1) })
  ).toBe(false);

  expect(
    verifyApiToken({
      token,
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
    })
  ).toBe(true);

  expect(verifyApiToken({ token, tokenHash, expiresAt: null })).toBe(true);
});
