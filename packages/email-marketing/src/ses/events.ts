import type { DeliveryEvent } from '../provider';

/**
 * An SES event as SNS delivers it. Both shapes SES publishes are read: event
 * publishing from a configuration set (`eventType`) and identity
 * notifications (`notificationType`).
 */
type SesEvent = {
  eventType?: string;
  notificationType?: string;
  mail?: { tags?: Record<string, string[] | undefined> };
  bounce?: {
    bounceType?: string;
    bounceSubType?: string;
    bouncedRecipients?: Array<{ emailAddress?: string }>;
  };
  complaint?: {
    complaintFeedbackType?: string;
    complainedRecipients?: Array<{ emailAddress?: string }>;
  };
  delivery?: { recipients?: string[] };
};

const addresses = (list?: Array<{ emailAddress?: string }>) => {
  return (list ?? [])
    .map((entry) => {
      return entry.emailAddress;
    })
    .filter((address): address is string => {
      return Boolean(address);
    });
};

/** SES tags arrive as arrays; the engine set one value per name. */
const flattenTags = (tags?: Record<string, string[] | undefined>) => {
  return Object.fromEntries(
    Object.entries(tags ?? {})
      .filter(([, values]) => {
        return Array.isArray(values) && values.length > 0;
      })
      .map(([name, values]) => {
        return [name, (values as string[])[0]];
      })
  ) as Record<string, string>;
};

const BUILDERS: Record<
  string,
  (event: SesEvent, tags: Record<string, string>) => DeliveryEvent
> = {
  Bounce: (event, tags) => {
    return {
      type: 'bounce',
      permanent: event.bounce?.bounceType === 'Permanent',
      recipients: addresses(event.bounce?.bouncedRecipients),
      tags,
      detail: event.bounce?.bounceSubType,
    };
  },
  Complaint: (event, tags) => {
    return {
      type: 'complaint',
      recipients: addresses(event.complaint?.complainedRecipients),
      tags,
      detail: event.complaint?.complaintFeedbackType,
    };
  },
  Delivery: (event, tags) => {
    return {
      type: 'delivery',
      recipients: event.delivery?.recipients ?? [],
      tags,
    };
  },
};

const readEvent = (raw: string): SesEvent | null => {
  try {
    return JSON.parse(raw) as SesEvent;
  } catch {
    return null;
  }
};

/** Turns the `Message` of an SNS notification into delivery events; unknown types become none. */
export const parseSesEvent = (raw: string): DeliveryEvent[] => {
  const event = readEvent(raw);
  const type = event?.eventType ?? event?.notificationType ?? '';
  if (!event || !Object.hasOwn(BUILDERS, type)) {
    return [];
  }
  return [BUILDERS[type](event, flattenTags(event.mail?.tags))];
};
