import {
  createEmailMarketing,
  type EmailMarketingOptions,
  type EmailProvider,
  readUnsubscribeToken,
} from '../../../src';
import { memoryStore } from './memoryStore';

const secret = 'engine-secret';

const setup = (overrides: Partial<EmailMarketingOptions> = {}) => {
  const { rows, store } = memoryStore();
  const provider = {
    name: 'fake',
    send: jest.fn().mockResolvedValue({ messageId: 'm-1' }),
    parseWebhook: jest.fn(),
  } satisfies EmailProvider;
  const resolveSender = jest
    .fn<
      ReturnType<EmailMarketingOptions['resolveSender']>,
      Parameters<EmailMarketingOptions['resolveSender']>
    >()
    .mockResolvedValue({
      name: 'Solar Alfa',
      email: 'contato@alfa.com.br',
      replyTo: 'Vendas@Alfa.com.br',
    });
  const marketing = createEmailMarketing({
    provider,
    suppressions: { store },
    unsubscribe: {
      secret,
      url: (token) => {
        return `https://api.app.co/unsubscribe?t=${token}`;
      },
    },
    resolveSender,
    ...overrides,
  });
  return { marketing, provider, resolveSender, rows };
};

const message = {
  scope: 'company-1',
  kind: 'welcome',
  to: ' Cliente@Example.com ',
  subject: 'Bem-vindo',
  html: '<p>Olá</p>',
  text: 'Olá',
};

test('sends with the sender, the one-click headers, the footer and the scope tags', async () => {
  const { marketing, provider } = setup();

  const result = await marketing.send({
    ...message,
    tags: { campaign: 'c-1' },
  });

  expect(result).toEqual({
    status: 'sent',
    messageId: 'm-1',
    from: '"Solar Alfa" <contato@alfa.com.br>',
  });
  const [email] = provider.send.mock.calls[0];
  expect(email).toMatchObject({
    from: '"Solar Alfa" <contato@alfa.com.br>',
    to: 'cliente@example.com',
    replyTo: 'vendas@alfa.com.br',
    subject: 'Bem-vindo',
    tags: { campaign: 'c-1', scope: 'company-1', kind: 'welcome' },
  });
  expect(email.html).toMatch(/^<p>Olá<\/p><p .*Unsubscribe<\/a><\/p>$/);
  expect(email.text).toMatch(
    /^Olá\n\n--\nYou received this e-mail from Solar Alfa\. Unsubscribe: https:\/\/api\.app\.co\/unsubscribe\?t=/
  );
  const unsubscribe =
    email.headers.find((h) => {
      return h.name === 'List-Unsubscribe';
    })?.value ?? '';
  const token = new URL(unsubscribe.slice(1, -1)).searchParams.get('t');
  expect(readUnsubscribeToken({ token, secret })).toEqual({
    scope: 'company-1',
    email: 'cliente@example.com',
  });
});

test('omits an invalid reply-to', async () => {
  const { marketing, provider, resolveSender } = setup();
  resolveSender.mockResolvedValueOnce({
    name: 'A',
    email: 'a@a.co',
    replyTo: 'nope',
  });
  await marketing.send(message);
  expect(provider.send.mock.calls[0][0]).not.toHaveProperty('replyTo');
});

test('skips an invalid address before anything else', async () => {
  const { marketing, provider, resolveSender } = setup();
  expect(await marketing.send({ ...message, to: 'nope' })).toEqual({
    status: 'skipped',
    reason: 'invalid_email',
  });
  expect(resolveSender).not.toHaveBeenCalled();
  expect(provider.send).not.toHaveBeenCalled();
});

test('skips a suppressed address', async () => {
  const { marketing, provider } = setup();
  await marketing.suppressions.suppress({
    scope: 'company-1',
    email: 'cliente@example.com',
    reason: 'manual',
  });
  expect(await marketing.send(message)).toEqual({
    status: 'skipped',
    reason: 'suppressed',
  });
  expect(provider.send).not.toHaveBeenCalled();
});

test('skips when canSend says no, and when there is no sender', async () => {
  const canSend = jest.fn().mockResolvedValue(false);
  const { marketing, resolveSender } = setup({ canSend });
  expect(await marketing.send({ ...message, kind: 'campaign' })).toEqual({
    status: 'skipped',
    reason: 'not_allowed',
  });
  expect(canSend).toHaveBeenCalledWith({
    scope: 'company-1',
    kind: 'campaign',
  });
  expect(resolveSender).not.toHaveBeenCalled();

  canSend.mockResolvedValue(true);
  resolveSender.mockResolvedValueOnce(null);
  expect(await marketing.send(message)).toEqual({
    status: 'skipped',
    reason: 'no_sender',
  });
});

