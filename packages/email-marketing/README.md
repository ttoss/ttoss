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

## Campaigns: sending to a list from a cron

`send` delivers one e-mail. To reach a list, create a campaign, freeze its
audience, and call `tick()` from any scheduler until it is done:

```ts
import { createCampaigns } from '@ttoss/email-marketing';

const campaigns = createCampaigns({
  marketing, // from createEmailMarketing
  campaigns: myCampaignStore,
  recipients: myRecipientStore,
  ratePerSecond: 10, // keep it under your provider's limit
});

const { id } = await campaigns.create({
  scope: 'company-1',
  name: 'Black Friday',
  subject: 'Uma oferta para {{nome}}',
  html: '<p>Olá, {{nome}}!</p>',
  text: 'Olá, {{nome}}!',
});
await campaigns.sendTest({
  id,
  to: 'me@acme.com',
  variables: { nome: 'Teste' },
});
await campaigns.schedule({
  id,
  audience: leads.map((lead) => ({
    email: lead.email,
    variables: { nome: lead.name },
  })),
  at: new Date('2026-11-27T12:00:00Z'), // default: now
});
```

### What a tick does

1. Starts the `scheduled` campaigns whose time has come (`sending`).
2. For each `sending` campaign, claims a batch of `pending` recipients, sends
   each through `marketing.send` at `ratePerSecond`, and records `sent`,
   `skipped` (with the reason: suppressed, not allowed…) or `failed`.
3. Stops when `budgetMs` (default 50 s) runs out, handing back the
   recipients it claimed but did not reach. The next tick continues there.
4. Marks the campaign `sent` once no recipient is left.

A recipient is claimed before it is sent and completed after, so nobody
receives a campaign twice: if a tick dies mid-send, the recipients it left
`sending` for longer than `staleAfterMs` (default 15 min) become `failed` with
reason `interrupted` and are not retried. Run one tick at a time; two at once
add up their rates.

Because every e-mail goes through `send`, an address that unsubscribes while a
campaign is going out is skipped from then on, and `canSend` (a plan, a quota)
is checked for each recipient.

### Running it

In a long-running server (Strapi, Koa, Express), a timer:

```ts
let running = false;
setInterval(async () => {
  if (running) return; // one tick at a time
  running = true;
  try {
    await campaigns.tick({ budgetMs: 50_000 });
  } finally {
    running = false;
  }
}, 60_000);
```

In AWS, a scheduled Lambda with [`@ttoss/cloud-cron`](https://ttoss.dev/docs/modules/packages/cloud-cron/):

```ts
// runCampaigns.ts
export const handler = async () => {
  return campaigns.tick({ budgetMs: 4 * 60 * 1000 }); // under the Lambda timeout
};

// cron template: jobs: { CampaignsCron: { handler: 'runCampaigns.handler', schedule: 'rate(5 minutes)' } }
```

### Lifecycle

| Status      | Content editable | `tick` sends | Moves to                                      |
| ----------- | ---------------- | ------------ | --------------------------------------------- |
| `draft`     | yes              | no           | `scheduled` (`schedule`)                      |
| `scheduled` | yes              | from `at`    | `sending`, `paused`, `cancelled`              |
| `sending`   | no               | yes          | `sent`, `paused`, `cancelled`                 |
| `paused`    | no               | no           | `sending`/`scheduled` (`resume`), `cancelled` |
| `sent`      | no               | no           | —                                             |
| `cancelled` | no               | no           | —                                             |

An action that does not fit the status throws `CampaignStateError`.
`preview({ id, variables })` renders what a recipient gets; `stats(id)` counts
recipients by status.

### Templates

`{{name}}` placeholders are filled per recipient from `variables`. In the HTML
values are escaped, so a name cannot inject markup; a missing value is empty.
`renderTemplate` and `templateVariables` are exported.

### Stores

`CampaignStore` (`get`, `save`, `listDue`) and `RecipientStore` (`add`,
`claim`, `release`, `complete`, `failStale`, `count`) are yours to implement;
`createMemoryStores()` is a working in-memory version of every store (for tests
and as a reference). `claim` must be atomic so two ticks never take the same
recipient. In Postgres:

```sql
UPDATE campaign_recipients SET status = 'sending', claimed_at = now()
WHERE id IN (
  SELECT id FROM campaign_recipients
  WHERE campaign_id = $1 AND status = 'pending'
  LIMIT $2 FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

Delivery events carry the campaign id in the `campaign` tag (`CAMPAIGN_TAG`),
for per-campaign bounce and complaint counts.

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
