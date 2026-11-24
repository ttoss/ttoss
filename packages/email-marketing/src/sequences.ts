import { randomUUID } from 'node:crypto';

import { isValidEmail, normalizeEmail } from './address';
import { renderCampaign } from './campaignRunner';
import type { EmailMarketing } from './engine';
import {
  runSequenceTick,
  SEQUENCE_TAG,
  type SequenceContext,
  STEP_TAG,
} from './sequenceRunner';
import type {
  Enrollment,
  EnrollmentCounts,
  EnrollmentStore,
  Sequence,
  SequenceStatus,
  SequenceStep,
  SequenceStore,
} from './sequenceTypes';
import type { TemplateVariables } from './template';

export {
  SEQUENCE_TAG,
  type SequenceTickResult,
  STEP_TAG,
} from './sequenceRunner';

export type SequencesOptions = {
  marketing: Pick<EmailMarketing, 'send'>;
  sequences: SequenceStore;
  enrollments: EnrollmentStore;
  /** E-mails per second across one tick. Default 10. */
  ratePerSecond?: number;
  /** Enrolments claimed per round trip to the store. Default 50. */
  batchSize?: number;
  /** An enrolment left `sending` this long skips the step it was on. Default 15 minutes. */
  staleAfterMs?: number;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
  createId?: () => string;
};

export type CreateSequenceInput = {
  scope: string;
  name: string;
  steps: SequenceStep[];
  /** Default `'sequence'`. */
  kind?: string;
};

export type EnrollResult = {
  status: 'enrolled' | 'already_enrolled' | 'invalid_email';
};

const defaultSleep = (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
};

/** Throws unless every delay is a finite, non-negative number of milliseconds. */
const checkSteps = (steps: SequenceStep[]) => {
  for (const [index, step] of steps.entries()) {
    if (!Number.isFinite(step.delayMs) || step.delayMs < 0) {
      throw new RangeError(
        `Step ${index} has an invalid delayMs: ${step.delayMs}`
      );
    }
  }
  return steps;
};

