import type { EmailKind, SendSkipReason } from './engine';
import type { TemplateVariables } from './template';

/**
 * - `draft`: being written; content can change.
 * - `scheduled`: has its recipients and a start time; content can still change.
 * - `sending`: `tick` is delivering it.
 * - `paused`: stopped by hand; `resume` continues where it stopped.
 * - `sent`: every recipient was handled.
 * - `cancelled`: stopped for good; recipients not reached stay `pending`.
 */
export type CampaignStatus =
  'draft' | 'scheduled' | 'sending' | 'paused' | 'sent' | 'cancelled';

export type CampaignContent = {
  subject: string;
  html: string;
  text: string;
};

export type Campaign = CampaignContent & {
  id: string;
  scope: string;
  name: string;
  /** Passed to `send` as the kind (default `'campaign'`), so `canSend`/`resolveSender` can tell. */
  kind: EmailKind;
  status: CampaignStatus;
  scheduledAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
};

export type CampaignStore = {
  get: (id: string) => Promise<Campaign | null>;
  /** Inserts, or replaces the campaign with the same `id`. */
  save: (campaign: Campaign) => Promise<void>;
  /** `scheduled` campaigns whose `scheduledAt` is not after `now`, and every `sending` one. */
  listDue: (args: { now: Date }) => Promise<Campaign[]>;
};

/**
 * - `pending`: waiting for a `tick`.
 * - `sending`: claimed by a `tick` that has not finished it.
 * - `sent` / `skipped` (suppressed, not allowed…) / `failed`: done.
 */
export type RecipientStatus =
  'pending' | 'sending' | 'sent' | 'skipped' | 'failed';

export type CampaignRecipient = {
  campaignId: string;
  /** Normalized. One row per address per campaign. */
  email: string;
  variables: TemplateVariables;
  status: RecipientStatus;
  /** A skip reason (`SendSkipReason`), `interrupted`, or an error message. */
  reason: SendSkipReason | string | null;
  messageId: string | null;
  claimedAt: Date | null;
};

export type RecipientCounts = Record<RecipientStatus, number>;

/**
 * Where a campaign's recipients live. `claim` must be atomic (one row is
 * claimed by one caller), e.g. `UPDATE … SET status = 'sending' … WHERE id IN
 * (SELECT … FOR UPDATE SKIP LOCKED)` in Postgres.
 */
export type RecipientStore = {
  /** Inserts recipients, ignoring an address the campaign already has. Returns how many were added. */
  add: (args: {
    campaignId: string;
    recipients: Array<{ email: string; variables: TemplateVariables }>;
  }) => Promise<number>;
  /** Moves up to `limit` `pending` recipients to `sending` with `claimedAt: now`, and returns them. */
  claim: (args: {
    campaignId: string;
    limit: number;
    now: Date;
  }) => Promise<CampaignRecipient[]>;
  /** Moves `sending` recipients back to `pending` (claimed, then the tick ran out of time). */
  release: (args: { campaignId: string; emails: string[] }) => Promise<void>;
  /** Records the outcome of one recipient. */
  complete: (args: {
    campaignId: string;
    email: string;
    status: 'sent' | 'skipped' | 'failed';
    reason: string | null;
    messageId: string | null;
  }) => Promise<void>;
  /**
   * Marks as `failed` (reason `interrupted`) the recipients left `sending`
   * since before `claimedBefore`: a tick died after claiming them. They are
   * never sent again, since the e-mail may already have gone out.
   */
  failStale: (args: {
    campaignId: string;
    claimedBefore: Date;
  }) => Promise<number>;
  count: (args: { campaignId: string }) => Promise<RecipientCounts>;
};