test('uses a custom footer', async () => {
  const { marketing, provider } = setup({
    footer: ({ senderName, url }) => {
      return { html: `<p>${senderName}|${url}</p>`, text: `T ${senderName}` };
    },
  });
  await marketing.send(message);
  expect(provider.send.mock.calls[0][0].html).toMatch(
    /<p>Solar Alfa\|https:\/\/api\.app\.co/
  );
  expect(provider.send.mock.calls[0][0].text).toBe('Olá\n\n--\nT Solar Alfa');
});

test('refuses to start without an unsubscribe secret', () => {
  expect(() => {
    return setup({
      unsubscribe: {
        secret: '',
        url: (t) => {
          return t;
        },
      },
    });
  }).toThrow(/secret is required/);
});

test('applyUnsubscribe suppresses the address the token names, and ignores a foreign token', async () => {
  const { marketing, rows } = setup();
  const token = new URL(
    marketing.unsubscribeUrl({ scope: 'company-1', email: 'x@y.co' })
  ).searchParams.get('t');

  expect(await marketing.applyUnsubscribe(token)).toEqual({
    scope: 'company-1',
    email: 'x@y.co',
  });
  expect(rows).toEqual([
    {
      scope: 'company-1',
      email: 'x@y.co',
      reason: 'unsubscribe',
      detail: null,
    },
  ]);
  expect(await marketing.applyUnsubscribe('a.b.c')).toBeNull();
  expect(marketing.readUnsubscribeToken(token)).toEqual({
    scope: 'company-1',
    email: 'x@y.co',
  });
});

test('applyEvents: permanent bounces are global, complaints are per scope, the rest changes nothing', async () => {
  const { marketing, rows } = setup();
  await marketing.applyEvents([
    {
      type: 'bounce',
      permanent: true,
      recipients: ['gone@x.co'],
      tags: { scope: 'company-1' },
      detail: 'General',
    },
    { type: 'bounce', permanent: false, recipients: ['busy@x.co'], tags: {} },
    {
      type: 'complaint',
      recipients: ['angry@x.co'],
      tags: { scope: 'company-2' },
      detail: 'abuse',
    },
    { type: 'complaint', recipients: ['anon@x.co'], tags: {} },
    { type: 'delivery', recipients: ['ok@x.co'], tags: {} },
  ]);
  expect(rows).toEqual([
    { scope: null, email: 'gone@x.co', reason: 'bounce', detail: 'General' },
    {
      scope: 'company-2',
      email: 'angry@x.co',
      reason: 'complaint',
      detail: 'abuse',
    },
    { scope: null, email: 'anon@x.co', reason: 'complaint', detail: null },
  ]);
});

test('handleWebhook confirms subscriptions, applies events and passes rejections through', async () => {
  const { marketing, provider, rows } = setup();
  const confirm = jest.fn().mockResolvedValue(undefined);

  provider.parseWebhook.mockResolvedValueOnce({
    kind: 'confirmation',
    confirm,
  });
  await marketing.handleWebhook({ body: '{}' });
  expect(confirm).toHaveBeenCalled();

  provider.parseWebhook.mockResolvedValueOnce({
    kind: 'events',
    events: [
      { type: 'complaint', recipients: ['a@x.co'], tags: { scope: 's' } },
    ],
  });
  await marketing.handleWebhook({ body: '{}' });
  expect(rows).toHaveLength(1);

  provider.parseWebhook.mockResolvedValueOnce({
    kind: 'rejected',
    reason: 'bad_signature',
  });
  expect(await marketing.handleWebhook({ body: '{}' })).toEqual({
    kind: 'rejected',
    reason: 'bad_signature',
  });
});

test('handleWebhook throws for a provider without webhooks', async () => {
  const { store } = memoryStore();
  const marketing = createEmailMarketing({
    provider: { name: 'bare', send: jest.fn() },
    suppressions: { store },
    unsubscribe: {
      secret,
      url: (t) => {
        return t;
      },
    },
    resolveSender: async () => {
      return null;
    },
  });
  await expect(marketing.handleWebhook({ body: '' })).rejects.toThrow(
    /bare provider has no webhook/
  );
});
