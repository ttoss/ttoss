import type {
  Campaign,
  CampaignContent,
  CampaignRecipient,
  CampaignStore,
  RecipientStore,
} from './campaignTypes';
import type { EmailMarketing, SendResult } from './engine';
import { renderTemplate, type TemplateVariables } from './template';

/** The tag every campaign e-mail carries with its campaign id. */
export const CAMPAIGN_TAG = 'campaign';

export type TickResult = {
  started: string[];
  finished: string[];
  sent: number;
  skipped: number;
  failed: number;
  /** True when the budget ran out with recipients still pending. */
  timedOut: boolean;
};

/** The subject, HTML and text one recipient receives. */
export const renderCampaign = ({
  content,
  variables,
}: {
  content: CampaignContent;
  variables?: TemplateVariables;
}): CampaignContent => {
  return {
    subject: renderTemplate({ template: content.subject, variables }),
    html: renderTemplate({ template: content.html, variables, html: true }),
    text: renderTemplate({ template: content.text, variables }),
  };
};

const outcomeOf = (result: SendResult) => {
  return result.status === 'sent'
    ? { status: 'sent' as const, reason: null, messageId: result.messageId }
    : { status: 'skipped' as const, reason: result.reason, messageId: null };
};

const emptyTick = (): TickResult => {
  return {
    started: [],
    finished: [],
    sent: 0,
    skipped: 0,
    failed: 0,
    timedOut: false,
  };
};

export type Context = {
  marketing: Pick<EmailMarketing, 'send'>;
  store: CampaignStore;
  recipients: RecipientStore;
  interval: number;
  batchSize: number;
  staleAfterMs: number;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  createId: () => string;
};

const deliver = async ({
  ctx,
  campaign,
  recipient,
}: {
  ctx: Context;
  campaign: Campaign;
  recipient: CampaignRecipient;
}) => {
  const base = { campaignId: campaign.id, email: recipient.email };
  try {
    const result = await ctx.marketing.send({
      scope: campaign.scope,
      kind: campaign.kind,
      to: recipient.email,
      ...renderCampaign({ content: campaign, variables: recipient.variables }),
      tags: { [CAMPAIGN_TAG]: campaign.id },
    });
    const outcome = outcomeOf(result);
    await ctx.recipients.complete({ ...base, ...outcome });
    return outcome.status;
  } catch (error) {
    await ctx.recipients.complete({
      ...base,
      status: 'failed',
      reason: String(error).slice(0, 300),
      messageId: null,
    });
    return 'failed' as const;
  }
};

/** Finishes the campaign when no recipient is left to send. */
const finishIfDone = async ({
  ctx,
  campaign,
}: {
  ctx: Context;
  campaign: Campaign;
}) => {
  const counts = await ctx.recipients.count({ campaignId: campaign.id });
  if (counts.pending > 0 || counts.sending > 0) {
    return false;
  }
  await ctx.store.save({ ...campaign, status: 'sent', finishedAt: ctx.now() });
  return true;
};

/** Sends a claimed batch at the configured rate; returns the addresses it had no time for. */
const sendBatch = async ({
  ctx,
  campaign,
  batch,
  deadline,
  result,
}: {
  ctx: Context;
  campaign: Campaign;
  batch: CampaignRecipient[];
  deadline: number;
  result: TickResult;
}) => {
  for (const [index, recipient] of batch.entries()) {
    const startedAt = ctx.now().getTime();
    if (startedAt >= deadline) {
      result.timedOut = true;
      return batch.slice(index).map((r) => {
        return r.email;
      });
    }
    result[await deliver({ ctx, campaign, recipient })] += 1;
    const wait = ctx.interval - (ctx.now().getTime() - startedAt);
    if (wait > 0) {
      await ctx.sleep(wait);
    }
  }
  return [];
};

const runCampaign = async ({
  ctx,
  campaign,
  deadline,
  result,
}: {
  ctx: Context;
  campaign: Campaign;
  deadline: number;
  result: TickResult;
}) => {
  const campaignId = campaign.id;
  await ctx.recipients.failStale({
    campaignId,
    claimedBefore: new Date(ctx.now().getTime() - ctx.staleAfterMs),
  });
  while (ctx.now().getTime() < deadline) {
    const current = await ctx.store.get(campaignId);
    if (current?.status !== 'sending') {
      return;
    }
    const batch = await ctx.recipients.claim({
      campaignId,
      limit: ctx.batchSize,
      now: ctx.now(),
    });
    if (batch.length === 0) {
      if (await finishIfDone({ ctx, campaign: current })) {
        result.finished.push(campaignId);
      }
      return;
    }
    const left = await sendBatch({
      ctx,
      campaign: current,
      batch,
      deadline,
      result,
    });
    if (left.length > 0) {
      await ctx.recipients.release({ campaignId, emails: left });
    }
  }
  result.timedOut = true;
};

export const runTick = async ({
  ctx,
  budgetMs,
}: {
  ctx: Context;
  budgetMs: number;
}) => {
  const result = emptyTick();
  const deadline = ctx.now().getTime() + budgetMs;
  for (const due of await ctx.store.listDue({ now: ctx.now() })) {
    let campaign = due;
    if (campaign.status === 'scheduled') {
      campaign = { ...campaign, status: 'sending', startedAt: ctx.now() };
      await ctx.store.save(campaign);
      result.started.push(campaign.id);
    }
    await runCampaign({ ctx, campaign, deadline, result });
    if (ctx.now().getTime() >= deadline) {
      break;
    }
  }
  return result;
};
