import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  GetEmailIdentityCommand,
  type GetEmailIdentityCommandOutput,
  SendEmailCommand,
  SESv2Client,
} from '@aws-sdk/client-sesv2';

import type { DnsRecord, DomainVerification } from '../domain';
import type { DomainIdentity, EmailProvider, OutgoingEmail } from '../provider';
import { parseSesEvent } from './events';
import {
  type CertificateFetcher,
  createCertificateFetcher,
  isSnsUrl,
  parseSnsBody,
  type SnsMessage,
  verifySnsMessage,
} from './sns';

export { parseSesEvent } from './events';
export {
  type CertificateFetcher,
  createCertificateFetcher,
  isSnsUrl,
  parseSnsBody,
  type SnsMessage,
  snsStringToSign,
  verifySnsMessage,
} from './sns';

export type SesProviderOptions = {
  /** A client of your own (credentials, retries); otherwise one is built for `region`. */
  client?: Pick<SESv2Client, 'send'>;
  region?: string;
  /** The configuration set whose event destination publishes bounces and complaints to SNS. */
  configurationSet?: string;
  /** The only SNS topic whose messages `parseWebhook` accepts. Required to receive events. */
  topicArn?: string;
  /** Used to fetch SNS certificates and confirm subscriptions. */
  fetch?: typeof fetch;
};

type SesClient = Pick<SESv2Client, 'send'>;

/** The three Easy DKIM CNAMEs SES gives for a domain, plus a recommended DMARC record. */
export const sesDkimRecords = ({
  domain,
  tokens,
}: {
  domain: string;
  tokens: string[];
}): DnsRecord[] => {
  return [
    ...tokens.map((token) => {
      return {
        type: 'CNAME' as const,
        name: `${token}._domainkey.${domain}`,
        value: `${token}.dkim.amazonses.com`,
      };
    }),
    {
      type: 'TXT',
      name: `_dmarc.${domain}`,
      value: 'v=DMARC1; p=none;',
      optional: true,
    },
  ];
};

const errorName = (error: unknown) => {
  return (error as { name?: string } | null)?.name ?? '';
};

const toIdentity = ({
  domain,
  output,
}: {
  domain: string;
  output: Pick<
    GetEmailIdentityCommandOutput,
    'VerifiedForSendingStatus' | 'DkimAttributes'
  >;
}): DomainIdentity => {
  const status = output.DkimAttributes?.Status;
  const verification: DomainVerification = output.VerifiedForSendingStatus
    ? 'verified'
    : status === 'FAILED'
      ? 'failed'
      : 'pending';
  return {
    domain,
    verification,
    records: sesDkimRecords({
      domain,
      tokens: output.DkimAttributes?.Tokens ?? [],
    }),
  };
};

/** SES tag names and values allow only `[A-Za-z0-9_.@-]`, up to 256 characters. */
const sesTagValue = (value: string) => {
  return value.replace(/[^A-Za-z0-9_.@-]/g, '_').slice(0, 256);
};

const sendWith = ({
  ses,
  configurationSet,
}: {
  ses: () => SesClient;
  configurationSet?: string;
}) => {
  return async (email: OutgoingEmail) => {
    const output = await ses().send(
      new SendEmailCommand({
        FromEmailAddress: email.from,
        Destination: { ToAddresses: [email.to] },
        ...(email.replyTo && { ReplyToAddresses: [email.replyTo] }),
        Content: {
          Simple: {
            Subject: { Data: email.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: email.html, Charset: 'UTF-8' },
              Text: { Data: email.text, Charset: 'UTF-8' },
            },
            Headers: email.headers.map((header) => {
              return { Name: header.name, Value: header.value };
            }),
          },
        },
        ...(configurationSet && { ConfigurationSetName: configurationSet }),
        EmailTags: Object.entries(email.tags).map(([name, value]) => {
          return { Name: sesTagValue(name), Value: sesTagValue(value) };
        }),
      })
    );
    return { messageId: output.MessageId ?? null };
  };
};

