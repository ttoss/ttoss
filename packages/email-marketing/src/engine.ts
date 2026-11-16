import { formatAddress, isValidEmail, normalizeEmail } from './address';
import type { DeliveryEvent, EmailProvider } from './provider';
import {
  createSuppressionList,
  type SuppressionList,
  type SuppressionListOptions,
} from './suppression';
import {
  createUnsubscribeToken,
  defaultFooter,
  type FooterRenderer,
  readUnsubscribeToken,
  unsubscribeHeaders,
} from './unsubscribe';

/** Who an e-mail comes from. `null` from `resolveSender` means this sender cannot send this kind now. */
export type Sender = {
  name: string;
  email: string;
  replyTo?: string | null;
};

/**
 * What kind of e-mail is being sent. The engine treats them alike; your
 * `resolveSender` and `canSend` decide, e.g. a welcome e-mail may come from a
 * shared domain while campaigns need the tenant's own.
 */
export type EmailKind = string;

export type SendSkipReason =
  'invalid_email' | 'suppressed' | 'not_allowed' | 'no_sender';

export type SendResult =
  | { status: 'sent'; messageId: string | null; from: string }
  | { status: 'skipped'; reason: SendSkipReason };

/** The tag every e-mail carries with its scope, read back from delivery events. */
export const SCOPE_TAG = 'scope';
export const KIND_TAG = 'kind';

export type EmailMarketingOptions = {
  provider: EmailProvider;
  suppressions: SuppressionListOptions;
  unsubscribe: {
    /** Signs the links. Keep it stable: rotating it breaks every link already sent. */
    secret: string;
    /** The public URL of your unsubscribe endpoint for a token, e.g. `https://api.app.com/unsubscribe?t=${token}`. */
    url: (token: string) => string;
  };
  /** Who sends for `scope`. Return `null` to skip with `no_sender`. */
  resolveSender: (args: {
    scope: string;
    kind: EmailKind;
  }) => Promise<Sender | null>;
  /** A permission check (plan, quota, pause). Defaults to always allowed. */
  canSend?: (args: { scope: string; kind: EmailKind }) => Promise<boolean>;
  /** The unsubscribe footer appended to every e-mail. Defaults to English. */
  footer?: FooterRenderer;
};

export type EmailMarketing = ReturnType<typeof createEmailMarketing>;

export type SendInput = {
  scope: string;
  kind: EmailKind;
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Record<string, string>;
};

/** The checks before an e-mail may go: the first that fails is the skip reason. */
const checkSend = async ({
  options,
  suppressions,
  scope,
  kind,
  email,
}: {
  options: EmailMarketingOptions;
  suppressions: SuppressionList;
  scope: string;
  kind: EmailKind;
  email: string;
}): Promise<{ sender: Sender } | { reason: SendSkipReason }> => {
  if (!isValidEmail(email)) {
    return { reason: 'invalid_email' };
  }
  if (await suppressions.isSuppressed({ scope, email })) {
    return { reason: 'suppressed' };
  }
  if (options.canSend && !(await options.canSend({ scope, kind }))) {
    return { reason: 'not_allowed' };
  }
  const sender = await options.resolveSender({ scope, kind });
  return sender ? { sender } : { reason: 'no_sender' };
};

/** Every delivery event's effect on the suppression list. */
const applyEventsTo = async ({
  suppressions,
  events,
}: {
  suppressions: SuppressionList;
  events: DeliveryEvent[];
}) => {
  for (const event of events) {
    const target =
      event.type === 'bounce' && event.permanent
        ? { scope: null, reason: 'bounce' as const, detail: event.detail }
        : event.type === 'complaint'
          ? {
              scope: event.tags[SCOPE_TAG] ?? null,
              reason: 'complaint' as const,
              detail: event.detail,
            }
          : null;
    if (!target) {
      continue;
    }
    for (const email of event.recipients) {
      await suppressions.suppress({ ...target, email });
    }
  }
  return events;
};

/** The unsubscribe link of one recipient of one scope. */
const unsubscribeUrlWith = (
  unsubscribe: EmailMarketingOptions['unsubscribe']
) => {
  return ({ scope, email }: { scope: string; email: string }) => {
    return unsubscribe.url(
      encodeURIComponent(
        createUnsubscribeToken({ scope, email, secret: unsubscribe.secret })
      )
    );
  };
};

