import { createSign, generateKeyPairSync } from 'node:crypto';

import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  GetEmailIdentityCommand,
  SendEmailCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2';

import {
  createCertificateFetcher,
  isSnsUrl,
  parseSesEvent,
  parseSnsBody,
  sesDkimRecords,
  sesProvider,
  type SnsMessage,
  snsStringToSign,
  verifySnsMessage,
} from '../../../../src/ses';

const TOPIC = 'arn:aws:sns:us-east-1:123456789012:email-events';
const CERT =
  'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-abc.pem';
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const pem = publicKey.export({ type: 'spki', format: 'pem' }) as string;

const awsError = (name: string) => {
  return Object.assign(new Error(name), { name });
};

const fakeFetch = () => {
  return jest.fn(async (url: string | URL | Request) => {
    const href = String(url);
    if (href === CERT) return new Response(pem);
    if (
      href.startsWith(
        'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription'
      )
    )
      return new Response('ok');
    return new Response('', { status: 404 });
  }) as jest.Mock & typeof fetch;
};

const signed = (
  fields: Partial<SnsMessage>,
  version: '1' | '2' = '2'
): SnsMessage => {
  const message = {
    Type: 'Notification',
    MessageId: 'm-1',
    TopicArn: TOPIC,
    Message: '{}',
    Timestamp: '2026-11-16T10:00:00.000Z',
    SignatureVersion: version,
    SigningCertURL: CERT,
    Signature: '',
    ...fields,
  } as SnsMessage;
  const signer = createSign(version === '1' ? 'RSA-SHA1' : 'RSA-SHA256');
  signer.update(snsStringToSign(message));
  return { ...message, Signature: signer.sign(privateKey, 'base64') };
};

const setup = (options: Parameters<typeof sesProvider>[0] = {}) => {
  const send = jest.fn();
  const fetcher = fakeFetch();
  const provider = sesProvider({
    client: { send } as unknown as SESv2Client,
    topicArn: TOPIC,
    configurationSet: 'marketing',
    fetch: fetcher,
    ...options,
  });
  return { provider, send, fetcher };
};

describe('send', () => {
  test('maps the e-mail to SendEmail, with headers, configuration set and sanitized tags', async () => {
    const { provider, send } = setup();
    send.mockResolvedValue({ MessageId: 'ses-1' });

    const result = await provider.send({
      from: '"A" <a@a.co>',
      to: 'b@b.co',
      replyTo: 'r@a.co',
      subject: 'S',
      html: '<p>H</p>',
      text: 'T',
      headers: [{ name: 'List-Unsubscribe', value: '<https://u>' }],
      tags: { scope: 'company 1', kind: 'welcome' },
    });

    expect(result).toEqual({ messageId: 'ses-1' });
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input).toEqual({
      FromEmailAddress: '"A" <a@a.co>',
      Destination: { ToAddresses: ['b@b.co'] },
      ReplyToAddresses: ['r@a.co'],
      Content: {
        Simple: {
          Subject: { Data: 'S', Charset: 'UTF-8' },
          Body: {
            Html: { Data: '<p>H</p>', Charset: 'UTF-8' },
            Text: { Data: 'T', Charset: 'UTF-8' },
          },
          Headers: [{ Name: 'List-Unsubscribe', Value: '<https://u>' }],
        },
      },
      ConfigurationSetName: 'marketing',
      EmailTags: [
        { Name: 'scope', Value: 'company_1' },
        { Name: 'kind', Value: 'welcome' },
      ],
    });
  });

  test('leaves out reply-to and configuration set when absent, and a missing message id is null', async () => {
    const { provider, send } = setup({ configurationSet: undefined });
    send.mockResolvedValue({});
    const result = await provider.send({
      from: 'a@a.co',
      to: 'b@b.co',
      subject: 'S',
      html: '',
      text: '',
      headers: [],
      tags: {},
    });
    expect(result).toEqual({ messageId: null });
    expect(send.mock.calls[0][0].input).not.toHaveProperty('ReplyToAddresses');
    expect(send.mock.calls[0][0].input).not.toHaveProperty(
      'ConfigurationSetName'
    );
  });

  test('builds its own client when none is given', () => {
    const provider = sesProvider({ region: 'us-east-1' });
    expect(provider.name).toBe('ses');
    jest
      .spyOn(SESv2Client.prototype, 'send')
      .mockResolvedValue({ MessageId: 'own' } as never);
    return expect(
      provider.send({
        from: 'a@a.co',
        to: 'b@b.co',
        subject: '',
        html: '',
        text: '',
        headers: [],
        tags: {},
      })
    ).resolves.toEqual({ messageId: 'own' });
  });
});

