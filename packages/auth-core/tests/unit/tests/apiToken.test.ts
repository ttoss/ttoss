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

test('it should generate a base62 token as long as the hex one', () => {
  const { token, tokenHash, displayPrefix } = generateApiToken({
    prefix: 'myapp',
    encoding: 'base62',
  });

  expect(token).toMatch(/^myapp_[0-9A-Za-z]{64}$/);
  expect(tokenHash).toBe(hashApiToken(token));
  expect(displayPrefix).toBe(token.slice(0, 12));
  expect(verifyApiToken({ token, tokenHash })).toBe(true);
});

test('it should size a base62 token by bytes like a hex one', () => {
  const { token } = generateApiToken({
    prefix: 'myapp',
    bytes: 8,
    encoding: 'base62',
  });

  expect(token).toMatch(/^myapp_[0-9A-Za-z]{16}$/);
});

test('it should draw every base62 character', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    const { token } = generateApiToken({ prefix: 'p', encoding: 'base62' });
    for (const char of token.slice(2)) {
      seen.add(char);
    }
  }

  expect(seen.size).toBe(62);
});
