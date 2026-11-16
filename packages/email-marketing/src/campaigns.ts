import { randomUUID } from 'node:crypto';

import { isValidEmail, normalizeEmail } from './address';
import {
  CAMPAIGN_TAG,
  type Context,
  renderCampaign,
  runTick,
} from './campaignRunner';
import type {
  Campaign,
  CampaignContent,
  CampaignStatus,
  CampaignStore,
  RecipientCounts,
  RecipientStore,
} from './campaignTypes';
import type { EmailMarketing } from './engine';
import type { TemplateVariables } from './template';

export {
  CAMPAIGN_TAG,
  renderCampaign,
  type TickResult,
} from './campaignRunner';

/** Thrown when an action does not fit the campaign's status (editing one that is sending…). */
export class CampaignStateError extends Error {
  readonly status: CampaignStatus;

  constructor({ action, status }: { action: string; status: CampaignStatus }) {
    super(`Cannot ${action} a campaign that is ${status}`);
    this.name = 'CampaignStateError';
    this.status = status;
  }
}

export type AudienceMember = { email: string; variables?: TemplateVariables };

/** Recipients as an array, or an async iterable for lists too big to hold in memory. */
export type Audience = Iterable<AudienceMember> | AsyncIterable<AudienceMember>;

export type CampaignsOptions = {
  marketing: Pick<EmailMarketing, 'send'>;
  campaigns: CampaignStore;
  recipients: RecipientStore;
  /** E-mails per second across one tick. Keep it under your provider's limit (SES: your account's send rate). Default 10. */
  ratePerSecond?: number;
  /** Recipients claimed per round trip to the store. Default 50. */
  batchSize?: number;
  /** A recipient left `sending` this long is marked `failed`/`interrupted`. Default 15 minutes. */
  staleAfterMs?: number;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  createId?: () => string;
};

const EDITABLE: CampaignStatus[] = ['draft', 'scheduled'];
const ADD_BATCH = 500;

