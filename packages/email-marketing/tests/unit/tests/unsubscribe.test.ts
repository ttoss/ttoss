import {
  createUnsubscribeToken,
  defaultFooter,
  escapeHtml,
  readUnsubscribeToken,
  unsubscribeHeaders,
} from '../../../src';

const secret = 'test-secret';

test('a token names its scope and address and reads back only with the same secret', () => {
  const token = createUnsubscribeToken({
    scope: 'company-1',
    email: 'x@y.co',
    secret,
  });
  expect(readUnsubscribeToken({ token, secret })).toEqual({
    scope: 'company-1',
    email: 'x@y.co',
  });
  expect(readUnsubscribeToken({ token, secret: 'other' })).toBeNull();
});

test('an edited token is refused', () => {
  const token = createUnsubscribeToken({
    scope: 'company-1',
    email: 'x@y.co',
    secret,
  });
  expect(
    readUnsubscribeToken({
      token: token.replace('company-1', 'company-2'),
      secret,
    })
  ).toBeNull();
  const [scope, , signature] = token.split('.');
  const otherEmail = Buffer.from('z@y.co').toString('base64url');
  expect(
    readUnsubscribeToken({
      token: `${scope}.${otherEmail}.${signature}`,
      secret,
    })
  ).toBeNull();
});

test.each([undefined, 42, 'garbage', 'a.b', 'a.b.c.d'])(
  'readUnsubscribeToken refuses %p',
  (token) => {
    expect(readUnsubscribeToken({ token, secret })).toBeNull();
  }
);

test('readUnsubscribeToken refuses everything without a secret', () => {
  const token = createUnsubscribeToken({ scope: 's', email: 'x@y.co', secret });
  expect(readUnsubscribeToken({ token, secret: '' })).toBeNull();
});

test('a signed token whose payload is not an address is refused', () => {
  const { createHmac } = jest.requireActual('node:crypto');
  const payload = `s.${Buffer.from('not-an-address').toString('base64url')}`;
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  expect(
    readUnsubscribeToken({ token: `${payload}.${signature}`, secret })
  ).toBeNull();
});

test('createUnsubscribeToken needs a secret and a scope without dots', () => {
  expect(() => {
    return createUnsubscribeToken({ scope: 's', email: 'x@y.co', secret: '' });
  }).toThrow(/secret/);
  expect(() => {
    return createUnsubscribeToken({ scope: 'a.b', email: 'x@y.co', secret });
  }).toThrow(/scope/);
  expect(() => {
    return createUnsubscribeToken({ scope: '', email: 'x@y.co', secret });
  }).toThrow(/scope/);
});

test('unsubscribeHeaders are the RFC 8058 one-click pair', () => {
  expect(unsubscribeHeaders('https://a.co/u?t=1')).toEqual([
    { name: 'List-Unsubscribe', value: '<https://a.co/u?t=1>' },
    { name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
  ]);
});

test('the default footer escapes the sender name and the link in HTML', () => {
  const footer = defaultFooter({
    senderName: 'A & <B>',
    url: 'https://a.co/u?t=1&x="2"',
  });
  expect(footer.html).toContain('A &amp; &lt;B&gt;');
  expect(footer.html).toContain(
    'href="https://a.co/u?t=1&amp;x=&quot;2&quot;"'
  );
  expect(footer.text).toBe(
    'You received this e-mail from A & <B>. Unsubscribe: https://a.co/u?t=1&x="2"'
  );
  expect(escapeHtml("'")).toBe('&#39;');
});