const domainsWith = (ses: () => SesClient) => {
  const get = async (domain: string) => {
    try {
      const output = await ses().send(
        new GetEmailIdentityCommand({ EmailIdentity: domain })
      );
      return toIdentity({ domain, output });
    } catch (error) {
      if (errorName(error) === 'NotFoundException') {
        return null;
      }
      throw error;
    }
  };

  const create = async (domain: string) => {
    try {
      const output = await ses().send(
        new CreateEmailIdentityCommand({ EmailIdentity: domain })
      );
      return toIdentity({ domain, output });
    } catch (error) {
      if (errorName(error) !== 'AlreadyExistsException') {
        throw error;
      }
      const existing = await get(domain);
      if (!existing) {
        throw error;
      }
      return existing;
    }
  };

  const remove = async (domain: string) => {
    try {
      await ses().send(
        new DeleteEmailIdentityCommand({ EmailIdentity: domain })
      );
    } catch (error) {
      if (errorName(error) !== 'NotFoundException') {
        throw error;
      }
    }
  };

  return { create, get, delete: remove };
};

const confirmWith = ({
  message,
  fetcher,
}: {
  message: SnsMessage;
  fetcher: typeof fetch;
}) => {
  return async () => {
    if (!isSnsUrl(message.SubscribeURL)) {
      throw new Error('SubscribeURL is not an SNS endpoint');
    }
    const response = await fetcher(String(message.SubscribeURL));
    if (!response.ok) {
      throw new Error(
        `SNS subscription confirmation answered ${response.status}`
      );
    }
  };
};

const webhookWith = ({
  topicArn,
  fetcher,
  getCertificate,
}: {
  topicArn?: string;
  fetcher: typeof fetch;
  getCertificate: CertificateFetcher;
}): NonNullable<EmailProvider['parseWebhook']> => {
  return async ({ body }) => {
    if (!topicArn) {
      return { kind: 'rejected', reason: 'no_topic_configured' };
    }
    const message = parseSnsBody(body);
    if (!message) {
      return { kind: 'rejected', reason: 'unreadable' };
    }
    if (message.TopicArn !== topicArn) {
      return { kind: 'rejected', reason: 'wrong_topic' };
    }
    if (!(await verifySnsMessage({ message, getCertificate }))) {
      return { kind: 'rejected', reason: 'bad_signature' };
    }
    if (message.Type === 'SubscriptionConfirmation') {
      return {
        kind: 'confirmation',
        confirm: confirmWith({ message, fetcher }),
      };
    }
    return {
      kind: 'events',
      events:
        message.Type === 'Notification' ? parseSesEvent(message.Message) : [],
    };
  };
};

/**
 * Amazon SES (v2) as an `EmailProvider`: sending, domain identities with Easy
 * DKIM, and bounces/complaints from an SNS topic.
 *
 * Needs `@aws-sdk/client-sesv2` installed (an optional peer dependency) and,
 * for the IAM role, `ses:SendEmail`, `ses:CreateEmailIdentity`,
 * `ses:GetEmailIdentity` and `ses:DeleteEmailIdentity`.
 *
 * @example
 * ```ts
 * const provider = sesProvider({
 *   region: 'us-east-1',
 *   configurationSet: 'marketing',
 *   topicArn: 'arn:aws:sns:us-east-1:123456789012:email-events',
 * });
 * ```
 */
export const sesProvider = ({
  client: givenClient,
  region,
  configurationSet,
  topicArn,
  fetch: fetcher = fetch,
}: SesProviderOptions = {}): EmailProvider => {
  let client = givenClient;
  const ses = () => {
    client ??= new SESv2Client({ region });
    return client;
  };

  return {
    name: 'ses',
    send: sendWith({ ses, configurationSet }),
    domains: domainsWith(ses),
    parseWebhook: webhookWith({
      topicArn,
      fetcher,
      getCertificate: createCertificateFetcher(fetcher),
    }),
  };
};
