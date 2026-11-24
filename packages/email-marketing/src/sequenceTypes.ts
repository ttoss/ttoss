import type { CampaignContent } from './campaignTypes';
import type { EmailKind } from './engine';
import type { TemplateVariables } from './template';

/**
 * One e-mail of a sequence: sent `delayMs` after the previous step (or after
 * enrolment, for the first).
 */
export type SequenceStep = CampaignContent & {
  delayMs: number;
  /** Overrides the sequence's `kind` for this step, e.g. a letter from a founder. */
  kind?: EmailKind;
};

/**
 * - `active`: `tick` sends the steps that are due.
 * - `paused`: nothing is sent; enrolments wait, and catch up on `resume`.
 */
export type SequenceStatus = 'active' | 'paused';

export type Sequence = {
  id: string;
  scope: string;
  name: string;
  /** Passed to `send` as the kind (default `'sequence'`), unless the step names its own. */
  kind: EmailKind;
  status: SequenceStatus;
  steps: SequenceStep[];
  createdAt: Date;
};

export type SequenceStore = {
  get: (id: string) => Promise<Sequence | null>;
  /** Inserts, or replaces the sequence with the same `id`. */
  save: (sequence: Sequence) => Promise<void>;
  /** The ids of every `active` sequence. */
  listActive: () => Promise<string[]>;
};

/**
 * - `active`: waiting for its next step at `nextAt`.
 * - `sending`: claimed by a `tick` that has not finished the step.
 * - `completed`: every step was handled.
 * - `exited`: left before the end (`exitReason`: a goal reached, unsubscribed…).
 */
export type EnrollmentStatus = 'active' | 'sending' | 'completed' | 'exited';

export type Enrollment = {
  sequenceId: string;
  /** Normalized. One enrolment per address per sequence, ever. */
  email: string;
  variables: TemplateVariables;
  status: EnrollmentStatus;
  /** The index of the next step to send. */
  step: number;
  nextAt: Date | null;
  claimedAt: Date | null;
  enrolledAt: Date;
  exitReason: string | null;
};

export type EnrollmentCounts = Record<EnrollmentStatus, number>;

/**
 * Where enrolments live. `claimDue` must be atomic (one enrolment is claimed by
 * one caller), e.g. `UPDATE … SET status = 'sending' … WHERE id IN (SELECT …
 * FOR UPDATE SKIP LOCKED)` in Postgres.
 */
export type EnrollmentStore = {
  get: (args: {
    sequenceId: string;
    email: string;
  }) => Promise<Enrollment | null>;
  /** Inserts the enrolment unless the address already has one in the sequence. Returns whether it was added. */
  add: (enrollment: Enrollment) => Promise<boolean>;
  /** Replaces the enrolment with the same sequence and address. */
  save: (enrollment: Enrollment) => Promise<void>;
  /**
   * Moves up to `limit` `active` enrolments of these sequences whose `nextAt`
   * is not after `now` to `sending` with `claimedAt: now`, and returns them.
   */
  claimDue: (args: {
    sequenceIds: string[];
    now: Date;
    limit: number;
  }) => Promise<Enrollment[]>;
  /** Enrolments left `sending` since before `claimedBefore`: a tick died after claiming them. */
  listStale: (args: { claimedBefore: Date }) => Promise<Enrollment[]>;
  count: (args: { sequenceId: string }) => Promise<EnrollmentCounts>;
};
