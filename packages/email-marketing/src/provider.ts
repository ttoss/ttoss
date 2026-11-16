import type { DnsRecord, DomainVerification } from './domain';
import type { MessageHeader } from './unsubscribe';

/** One e-mail, ready for a transport. Addresses in `from`/`replyTo` are already formatted. */
export type OutgoingEmail = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  headers: MessageHeader[];
  /** Echoed back on delivery events, so a bounce can be traced to its sender. Keys and values: `[A-Za-z0-9_.@-]`. */
  tags: Record<string, string>;
};

export type DomainIdentity = {
  domain: string;
  verification: DomainVerification;
  /** The records the domain owner creates for the provider to verify it. */
  records: DnsRecord[];
};

/** A delivery event the provider reported, already authenticated. */
export type DeliveryEvent =
  | {
      type: 'bounce';
      /** Only a permanent bounce suppresses the address. */
      permanent: boolean;
      recipients: string[];
      tags: Record<string, string>;
      detail?: string;
    }
  | {
      type: 'complaint';
      recipients: string[];
      tags: Record<string, string>;
      detail?: string;
    }
  | {
      type: 'delivery';
      recipients: string[];
      tags: Record<string, string>;
    };

/** What a webhook request turned out to be. */
export type WebhookResult =
  | { kind: 'rejected'; reason: string }
  | { kind: 'confirmation'; confirm: () => Promise<void> }
  | { kind: 'events'; events: DeliveryEvent[] };

/**
 * A transport the engine can drive. `send` is required; `domains` lets
 * tenants send from their own domain, and `parseWebhook` turns the provider's
 * callbacks into delivery events.
 */
export type EmailProvider = {
  name: string;
  send: (email: OutgoingEmail) => Promise<{ messageId: string | null }>;
  domains?: {
    /** Registers the domain, or reads it when it already exists. */
    create: (domain: string) => Promise<DomainIdentity>;
    /** `null` when the provider does not know the domain. */
    get: (domain: string) => Promise<DomainIdentity | null>;
    delete: (domain: string) => Promise<void>;
  };
  parseWebhook?: (request: {
    body: unknown;
    headers?: Record<string, string | string[] | undefined>;
  }) => Promise<WebhookResult>;
};