describe('domains', () => {
  test('create registers the identity and returns the DKIM records', async () => {
    const { provider, send } = setup();
    send.mockResolvedValue({
      VerifiedForSendingStatus: false,
      DkimAttributes: { Status: 'PENDING', Tokens: ['t1', 't2', 't3'] },
    });

    const identity = await provider.domains!.create('alfa.com.br');

    expect(send.mock.calls[0][0]).toBeInstanceOf(CreateEmailIdentityCommand);
    expect(send.mock.calls[0][0].input).toEqual({
      EmailIdentity: 'alfa.com.br',
    });
    expect(identity.verification).toBe('pending');
    expect(identity.records).toEqual(
      sesDkimRecords({ domain: 'alfa.com.br', tokens: ['t1', 't2', 't3'] })
    );
    expect(identity.records[0]).toEqual({
      type: 'CNAME',
      name: 't1._domainkey.alfa.com.br',
      value: 't1.dkim.amazonses.com',
    });
    expect(identity.records[3]).toMatchObject({
      type: 'TXT',
      name: '_dmarc.alfa.com.br',
      optional: true,
    });
  });

  test('create reads an identity that already exists', async () => {
    const { provider, send } = setup();
    send
      .mockRejectedValueOnce(awsError('AlreadyExistsException'))
      .mockResolvedValueOnce({
        VerifiedForSendingStatus: true,
        DkimAttributes: { Status: 'SUCCESS', Tokens: ['t'] },
      });
    expect((await provider.domains!.create('alfa.com.br')).verification).toBe(
      'verified'
    );
    expect(send.mock.calls[1][0]).toBeInstanceOf(GetEmailIdentityCommand);
  });

  test('create rethrows other errors, and AlreadyExists for an identity that then vanished', async () => {
    const { provider, send } = setup();
    send.mockRejectedValueOnce(awsError('LimitExceededException'));
    await expect(provider.domains!.create('a.co')).rejects.toThrow(
      'LimitExceededException'
    );
    send
      .mockRejectedValueOnce(awsError('AlreadyExistsException'))
      .mockRejectedValueOnce(awsError('NotFoundException'));
    await expect(provider.domains!.create('a.co')).rejects.toThrow(
      'AlreadyExistsException'
    );
  });

  test('get maps FAILED DKIM to failed, a missing identity to null, and rethrows the rest', async () => {
    const { provider, send } = setup();
    send.mockResolvedValueOnce({ DkimAttributes: { Status: 'FAILED' } });
    expect(await provider.domains!.get('a.co')).toEqual({
      domain: 'a.co',
      verification: 'failed',
      records: sesDkimRecords({ domain: 'a.co', tokens: [] }),
    });
    send.mockRejectedValueOnce(awsError('NotFoundException'));
    expect(await provider.domains!.get('a.co')).toBeNull();
    send.mockRejectedValueOnce(new Error('network down'));
    await expect(provider.domains!.get('a.co')).rejects.toThrow('network down');
  });

  test('delete removes the identity and ignores one already gone', async () => {
    const { provider, send } = setup();
    send.mockResolvedValueOnce({});
    await provider.domains!.delete('a.co');
    expect(send.mock.calls[0][0]).toBeInstanceOf(DeleteEmailIdentityCommand);
    send.mockRejectedValueOnce(awsError('NotFoundException'));
    await expect(provider.domains!.delete('a.co')).resolves.toBeUndefined();
    send.mockRejectedValueOnce(awsError('AccessDenied'));
    await expect(provider.domains!.delete('a.co')).rejects.toThrow(
      'AccessDenied'
    );
  });
});