/**
 * Handles a provider webhook end to end: rejects what the provider did not
 * sign, confirms a subscription, applies delivery events.
 */
const handleWebhookWith = ({
  provider,
  applyEvents,
}: {
  provider: EmailProvider;
  applyEvents: (events: DeliveryEvent[]) => Promise<DeliveryEvent[]>;
}) => {
  return async (request: {
    body: unknown;
    headers?: Record<string, string | string[] | undefined>;
  }) => {
    if (!provider.parseWebhook) {
      throw new Error(`The ${provider.name} provider has no webhook`);
    }
    const result = await provider.parseWebhook(request);
    if (result.kind === 'confirmation') {
      await result.confirm();
    }
    if (result.kind === 'events') {
      await applyEvents(result.events);
    }
    return result;
  };
};

/**
 * The email marketing engine: every e-mail goes through `send`, which applies
 * the rules in order — a valid address, not suppressed, allowed, a sender —
 * and adds the one-click unsubscribe headers and footer, so a caller cannot
 * skip one.
 *
 * It owns the rules and nothing else: suppressions persist through your store,
 * delivery through the provider (`@ttoss/email-marketing/ses`).
 *
 * @example
 * ```ts
 * const marketing = createEmailMarketing({
 *   provider: sesProvider({ region: 'us-east-1', topicArn }),
 *   suppressions: { store },
 *   unsubscribe: { secret, url: (t) => `https://api.app.com/email/unsubscribe?t=${t}` },
 *   resolveSender: async ({ scope }) => ({ name: 'Acme', email: 'news@acme.com' }),
 * });
 * await marketing.send({ scope: 'company-1', kind: 'welcome', to, subject, html, text });
 * ```
 */
export const createEmailMarketing = (options: EmailMarketingOptions) => {
  const { provider, unsubscribe, footer = defaultFooter } = options;
  if (!unsubscribe.secret) {
    throw new Error(
      'createEmailMarketing: unsubscribe.secret is required, every e-mail needs a working opt-out'
    );
  }

  const suppressions = createSuppressionList(options.suppressions);

  const unsubscribeUrl = unsubscribeUrlWith(unsubscribe);

  const send = async ({
    scope,
    kind,
    to,
    subject,
    html,
    text,
    tags = {},
  }: SendInput): Promise<SendResult> => {
    const email = normalizeEmail(to);
    const check = await checkSend({
      options,
      suppressions,
      scope,
      kind,
      email,
    });
    if ('reason' in check) {
      return { status: 'skipped', reason: check.reason };
    }
    const { sender } = check;
    const url = unsubscribeUrl({ scope, email });
    const rendered = footer({ senderName: sender.name, url });
    const from = formatAddress(sender);
    const replyTo = normalizeEmail(sender.replyTo);

    const { messageId } = await provider.send({
      from,
      to: email,
      ...(isValidEmail(replyTo) && { replyTo }),
      subject,
      html: `${html}${rendered.html}`,
      text: `${text}\n\n--\n${rendered.text}`,
      headers: unsubscribeHeaders(url),
      tags: { ...tags, [SCOPE_TAG]: scope, [KIND_TAG]: kind },
    });

    return { status: 'sent', messageId, from };
  };

  /**
   * Applies an unsubscribe link: suppresses the address for its scope.
   * Returns what the token named, or `null` for a token that is not ours.
   * Call it on `POST` only — mail scanners open every link with `GET`.
   */
  const applyUnsubscribe = async (token: unknown) => {
    const found = readUnsubscribeToken({ token, secret: unsubscribe.secret });
    if (found) {
      await suppressions.suppress({ ...found, reason: 'unsubscribe' });
    }
    return found;
  };

  /**
   * Applies delivery events: a permanent bounce suppresses the address for
   * every scope, a complaint for the scope that sent it (every scope when the
   * event carries none). Returns the events for your metrics.
   */
  const applyEvents = (events: DeliveryEvent[]) => {
    return applyEventsTo({ suppressions, events });
  };

  const handleWebhook = handleWebhookWith({ provider, applyEvents });

  return {
    send,
    suppressions,
    unsubscribeUrl,
    readUnsubscribeToken: (token: unknown) => {
      return readUnsubscribeToken({ token, secret: unsubscribe.secret });
    },
    applyUnsubscribe,
    applyEvents,
    handleWebhook,
  };
};
