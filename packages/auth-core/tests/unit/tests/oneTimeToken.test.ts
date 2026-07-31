import {
  generateOneTimeToken,
  hashOneTimeToken,
  MAX_NUMERIC_DIGITS,
  MIN_NUMERIC_DIGITS,
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

test('it should generate a six-digit numeric code by default', () => {
  const { token, tokenHash, expires } = generateOneTimeToken({
    format: 'numeric',
  });

  expect(token).toMatch(/^\d{6}$/);
  expect(tokenHash).toBe(hashOneTimeToken(token));
  expect(verifyOneTimeToken({ token, tokenHash, expires })).toBe(true);
});

test('it should default a numeric code to a ten-minute lifetime', () => {
  const { expires } = generateOneTimeToken({ format: 'numeric' });

  expect(expires.getTime()).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(Date.now() + 10 * 60 * 1000);
});

test('it should respect the digits option', () => {
  for (const digits of [MIN_NUMERIC_DIGITS, 8, MAX_NUMERIC_DIGITS]) {
    const { token } = generateOneTimeToken({ format: 'numeric', digits });

    expect(token).toHaveLength(digits);
    expect(token).toMatch(/^\d+$/);
  }
});

test('it should reject a digits option outside the supported range', () => {
  for (const digits of [MIN_NUMERIC_DIGITS - 1, MAX_NUMERIC_DIGITS + 1, 6.5]) {
    expect(() => {
      return generateOneTimeToken({ format: 'numeric', digits });
    }).toThrow('digits must be an integer');
  }
});

test('it should reject a wrong numeric code', () => {
  const { token, tokenHash, expires } = generateOneTimeToken({
    format: 'numeric',
  });

  const wrong = token === '000000' ? '111111' : '000000';

  expect(verifyOneTimeToken({ token: wrong, tokenHash, expires })).toBe(false);
});

/**
 * Rejection sampling exists so that `byte % 10` stays uniform. A biased
 * implementation (plain modulo over 0-255) over-produces `0-5` by ~20%, which
 * this margin catches while staying far enough from the mean that a fair
 * generator effectively never trips it.
 */
test('it should distribute numeric digits without modulo bias', () => {
  const counts = new Array<number>(10).fill(0);
  const draws = 4000;

  for (let index = 0; index < draws; index += 1) {
    for (const digit of generateOneTimeToken({ format: 'numeric', digits: 6 })
      .token) {
      counts[Number(digit)] += 1;
    }
  }

  const expected = (draws * 6) / 10;

  for (const count of counts) {
    expect(count).toBeGreaterThan(expected * 0.88);
    expect(count).toBeLessThan(expected * 1.12);
  }
});
