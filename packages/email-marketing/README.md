# @ttoss/email-marketing

Runner-agnostic email marketing engine for Node.js. It holds the rules every
marketing e-mail must follow — a suppression list, a one-click unsubscribe,
senders on their own domains, bounces and complaints — and nothing else:
persistence comes in as a store you implement, delivery as a provider.

Providers live in subpaths of this package:

| Import                       | Provider   | Needs                             |
| ---------------------------- | ---------- | --------------------------------- |
| `@ttoss/email-marketing/ses` | Amazon SES | `@aws-sdk/client-sesv2` installed |

## Installation

```bash
pnpm add @ttoss/email-marketing
# for Amazon SES
pnpm add @aws-sdk/client-sesv2
```

`@aws-sdk/client-sesv2` is an optional peer dependency: install it only if you
import `@ttoss/email-marketing/ses`.

## Quick start

```ts
import { createEmailMarketing } from '@ttoss/email-marketing';
import { sesProvider } from '@ttoss/email-marketing/ses';

const marketing = createEmailMarketing({
  provider: sesProvider({
    region: 'us-east-1',
    configurationSet: 'marketing',
    topicArn: 'arn:aws:sns:us-east-1:123456789012:email-events',
  }),
  suppressions: { store: mySuppressionStore },
  unsubscribe: {
    secret: process.env.EMAIL_UNSUBSCRIBE_SECRET,
    url: (token) => `https://api.example.com/email/unsubscribe?t=${token}`,
  },
  resolveSender: async ({ scope, kind }) => {
    return {
      name: 'Acme Solar',
      email: 'news@acme.com',
      replyTo: 'sales@acme.com',
    };
  },
  canSend: async ({ scope, kind }) => {
    return kind === 'welcome' || (await hasPaidPlan(scope));
  },
});

const result = await marketing.send({
  scope: 'company-1',
  kind: 'welcome',
  to: 'customer@example.com',
  subject: 'Welcome',
  html: '<p>Hello</p>',
  text: 'Hello',
});
// { status: 'sent', messageId, from } or { status: 'skipped', reason }
```

## Concepts

- **Scope** — who sends: a company, a tenant, your own brand. Suppressions,
  unsubscribe links and delivery events are all per scope. A scope must not
  contain a dot.
- **Kind** — what is being sent (`'welcome'`, `'campaign'`…). The engine treats
  every kind alike; `resolveSender` and `canSend` decide per kind.

## Sending

`send` applies the rules in this order and skips with a reason at the first
that fails:

| Step                                     | Skip reason     |
| ---------------------------------------- | --------------- |
| The address is valid                     | `invalid_email` |
| It is not suppressed for this scope      | `suppressed`    |
| `canSend({ scope, kind })` (optional)    | `not_allowed`   |
| `resolveSender({ scope, kind })` returns | `no_sender`     |

Then it sends with the `List-Unsubscribe` and `List-Unsubscribe-Post` headers
(one-click, RFC 8058, required by Gmail and Yahoo for bulk senders), appends
the unsubscribe footer, and tags the e-mail with `scope` and `kind` so delivery
events come back attributed. The sender's name is encoded for non-ASCII
characters (RFC 2047). Pass `footer` to write the footer in another language:

```ts
createEmailMarketing({
  // ...
  footer: ({ senderName, url }) => ({
    html: `<p>Você recebeu este e-mail de ${escapeHtml(senderName)}. <a href="${url}">Não quero mais receber</a></p>`,
    text: `Você recebeu este e-mail de ${senderName}. Para não receber mais: ${url}`,
  }),
});
```

## Suppression list

| Reason        | Set by                               | Applies to  | Undone by  |
| ------------- | ------------------------------------ | ----------- | ---------- |
| `manual`      | The sender (a checkbox in your CRM)  | Its scope   | The sender |
| `unsubscribe` | The recipient, through the link      | Its scope   | Nobody     |
| `complaint`   | The recipient, marking spam          | Its scope   | Nobody     |
| `bounce`      | The provider, for a permanent bounce | Every scope | Nobody     |

Addresses are normalized (trimmed, lower case). Suppressing an address again
keeps the stronger reason (`manual` < `unsubscribe` < `complaint` < `bounce`).

```ts
await marketing.suppressions.suppress({
  scope: 'company-1',
  email,
  reason: 'manual',
});
await marketing.suppressions.isSuppressed({ scope: 'company-1', email }); // true
await marketing.suppressions.resubscribe({ scope: 'company-1', email }); // allowed: manual
// throws ResubscribeRefusedError when the recipient opted out or the address bounced
```

Implement `SuppressionStore` over your database. A `null` scope is a
suppression for every scope:

```ts
import type { SuppressionStore } from '@ttoss/email-marketing';

