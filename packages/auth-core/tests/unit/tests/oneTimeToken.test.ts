import {
  generateOneTimeToken,
  hashOneTimeToken,
  verifyOneTimeToken,
} from 'src/oneTimeToken';

test('it should generate and verify a token', () => {
  const { token, tokenHash, expires } = generateOneTimeToken();

  expect(token).toHaveLength(64);
  expect(tokenHash).toBe(hashOneTimeToken(token));
  expect(expires.getTime()).toBeGreaterThan(Date.now());

  expect(verifyOneTimeToken({ token, tokenHash, expires })).toBe(true);
});

test('it should reject a wrong token', () => {
  const { tokenHash, expires } = generateOneTimeToken();
  const { token: otherToken } = generateOneTimeToken();

  expect(verifyOneTimeToken({ token: otherToken, tokenHash, expires })).toBe(
    false
  );
});

test('it should reject an expired token', () => {
  const { token, tokenHash } = generateOneTimeToken();

  expect(
    verifyOneTimeToken({
      token,
      tokenHash,
      expires: new Date(Date.now() - 1000),
    })
  ).toBe(false);
});

test('it should respect bytes and expiresInSeconds options', () => {
  const { token, expires } = generateOneTimeToken({
    bytes: 16,
    expiresInSeconds: 60,
  });

  expect(token).toHaveLength(32);
  expect(expires.getTime()).toBeLessThanOrEqual(Date.now() + 61 * 1000);
});
