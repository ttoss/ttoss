import { renderCampaign } from './campaignRunner';
import type { EmailMarketing, SendResult } from './engine';
import type {
  Enrollment,
  EnrollmentStore,
  Sequence,
  SequenceStore,
} from './sequenceTypes';

/** The tag every sequence e-mail carries with its sequence id. */
export const SEQUENCE_TAG = 'sequence';
/** The tag every sequence e-mail carries with its step index. */
export const STEP_TAG = 'step';

/** Skip reasons that end the enrolment: the address can never receive the next steps. */
const EXIT_ON_SKIP = new Set<string>(['suppressed', 'invalid_email']);

export type SequenceTickResult = {
  sent: number;
  skipped: number;
  failed: number;
  /** Enrolments that handled their last step in this tick. */
  completed: number;
  /** Enrolments that left early in this tick (unsubscribed, invalid address). */
  exited: number;
  /** True when the budget ran out with steps still due. */
  timedOut: boolean;
};

export type SequenceContext = {
  marketing: Pick<EmailMarketing, 'send'>;
  store: SequenceStore;
  enrollments: EnrollmentStore;
  interval: number;
  batchSize: number;
  staleAfterMs: number;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  createId: () => string;
};

type StepOutcome = 'sent' | 'skipped' | 'failed';

/** The enrolment once `enrollment.step` was handled: on to the next step, or done. */
export const advance = ({
  ctx,
  sequence,
  enrollment,
}: {
  ctx: SequenceContext;
  sequence: Sequence | null;
  enrollment: Enrollment;
}): Enrollment => {
  const step = enrollment.step + 1;
  const next = sequence?.steps[step];
  return next
    ? {
        ...enrollment,
        step,
        status: 'active',
        nextAt: new Date(ctx.now().getTime() + next.delayMs),
        claimedAt: null,
      }
    : {
        ...enrollment,
        step,
        status: 'completed',
        nextAt: null,
        claimedAt: null,
      };
};

/** Saves the enrolment, unless `exit` took it out while its step was being sent. */
const settle = async ({
  ctx,
  enrollment,
}: {
  ctx: SequenceContext;
  enrollment: Enrollment;
}) => {
  const current = await ctx.enrollments.get(enrollment);
  if (current?.status === 'exited') {
    return 'exited' as const;
  }
  await ctx.enrollments.save(enrollment);
  return enrollment.status;
};

const sendStep = async ({
  ctx,
  sequence,
  enrollment,
}: {
  ctx: SequenceContext;
  sequence: Sequence;
  enrollment: Enrollment;
}): Promise<SendResult | null> => {
  const step = sequence.steps[enrollment.step];
  try {
    return await ctx.marketing.send({
      scope: sequence.scope,
      kind: step.kind ?? sequence.kind,
      to: enrollment.email,
      ...renderCampaign({ content: step, variables: enrollment.variables }),
      tags: {
        [SEQUENCE_TAG]: sequence.id,
        [STEP_TAG]: String(enrollment.step),
      },
    });
  } catch {
    return null;
  }
};

/** Sends the due step, if it still exists, and returns the enrolment moved on. */
const handleStep = async ({
  ctx,
  sequence,
  enrollment,
  result,
}: {
  ctx: SequenceContext;
  sequence: Sequence | null;
  enrollment: Enrollment;
  result: SequenceTickResult;
}): Promise<Enrollment> => {
  if (!sequence?.steps[enrollment.step]) {
    return advance({ ctx, sequence, enrollment });
  }
  const sent = await sendStep({ ctx, sequence, enrollment });
  const outcome: StepOutcome = sent ? sent.status : 'failed';
  result[outcome] += 1;
  return sent?.status === 'skipped' && EXIT_ON_SKIP.has(sent.reason)
    ? {
        ...enrollment,
        status: 'exited',
        nextAt: null,
        claimedAt: null,
        exitReason: sent.reason,
      }
    : advance({ ctx, sequence, enrollment });
};

/** Sends one due step and moves the enrolment on. */
const deliver = async ({
  ctx,
  sequence,
  enrollment,
  result,
}: {
  ctx: SequenceContext;
  sequence: Sequence | null;
  enrollment: Enrollment;
  result: SequenceTickResult;
}) => {
  const status = await settle({
    ctx,
    enrollment: await handleStep({ ctx, sequence, enrollment, result }),
  });
  if (status === 'completed' || status === 'exited') {
    result[status] += 1;
  }
};

/** Loads each sequence once per tick. */
const sequenceCache = (ctx: SequenceContext) => {
  const cache = new Map<string, Promise<Sequence | null>>();
  return (id: string) => {
    if (!cache.has(id)) {
      cache.set(id, ctx.store.get(id));
    }
    return cache.get(id) as Promise<Sequence | null>;
  };
};

/**
 * Enrolments a dead tick left `sending`: their step may already have gone out,
 * so it is never sent again; they move on to the next step.
 */
const recoverStale = async ({
  ctx,
  load,
  result,
}: {
  ctx: SequenceContext;
  load: (id: string) => Promise<Sequence | null>;
  result: SequenceTickResult;
}) => {
  const stale = await ctx.enrollments.listStale({
    claimedBefore: new Date(ctx.now().getTime() - ctx.staleAfterMs),
  });
  for (const enrollment of stale) {
    result.failed += 1;
    const sequence = await load(enrollment.sequenceId);
    const status = await settle({
      ctx,
      enrollment: advance({ ctx, sequence, enrollment }),
    });
    if (status === 'completed') {
      result.completed += 1;
    }
  }
};

/** Sends a claimed batch at the configured rate; hands back what it had no time for. */
const sendBatch = async ({
  ctx,
  load,
  batch,
  deadline,
  result,
}: {
  ctx: SequenceContext;
  load: (id: string) => Promise<Sequence | null>;
  batch: Enrollment[];
  deadline: number;
  result: SequenceTickResult;
}) => {
  for (const [index, enrollment] of batch.entries()) {
    const startedAt = ctx.now().getTime();
    if (startedAt >= deadline) {
      return batch.slice(index);
    }
    const sequence = await load(enrollment.sequenceId);
    await deliver({ ctx, sequence, enrollment, result });
    const wait = ctx.interval - (ctx.now().getTime() - startedAt);
    if (wait > 0) {
      await ctx.sleep(wait);
    }
  }
  return [];
};

export const runSequenceTick = async ({
  ctx,
  budgetMs,
}: {
  ctx: SequenceContext;
  budgetMs: number;
}) => {
  const result: SequenceTickResult = {
    sent: 0,
    skipped: 0,
    failed: 0,
    completed: 0,
    exited: 0,
    timedOut: false,
  };
  const deadline = ctx.now().getTime() + budgetMs;
  const load = sequenceCache(ctx);
  await recoverStale({ ctx, load, result });
  const sequenceIds = await ctx.store.listActive();
  while (sequenceIds.length > 0) {
    if (ctx.now().getTime() >= deadline) {
      result.timedOut = true;
      break;
    }
    const batch = await ctx.enrollments.claimDue({
      sequenceIds,
      now: ctx.now(),
      limit: ctx.batchSize,
    });
    if (batch.length === 0) {
      break;
    }
    const left = await sendBatch({ ctx, load, batch, deadline, result });
    for (const enrollment of left) {
      await settle({
        ctx,
        enrollment: { ...enrollment, status: 'active', claimedAt: null },
      });
    }
    if (left.length > 0) {
      result.timedOut = true;
      break;
    }
  }
  return result;
};
