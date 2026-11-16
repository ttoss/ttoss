import { createVerify } from 'node:crypto';

/**
 * Verifies a message Amazon SNS posted to an HTTPS endpoint, as AWS documents
 * it: rebuild the canonical string from the message's fields and check the
 * signature against the certificate at `SigningCertURL`, which must be served
 * by SNS itself over HTTPS — otherwise anyone could sign with their own.
 *
 * https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 */
export type SnsMessage = {
  Type: 'Notification' | 'SubscriptionConfirmation' | 'UnsubscribeConfirmation';
  MessageId: string;
  TopicArn: string;
  Message: string;
  Timestamp: string;
  Signature: string;
  SignatureVersion: '1' | '2';
  SigningCertURL: string;
  Subject?: string;
  SubscribeURL?: string;
  Token?: string;
};

const SNS_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com(\.cn)?$/;

/** An https URL on an SNS endpoint: the only place a certificate or a subscription confirmation may come from. */
export const isSnsUrl = (value: unknown, pathSuffix = ''): boolean => {
  try {
    const url = new URL(String(value));
    return (
      url.protocol === 'https:' &&
      SNS_HOST.test(url.hostname) &&
      url.pathname.endsWith(pathSuffix)
    );
  } catch {
    return false;
  }
};

const NOTIFICATION_FIELDS = [
  'Message',
  'MessageId',
  'Subject',
  'Timestamp',
  'TopicArn',
  'Type',
] as const;

const CONFIRMATION_FIELDS = [
  'Message',
  'MessageId',
  'SubscribeURL',
  'Timestamp',
  'Token',
  'TopicArn',
  'Type',
] as const;

/** The canonical string SNS signs for this message. */
export const snsStringToSign = (message: SnsMessage): string => {
  const fields =
    message.Type === 'Notification' ? NOTIFICATION_FIELDS : CONFIRMATION_FIELDS;
  return fields
    .filter((field) => {
      return message[field] !== undefined;
    })
    .map((field) => {
      return `${field}\n${message[field]}\n`;
    })
    .join('');
};

/** Reads the body SNS sent (it says `text/plain`) into a message, or `null`. */
export const parseSnsBody = (body: unknown): SnsMessage | null => {
  let value = body;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const message = value as Partial<SnsMessage> | null;
  return message &&
    typeof message === 'object' &&
    typeof message.Type === 'string' &&
    typeof message.TopicArn === 'string' &&
    typeof message.Signature === 'string' &&
    typeof message.SigningCertURL === 'string'
    ? (message as SnsMessage)
    : null;
};

export type CertificateFetcher = (url: string) => Promise<string>;

/** Fetches a PEM over HTTPS and keeps it: SNS rotates certificates rarely. */
export const createCertificateFetcher = (
  fetcher: typeof fetch = fetch
): CertificateFetcher => {
  const cache = new Map<string, Promise<string>>();
  return (url) => {
    const cached = cache.get(url);
    if (cached) {
      return cached;
    }
    const pending = fetcher(url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`SNS certificate answered ${response.status}`);
      }
      return response.text();
    });
    pending.catch(() => {
      cache.delete(url);
    });
    cache.set(url, pending);
    return pending;
  };
};

/** Whether SNS signed this message. Never throws. */
export const verifySnsMessage = async ({
  message,
  getCertificate,
}: {
  message: SnsMessage;
  getCertificate: CertificateFetcher;
}): Promise<boolean> => {
  if (!isSnsUrl(message.SigningCertURL, '.pem')) {
    return false;
  }
  if (message.SignatureVersion !== '1' && message.SignatureVersion !== '2') {
    return false;
  }
  try {
    const pem = await getCertificate(message.SigningCertURL);
    const verifier = createVerify(
      message.SignatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256'
    );
    verifier.update(snsStringToSign(message), 'utf8');
    return verifier.verify(pem, message.Signature, 'base64');
  } catch {
    return false;
  }
};
