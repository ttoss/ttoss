import {
  encodeDisplayName,
  formatAddress,
  isValidEmail,
  normalizeEmail,
} from '../../../src';

test('normalizeEmail trims and lowercases, and turns anything else into an empty string', () => {
  expect(normalizeEmail('  Maria@Example.COM ')).toBe('maria@example.com');
  expect(normalizeEmail(undefined)).toBe('');
  expect(normalizeEmail(42)).toBe('');
});

test.each([
  ['a@b.co', true],
  [' A@B.CO ', true],
  ['a@b', false],
  ['a b@c.com', false],
  ['', false],
  [null, false],
])('isValidEmail(%p) is %p', (value, expected) => {
  expect(isValidEmail(value)).toBe(expected);
});

test('formatAddress quotes an ASCII name and escapes quotes and backslashes', () => {
  expect(formatAddress({ name: 'Solar "A"\\B', email: 'a@b.co' })).toBe(
    '"Solar \\"A\\"\\\\B" <a@b.co>'
  );
});

test('formatAddress encodes a non-ASCII name as an RFC 2047 encoded word', () => {
  expect(formatAddress({ name: 'Energia Ômega', email: 'a@b.co' })).toBe(
    `=?UTF-8?B?${Buffer.from('Energia Ômega').toString('base64')}?= <a@b.co>`
  );
});

test('formatAddress drops line breaks so a name cannot inject a header, and omits an empty name', () => {
  expect(formatAddress({ name: 'Acme\r\nBcc: x@y.z', email: 'a@b.co' })).toBe(
    '"Acme Bcc: x@y.z" <a@b.co>'
  );
  expect(formatAddress({ name: '  ', email: 'a@b.co' })).toBe('a@b.co');
  expect(formatAddress({ email: 'a@b.co' })).toBe('a@b.co');
  expect(encodeDisplayName('Acme')).toBe('"Acme"');
});