const store: SuppressionStore = {
  find: ({ email, scopes }) =>
    db.suppressions.findMany({ email, scope: { in: scopes } }),
  save: (suppression) => db.suppressions.upsert(suppression), // by email + scope
  removeManual: ({ email, scope }) =>
    db.suppressions.delete({ email, scope, reason: 'manual' }),
};
```

`onSuppress` and `onResubscribe` run after each change, for example to keep a
"does not want e-mails" checkbox on the contact in step.

## Unsubscribe

Each e-mail links to `unsubscribe.url(token)`. The token is
`<scope>.<base64url(email)>.<HMAC-SHA256>`: it cannot be edited to unsubscribe
someone else, and it never expires. Serve the URL with:

- `GET` — a page with a confirmation button. Mail scanners open every link, so
  never unsubscribe on `GET`.
- `POST` — `await marketing.applyUnsubscribe(token)`. This is also what mail
  clients call for the one-click header.

`createUnsubscribeToken`, `readUnsubscribeToken` and `unsubscribeHeaders` are
exported for use without the engine.

## Delivery events

Point the provider's webhook at an endpoint that calls `handleWebhook`. It
rejects what the provider did not sign, confirms subscriptions, and applies
events: a permanent bounce suppresses the address for every scope, a
complaint for the scope that sent it.

```ts
const result = await marketing.handleWebhook({ body: ctx.request.body });
ctx.status = result.kind === 'rejected' ? 403 : 204;
```

`applyEvents(events)` applies events you parsed yourself.

## Sender domains

Tenants send from their own domain once the provider verifies it.
`parseSenderDomain` reads what they typed and refuses webmail domains and your
own zones; `nextDomainStatus` maps the provider's answer to the status to show.
Which tenant holds a domain is up to your app.

```ts
import { nextDomainStatus, parseSenderDomain } from '@ttoss/email-marketing';

const parsed = parseSenderDomain({
  input: 'sales@AcmeSolar.com',
  reserved: ['example.com'],
});
// { domain: 'acmesolar.com' } | { error: 'invalid' | 'webmail' | 'reserved' }

const identity = await provider.domains.create('acmesolar.com');
// identity.records: the DNS records to create
const status = nextDomainStatus({
  previous: 'pending_dns',
  verification: identity.verification,
});
// 'pending_dns' | 'active' | 'error' (was active, no longer verifies)
```

## Amazon SES

`sesProvider` sends with SES v2, manages domain identities with Easy DKIM
(three CNAMEs plus a recommended DMARC record), and reads bounces and
complaints from an SNS topic:

1. Create a configuration set with an event destination for `Bounce` and
   `Complaint` to an SNS topic.
2. Subscribe your webhook endpoint (HTTPS) to that topic, and pass its ARN as
   `topicArn`: messages from any other topic are rejected.
3. Give the IAM role `ses:SendEmail`, `ses:CreateEmailIdentity`,
   `ses:GetEmailIdentity` and `ses:DeleteEmailIdentity`.

Every SNS message is checked against its signature (versions 1 and 2), with the
certificate fetched only from an `sns.<region>.amazonaws.com` HTTPS URL.

```ts
sesProvider({
  client, // optional: your own SESv2Client
  region: 'us-east-1',
  configurationSet: 'marketing',
  topicArn: 'arn:aws:sns:us-east-1:123456789012:email-events',
});
```

## Writing a provider

Implement `EmailProvider`: `send` is required; `domains` and `parseWebhook`
are optional. `parseWebhook` must authenticate the request and return
`{ kind: 'rejected' }`, `{ kind: 'confirmation', confirm }` or
`{ kind: 'events', events }` with `bounce`, `complaint` and `delivery` events,
echoing back the tags the engine sent.