const contextOf = (options: SequencesOptions): SequenceContext => {
  return {
    marketing: options.marketing,
    store: options.sequences,
    enrollments: options.enrollments,
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

const loadSequence = async ({
  ctx,
  id,
}: {
  ctx: SequenceContext;
  id: string;
}) => {
  const sequence = await ctx.store.get(id);
  if (!sequence) {
    throw new Error(`Sequence ${id} not found`);
  }
  return sequence;
};

const saveSequence = async ({
  ctx,
  id,
  patch,
}: {
  ctx: SequenceContext;
  id: string;
  patch: Partial<Pick<Sequence, 'name' | 'steps' | 'status'>>;
}) => {
  const next = { ...(await loadSequence({ ctx, id })), ...patch };
  await ctx.store.save(next);
  return next;
};

const enroll = async ({
  ctx,
  sequenceId,
  email: rawEmail,
  variables,
  at,
}: {
  ctx: SequenceContext;
  sequenceId: string;
  email: string;
  variables?: TemplateVariables;
  at?: Date;
}): Promise<EnrollResult> => {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { status: 'invalid_email' };
  }
  const sequence = await loadSequence({ ctx, id: sequenceId });
  const start = at ?? ctx.now();
  const first = sequence.steps[0];
  const enrollment: Enrollment = {
    sequenceId,
    email,
    variables: variables ?? {},
    status: first ? 'active' : 'completed',
    step: 0,
    nextAt: first ? new Date(start.getTime() + first.delayMs) : null,
    claimedAt: null,
    enrolledAt: ctx.now(),
    exitReason: null,
  };
  const added = await ctx.enrollments.add(enrollment);
  return { status: added ? 'enrolled' : 'already_enrolled' };
};

const exit = async ({
  ctx,
  sequenceId,
  email,
  reason,
}: {
  ctx: SequenceContext;
  sequenceId: string;
  email: string;
  reason: string;
}) => {
  const enrollment = await ctx.enrollments.get({
    sequenceId,
    email: normalizeEmail(email),
  });
  if (enrollment?.status !== 'active' && enrollment?.status !== 'sending') {
    return false;
  }
  await ctx.enrollments.save({
    ...enrollment,
    status: 'exited',
    nextAt: null,
    claimedAt: null,
    exitReason: reason,
  });
  return true;
};

const definitionActions = (ctx: SequenceContext) => {
  return {
    get: (id: string) => {
      return loadSequence({ ctx, id });
    },
    create: async (input: CreateSequenceInput) => {
      const sequence: Sequence = {
        id: ctx.createId(),
        scope: input.scope,
        name: input.name,
        kind: input.kind ?? 'sequence',
        status: 'active',
        steps: checkSteps(input.steps),
        createdAt: ctx.now(),
      };
      await ctx.store.save(sequence);
      return sequence;
    },
    /**
     * Changes the name or the steps. Enrolments keep their step index and
     * their `nextAt`: a new delay applies from the next step they reach.
     */
    update: async ({
      id,
      name,
      steps,
    }: {
      id: string;
      name?: string;
      steps?: SequenceStep[];
    }) => {
      return saveSequence({
        ctx,
        id,
        patch: {
          ...(name !== undefined && { name }),
          ...(steps !== undefined && { steps: checkSteps(steps) }),
        },
      });
    },
    pause: (id: string) => {
      return saveSequence({
        ctx,
        id,
        patch: { status: 'paused' satisfies SequenceStatus },
      });
    },
    resume: (id: string) => {
      return saveSequence({
        ctx,
        id,
        patch: { status: 'active' satisfies SequenceStatus },
      });
    },
  };
};

const deliveryActions = (ctx: SequenceContext) => {
  const stepOf = async ({ id, step }: { id: string; step: number }) => {
    const sequence = await loadSequence({ ctx, id });
    const content = sequence.steps[step];
    if (!content) {
      throw new RangeError(`Sequence ${id} has no step ${step}`);
    }
    return { sequence, content };
  };
  return {
    /** What one recipient of `step` would receive, with `variables` filled in. */
    preview: async (args: {
      id: string;
      step: number;
      variables?: TemplateVariables;
    }) => {
      const { content } = await stepOf(args);
      return renderCampaign({ content, variables: args.variables });
    },
    /** Sends `step` to one address now, through the engine, without enrolling it. */
    sendTest: async (args: {
      id: string;
      step: number;
      to: string;
      variables?: TemplateVariables;
    }) => {
      const { sequence, content } = await stepOf(args);
      return ctx.marketing.send({
        scope: sequence.scope,
        kind: content.kind ?? sequence.kind,
        to: args.to,
        ...renderCampaign({ content, variables: args.variables }),
        tags: {
          [SEQUENCE_TAG]: sequence.id,
          [STEP_TAG]: String(args.step),
          test: 'true',
        },
      });
    },
    stats: (id: string): Promise<EnrollmentCounts> => {
      return ctx.enrollments.count({ sequenceId: id });
    },
    /**
     * One unit of work for a cron: sends every step that is due, until
     * `budgetMs` runs out (default 50 seconds, under a one-minute schedule).
     */
    tick: ({ budgetMs = 50_000 }: { budgetMs?: number } = {}) => {
      return runSequenceTick({ ctx, budgetMs });
    },
  };
};

export type Sequences = ReturnType<typeof createSequences>;

/**
 * Sequences on top of the engine: a series of e-mails, each sent a delay after
 * the previous one, to every address enrolled on its own clock (onboarding,
 * nurturing). Enrol on an event (a sign-up), take the address out when it
 * reaches the goal (`exit`), and let a cron call `tick()`.
 *
 * An address is enrolled once per sequence, ever. Every e-mail goes through
 * `marketing.send`, so suppressions, `canSend` and `resolveSender` apply at
 * each step; an address that unsubscribes or is not valid leaves the sequence.
 * A step is claimed before it is sent, so a crash never sends it twice: what a
 * dead tick left `sending` moves on to the next step.
 *
 * @example
 * ```ts
 * const sequences = createSequences({ marketing, sequences: sequenceStore, enrollments: enrollmentStore });
 * const { id } = await sequences.create({ scope, name: 'Onboarding', steps: [
 *   { delayMs: 0, subject: 'Bem-vindo, {{nome}}', html, text },
 *   { delayMs: 2 * DAY, subject: 'Sua primeira proposta', html, text },
 * ] });
 * await sequences.enroll({ sequenceId: id, email: user.email, variables: { nome: user.name } });
 * await sequences.exit({ sequenceId: id, email: user.email, reason: 'first_proposal' });
 * // every minute, from a cron:
 * await sequences.tick({ budgetMs: 50_000 });
 * ```
 */
export const createSequences = (options: SequencesOptions) => {
  const ctx = contextOf(options);
  return {
    ...definitionActions(ctx),
    ...deliveryActions(ctx),
    /**
     * Starts the sequence for one address: the first step goes out its
     * `delayMs` after `at` (default now). An address already enrolled, even
     * one that finished or left, is not enrolled again.
     */
    enroll: (args: {
      sequenceId: string;
      email: string;
      variables?: TemplateVariables;
      at?: Date;
    }) => {
      return enroll({ ctx, ...args });
    },
    /** Takes the address out of the sequence (a goal reached). Returns whether it was in it. */
    exit: (args: { sequenceId: string; email: string; reason: string }) => {
      return exit({ ctx, ...args });
    },
    /** The address's enrolment in the sequence, or `null`. */
    enrollment: ({
      sequenceId,
      email,
    }: {
      sequenceId: string;
      email: string;
    }) => {
      return ctx.enrollments.get({ sequenceId, email: normalizeEmail(email) });
    },
  };
};