describe('parseWebhook', () => {
  const bounce = JSON.stringify({
    eventType: 'Bounce',
    mail: { tags: { scope: ['company-1'], empty: [] } },
    bounce: {
      bounceType: 'Permanent',
      bounceSubType: 'General',
      bouncedRecipients: [{ emailAddress: 'gone@x.co' }, {}],
    },
  });

  test('turns a signed SES bounce into a delivery event (signature v1 and v2)', async () => {
    const { provider } = setup();
    for (const version of ['1', '2'] as const) {
      const result = await provider.parseWebhook!({
        body: JSON.stringify(
          signed({ Message: bounce, Subject: 'x' }, version)
        ),
      });
      expect(result).toEqual({
        kind: 'events',
        events: [
          {
            type: 'bounce',
            permanent: true,
            recipients: ['gone@x.co'],
            tags: { scope: 'company-1' },
            detail: 'General',
          },
        ],
      });
    }
  });

  test('accepts an already parsed body', async () => {
    const { provider } = setup();
    const result = await provider.parseWebhook!({
      body: signed({
        Message:
          '{"notificationType":"Complaint","complaint":{"complainedRecipients":[{"emailAddress":"a@x.co"}]}}',
      }),
    });
    expect(result).toEqual({
      kind: 'events',
      events: [
        {
          type: 'complaint',
          recipients: ['a@x.co'],
          tags: {},
          detail: undefined,
        },
      ],
    });
  });

  test.each([
    [
      'no topic configured',
      { topicArn: undefined },
      () => {
        return signed({});
      },
      'no_topic_configured',
    ],
    [
      'an unreadable body',
      {},
      () => {
        return 'not json';
      },
      'unreadable',
    ],
    [
      'another topic',
      {},
      () => {
        return signed({ TopicArn: 'arn:aws:sns:us-east-1:1:other' });
      },
      'wrong_topic',
    ],
    [
      'a forged signature',
      {},
      () => {
        return { ...signed({}), Signature: 'AAAA' };
      },
      'bad_signature',
    ],
    [
      'a certificate off SNS',
      {},
      () => {
        return signed({ SigningCertURL: 'https://evil.example.com/x.pem' });
      },
      'bad_signature',
    ],
    [
      'an unknown signature version',
      {},
      () => {
        return { ...signed({}), SignatureVersion: '3' };
      },
      'bad_signature',
    ],
  ])('rejects %s', async (_label, options, body, reason) => {
    const { provider } = setup(options as Parameters<typeof sesProvider>[0]);
    const raw = body();
    expect(
      await provider.parseWebhook!({
        body: typeof raw === 'string' ? raw : JSON.stringify(raw),
      })
    ).toEqual({ kind: 'rejected', reason });
  });

  test('a subscription confirmation is confirmed only against SNS', async () => {
    const { provider, fetcher } = setup();
    const confirmation = signed({
      Type: 'SubscriptionConfirmation',
      SubscribeURL:
        'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&Token=x',
      Token: 'x',
    });
    const result = await provider.parseWebhook!({
      body: JSON.stringify(confirmation),
    });
    expect(result.kind).toBe('confirmation');
    await (result as { confirm: () => Promise<void> }).confirm();
    expect(fetcher).toHaveBeenCalledWith(confirmation.SubscribeURL);

    const evil = await provider.parseWebhook!({
      body: JSON.stringify(
        signed({
          Type: 'SubscriptionConfirmation',
          SubscribeURL: 'https://evil.example.com/',
          Token: 'x',
        })
      ),
    });
    await expect(
      (evil as { confirm: () => Promise<void> }).confirm()
    ).rejects.toThrow(/not an SNS endpoint/);

    const failing = await provider.parseWebhook!({
      body: JSON.stringify(
        signed({
          Type: 'SubscriptionConfirmation',
          SubscribeURL: 'https://sns.us-east-1.amazonaws.com/other',
          Token: 'x',
        })
      ),
    });
    await expect(
      (failing as { confirm: () => Promise<void> }).confirm()
    ).rejects.toThrow(/answered 404/);
  });

  test('an unsubscribe confirmation yields no events', async () => {
    const { provider } = setup();
    expect(
      await provider.parseWebhook!({
        body: JSON.stringify(
          signed({
            Type: 'UnsubscribeConfirmation',
            Token: 'x',
            SubscribeURL: 'https://sns.us-east-1.amazonaws.com/',
          })
        ),
      })
    ).toEqual({ kind: 'events', events: [] });
  });
});

describe('parseSesEvent', () => {
  test('reads transient bounces, deliveries, and ignores unknown or broken messages', () => {
    expect(
      parseSesEvent(
        '{"eventType":"Bounce","bounce":{"bounceType":"Transient"}}'
      )
    ).toEqual([
      {
        type: 'bounce',
        permanent: false,
        recipients: [],
        tags: {},
        detail: undefined,
      },
    ]);
    expect(
      parseSesEvent(
        '{"eventType":"Delivery","delivery":{"recipients":["a@x.co"]},"mail":{"tags":{"kind":["welcome"]}}}'
      )
    ).toEqual([
      { type: 'delivery', recipients: ['a@x.co'], tags: { kind: 'welcome' } },
    ]);
    expect(parseSesEvent('{"eventType":"Delivery"}')).toEqual([
      { type: 'delivery', recipients: [], tags: {} },
    ]);
    expect(parseSesEvent('{"eventType":"Open"}')).toEqual([]);
    expect(parseSesEvent('not json')).toEqual([]);
  });
});

describe('SNS helpers', () => {
  test('isSnsUrl accepts only https SNS hosts', () => {
    expect(isSnsUrl(CERT, '.pem')).toBe(true);
    expect(
      isSnsUrl('https://sns.cn-north-1.amazonaws.com.cn/x.pem', '.pem')
    ).toBe(true);
    expect(isSnsUrl('http://sns.us-east-1.amazonaws.com/x.pem')).toBe(false);
    expect(isSnsUrl('https://sns.us-east-1.amazonaws.com.evil.com/x.pem')).toBe(
      false
    );
    expect(isSnsUrl('not a url')).toBe(false);
  });

  test('parseSnsBody needs the signed fields', () => {
    expect(parseSnsBody({ Type: 'Notification' })).toBeNull();
    expect(parseSnsBody(null)).toBeNull();
    expect(parseSnsBody(signed({}))).not.toBeNull();
  });

  test('the certificate fetcher caches a PEM and forgets a failure', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValue(new Response(pem));
    const getCertificate = createCertificateFetcher(fetcher);
    await expect(getCertificate(CERT)).rejects.toThrow(/answered 500/);
    expect(await getCertificate(CERT)).toBe(pem);
    expect(await getCertificate(CERT)).toBe(pem);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  test('verifySnsMessage is false when the certificate cannot be fetched', async () => {
    const getCertificate = jest.fn().mockRejectedValue(new Error('down'));
    expect(
      await verifySnsMessage({ message: signed({}), getCertificate })
    ).toBe(false);
  });
});
