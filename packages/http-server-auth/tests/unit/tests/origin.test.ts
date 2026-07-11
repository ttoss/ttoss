import { isOriginAllowed } from 'src/origin';

test('matches exact string', () => {
  expect(
    isOriginAllowed('http://localhost:3000', ['http://localhost:3000'])
  ).toBe(true);
});

test('rejects non-matching string', () => {
  expect(isOriginAllowed('http://evil.com', ['http://localhost:3000'])).toBe(
    false
  );
});

test('matches RegExp', () => {
  expect(
    isOriginAllowed('https://preview.vercel.app', [/\.vercel\.app$/])
  ).toBe(true);
});

test('rejects non-matching RegExp', () => {
  expect(isOriginAllowed('https://evil.com', [/\.vercel\.app$/])).toBe(false);
});

test('skips undefined entries', () => {
  expect(
    isOriginAllowed('http://localhost:3000', [
      undefined,
      'http://localhost:3000',
    ])
  ).toBe(true);
});

test('returns false for empty allowlist', () => {
  expect(isOriginAllowed('http://localhost:3000', [])).toBe(false);
});

test('matches first of multiple entries', () => {
  expect(
    isOriginAllowed('http://localhost:3000', [
      'http://other.com',
      'http://localhost:3000',
    ])
  ).toBe(true);
});