const defaultSleep = (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

/** Every distinct, valid address of the audience, in batches the store can take. */
async function* audienceBatches(audience: Audience) {
  const seen = new Set<string>();
  let batch: Array<{ email: string; variables: TemplateVariables }> = [];
  for await (const member of audience) {
    const email = normalizeEmail(member.email);
    if (!isValidEmail(email) || seen.has(email)) {
      continue;
    }
    seen.add(email);
    batch.push({ email, variables: member.variables ?? {} });
    if (batch.length >= ADD_BATCH) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}

const loadCampaign = async ({ ctx, id }: { ctx: Context; id: string }) => {
  const campaign = await ctx.store.get(id);
  if (!campaign) {
    throw new Error(`Campaign ${id} not found`);
  }
  return campaign;
};

const transition = async ({
  ctx,
  id,
  action,
  from,
  patch,
}: {
  ctx: Context;
  id: string;
  action: string;
  from: CampaignStatus[];
  patch: (campaign: Campaign) => Partial<Campaign>;
}) => {
  const campaign = await loadCampaign({ ctx, id });
  if (!from.includes(campaign.status)) {
    throw new CampaignStateError({ action, status: campaign.status });
  }
  const next = { ...campaign, ...patch(campaign) };
  await ctx.store.save(next);
  return next;
};

export type CreateCampaignInput = CampaignContent & {
  scope: string;
  name: string;
  /** Default `'campaign'`. */
  kind?: string;
};

const createCampaign = async ({
  ctx,
  input,
}: {
  ctx: Context;
  input: CreateCampaignInput;
}) => {
  const campaign: Campaign = {
    id: ctx.createId(),
    scope: input.scope,
    name: input.name,
    kind: input.kind ?? 'campaign',
    subject: input.subject,
    html: input.html,
    text: input.text,
    status: 'draft',
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
    createdAt: ctx.now(),
  };
  await ctx.store.save(campaign);
  return campaign;
};

const scheduleCampaign = async ({
  ctx,
  id,
  audience,
  at,
}: {
  ctx: Context;
  id: string;
  audience: Audience;
  at: Date;
}) => {
  const campaign = await loadCampaign({ ctx, id });
  if (!EDITABLE.includes(campaign.status)) {
    throw new CampaignStateError({
      action: 'schedule',
      status: campaign.status,
    });
  }
  let added = 0;
  for await (const batch of audienceBatches(audience)) {
    added += await ctx.recipients.add({ campaignId: id, recipients: batch });
  }
  const next: Campaign = { ...campaign, status: 'scheduled', scheduledAt: at };
  await ctx.store.save(next);
  return { campaign: next, added };
};

const contextOf = (options: CampaignsOptions): Context => {
  return {
    marketing: options.marketing,
    store: options.campaigns,
    recipients: options.recipients,
    interval: 1000 / (options.ratePerSecond ?? 10),
    batchSize: options.batchSize ?? 50,
    staleAfterMs: options.staleAfterMs ?? 15 * 60 * 1000,
    now:
      options.now ??
      (() => {
        return new Date();
      }),
    sleep: options.sleep ?? defaultSleep,
    createId: options.createId ?? randomUUID,
  };
};

const lifecycleActions = (ctx: Context) => {
  const move = (args: {
    id: string;
    action: string;
    from: CampaignStatus[];
    patch: (campaign: Campaign) => Partial<Campaign>;
  }) => {
    return transition({ ctx, ...args });
  };

  return {
    get: (id: string) => {
      return loadCampaign({ ctx, id });
    },
    create: (input: CreateCampaignInput) => {
      return createCampaign({ ctx, input });
    },
    /** Changes name or content while `draft` or `scheduled`. */
    update: ({
      id,
      ...patch
    }: Partial<CampaignContent> & { id: string; name?: string }) => {
      return move({
        id,
        action: 'edit',
        from: EDITABLE,
        patch: () => {
          return patch;
        },
      });
    },
    /**
     * Freezes the audience and sets the start: the first `tick` at or after
     * `at` (default now) starts sending. Addresses are normalized and
     * de-duplicated, invalid ones dropped. Scheduling again adds recipients
     * and moves the start.
     */
    schedule: ({
      id,
      audience,
      at,
    }: {
      id: string;
      audience: Audience;
      at?: Date;
    }) => {
      return scheduleCampaign({ ctx, id, audience, at: at ?? ctx.now() });
    },
    pause: (id: string) => {
      return move({
        id,
        action: 'pause',
        from: ['scheduled', 'sending'],
        patch: () => {
          return { status: 'paused' };
        },
      });
    },
    resume: (id: string) => {
      return move({
        id,
        action: 'resume',
        from: ['paused'],
        patch: (c) => {
          return { status: c.startedAt ? 'sending' : 'scheduled' };
        },
      });
    },
    cancel: (id: string) => {
      return move({
        id,
        action: 'cancel',
        from: ['draft', 'scheduled', 'sending', 'paused'],
        patch: () => {
          return { status: 'cancelled', finishedAt: ctx.now() };
        },
      });
    },
  };
};

const deliveryActions = (ctx: Context) => {
  return {
    /** What one recipient would receive, with `variables` filled in. */
    preview: async ({
      id,
      variables,
    }: {
      id: string;
      variables?: TemplateVariables;
    }) => {
      return renderCampaign({
        content: await loadCampaign({ ctx, id }),
        variables,
      });
    },
    /** Sends the campaign to one address now, through the engine, without touching its recipients. */
    sendTest: async ({
      id,
      to,
      variables,
    }: {
      id: string;
      to: string;
      variables?: TemplateVariables;
    }) => {
      const campaign = await loadCampaign({ ctx, id });
      return ctx.marketing.send({
        scope: campaign.scope,
        kind: campaign.kind,
        to,
        ...renderCampaign({ content: campaign, variables }),
        tags: { [CAMPAIGN_TAG]: campaign.id, test: 'true' },
      });
    },
    stats: (id: string): Promise<RecipientCounts> => {
      return ctx.recipients.count({ campaignId: id });
    },
    /**
     * One unit of work for a cron: starts the campaigns that are due, then
     * sends until `budgetMs` runs out (default 50 seconds, under a one-minute
     * schedule).
     */
    tick: ({ budgetMs = 50_000 }: { budgetMs?: number } = {}) => {
      return runTick({ ctx, budgetMs });
    },
  };
};

export type Campaigns = ReturnType<typeof createCampaigns>;

/**
 * Campaigns on top of the engine: write one, freeze its audience, and let a
 * cron call `tick()` until everyone is handled.
 *
 * `tick` is safe to run from any scheduler (a `setInterval`, a Lambda on a
 * schedule): it works for at most `budgetMs`, respects `ratePerSecond`, and
 * the next tick continues where it stopped. Each recipient is claimed before
 * sending and completed after, so a crash never sends twice: what a dead tick
 * left `sending` becomes `failed`/`interrupted`. Run one tick at a time, or
 * the rate adds up across them.
 *
 * Every e-mail goes through `marketing.send`, so suppressions, `canSend` and
 * `resolveSender` apply to each recipient at the moment it is sent.
 *
 * @example
 * ```ts
 * const campaigns = createCampaigns({ marketing, campaigns: campaignStore, recipients: recipientStore });
 * const { id } = await campaigns.create({ scope, name: 'Black Friday', subject, html, text });
 * await campaigns.schedule({ id, audience: leads.map((l) => ({ email: l.email, variables: { nome: l.name } })) });
 * // every minute, from a cron:
 * await campaigns.tick({ budgetMs: 50_000 });
 * ```
 */
export const createCampaigns = (options: CampaignsOptions) => {
  const ctx = contextOf(options);
  return { ...lifecycleActions(ctx), ...deliveryActions(ctx) };
};
