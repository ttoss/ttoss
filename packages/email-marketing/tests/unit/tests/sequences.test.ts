import {
  createMemoryStores,
  createSequences,
  type EmailMarketing,
  type EnrollmentStore,
  SEQUENCE_TAG,
  type SequenceStep,
  STEP_TAG,
} from '../../../src';

const DAY = 24 * 60 * 60 * 1000;

const step = (subject: string, delayMs: number): SequenceStep => {
  return {
    delayMs,
    subject: `${subject} {{nome}}`,
    html: `<p>${subject}, {{nome}}</p>`,
    text: `${subject}, {{nome}}`,
  };
};

const steps = [step('Bem-vindo', 0), step('Primeira proposta', 2 * DAY)];

/** A clock that only moves when the code sleeps, a send takes time or the test advances it. */
const setup = ({
  send,
  sendMs = 0,
  batchSize = 2,
  enrollments,
}: {
  send?: jest.Mock;
  sendMs?: number;
  batchSize?: number;
  enrollments?: EnrollmentStore;
} = {}) => {
  let clock = Date.parse('2026-11-24T12:00:00Z');
  const stores = createMemoryStores();
  const marketingSend =
    send ??
    jest.fn(async () => {
      return { status: 'sent', messageId: 'm', from: 'a@a.co' };
    });
  const marketing = {
    send: jest.fn(async (input: Parameters<EmailMarketing['send']>[0]) => {
      clock += sendMs;
      return marketingSend(input);
    }),
  } as unknown as Pick<EmailMarketing, 'send'> & { send: jest.Mock };
  let id = 0;
  const sequences = createSequences({
    marketing,
    sequences: stores.sequences,
    enrollments: enrollments ?? stores.enrollments,
    ratePerSecond: 10,
    batchSize,
    now: () => {
      return new Date(clock);
    },
    sleep: async (ms) => {
      clock += ms;
    },
    createId: () => {
      return `s-${(id += 1)}`;
    },
  });
  return {
    sequences,
    stores,
    marketing,
    advance: (ms: number) => {
      clock += ms;
    },
    now: () => {
      return new Date(clock);
    },
  };
};

const onboarding = async (sequences: ReturnType<typeof setup>['sequences']) => {
  return sequences.create({ scope: 'surya', name: 'Onboarding', steps });
};

test('sends each step on the address own clock, then completes', async () => {
  const { sequences, marketing, advance } = setup();
  const { id } = await onboarding(sequences);
  await sequences.enroll({
    sequenceId: id,
    email: ' Ana@X.co ',
    variables: { nome: 'Ana' },
  });

  const first = await sequences.tick();
  expect(first).toEqual({
    sent: 1,
    skipped: 0,
    failed: 0,
    completed: 0,
    exited: 0,
    timedOut: false,
  });
  expect(marketing.send).toHaveBeenLastCalledWith({
    scope: 'surya',
    kind: 'sequence',
    to: 'ana@x.co',
    subject: 'Bem-vindo Ana',
    html: '<p>Bem-vindo, Ana</p>',
    text: 'Bem-vindo, Ana',
    tags: { [SEQUENCE_TAG]: id, [STEP_TAG]: '0' },
  });

  advance(DAY);
  expect((await sequences.tick()).sent).toBe(0);

  advance(DAY);
  const last = await sequences.tick();
  expect(last).toMatchObject({ sent: 1, completed: 1 });
  expect(marketing.send).toHaveBeenLastCalledWith(
    expect.objectContaining({
      subject: 'Primeira proposta Ana',
      tags: { [SEQUENCE_TAG]: id, [STEP_TAG]: '1' },
    })
  );
  expect(await sequences.stats(id)).toEqual({
    active: 0,
    sending: 0,
    completed: 1,
    exited: 0,
  });
});

test('enrols an address once, ever, and refuses an invalid one', async () => {
  const { sequences } = setup();
  const { id } = await onboarding(sequences);
  expect(await sequences.enroll({ sequenceId: id, email: 'a@x.co' })).toEqual({
    status: 'enrolled',
  });
  expect(await sequences.enroll({ sequenceId: id, email: 'A@x.co' })).toEqual({
    status: 'already_enrolled',
  });
  expect(
    await sequences.enroll({ sequenceId: id, email: 'not-an-email' })
  ).toEqual({ status: 'invalid_email' });
  expect(
    await sequences.enrollment({ sequenceId: id, email: 'A@X.CO' })
  ).toMatchObject({ email: 'a@x.co', step: 0, status: 'active' });
});

test('starts from `at` and the first step delay', async () => {
  const { sequences, marketing, advance, now } = setup();
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'Later',
    steps: [step('Oi', DAY)],
  });
  await sequences.enroll({
    sequenceId: id,
    email: 'a@x.co',
    at: new Date(now().getTime() + DAY),
  });
  advance(DAY);
  await sequences.tick();
  expect(marketing.send).not.toHaveBeenCalled();
  advance(DAY);
  await sequences.tick();
  expect(marketing.send).toHaveBeenCalledTimes(1);
});

test('exit takes the address out before the next step', async () => {
  const { sequences, marketing, advance } = setup();
  const { id } = await onboarding(sequences);
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await sequences.tick();
  expect(
    await sequences.exit({
      sequenceId: id,
      email: 'A@x.co',
      reason: 'first_proposal',
    })
  ).toBe(true);
  expect(
    await sequences.exit({ sequenceId: id, email: 'a@x.co', reason: 'again' })
  ).toBe(false);
  expect(
    await sequences.exit({ sequenceId: id, email: 'b@x.co', reason: 'never' })
  ).toBe(false);
  advance(3 * DAY);
  await sequences.tick();
  expect(marketing.send).toHaveBeenCalledTimes(1);
  expect(
    await sequences.enrollment({ sequenceId: id, email: 'a@x.co' })
  ).toMatchObject({ status: 'exited', exitReason: 'first_proposal' });
});

test('an unsubscribed or invalid address leaves; another skip moves on', async () => {
  const send = jest
    .fn()
    .mockResolvedValueOnce({ status: 'skipped', reason: 'suppressed' })
    .mockResolvedValueOnce({ status: 'skipped', reason: 'not_allowed' });
  const { sequences } = setup({ send });
  const { id } = await onboarding(sequences);
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await sequences.enroll({ sequenceId: id, email: 'b@x.co' });
  expect(await sequences.tick()).toMatchObject({ skipped: 2, exited: 1 });
  expect(
    await sequences.enrollment({ sequenceId: id, email: 'a@x.co' })
  ).toMatchObject({ status: 'exited', exitReason: 'suppressed' });
  expect(
    await sequences.enrollment({ sequenceId: id, email: 'b@x.co' })
  ).toMatchObject({ status: 'active', step: 1 });
});

test('a send that throws counts as failed and moves on', async () => {
  const send = jest.fn().mockRejectedValueOnce(new Error('SES down'));
  const { sequences } = setup({ send });
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'One',
    steps: [step('Oi', 0)],
  });
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  expect(await sequences.tick()).toMatchObject({ failed: 1, completed: 1 });
});

test('a paused sequence waits, and catches up on resume', async () => {
  const { sequences, marketing } = setup();
  const { id } = await onboarding(sequences);
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  expect((await sequences.pause(id)).status).toBe('paused');
  await sequences.tick();
  expect(marketing.send).not.toHaveBeenCalled();
  await sequences.resume(id);
  await sequences.tick();
  expect(marketing.send).toHaveBeenCalledTimes(1);
});

test('the budget hands back what it could not send', async () => {
  const { sequences } = setup({ sendMs: 400, batchSize: 5 });
  const { id } = await onboarding(sequences);
  for (const n of [1, 2, 3]) {
    await sequences.enroll({ sequenceId: id, email: `${n}@x.co` });
  }
  expect(await sequences.tick({ budgetMs: 700 })).toMatchObject({
    sent: 2,
    timedOut: true,
  });
  expect(await sequences.stats(id)).toMatchObject({ active: 3, sending: 0 });
  expect(await sequences.tick()).toMatchObject({ sent: 1, timedOut: false });
});

test('stops claiming when the budget is spent between batches', async () => {
  const { sequences } = setup({ sendMs: 500, batchSize: 1 });
  const { id } = await onboarding(sequences);
  for (const n of [1, 2]) {
    await sequences.enroll({ sequenceId: id, email: `${n}@x.co` });
  }
  expect(await sequences.tick({ budgetMs: 500 })).toMatchObject({
    sent: 1,
    timedOut: true,
  });
});

test('a step a dead tick left sending is never sent again', async () => {
  const { sequences, stores, marketing, advance, now } = setup();
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'Two',
    steps: [step('Um', 0), step('Dois', 0)],
  });
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await sequences.enroll({ sequenceId: id, email: 'b@x.co' });
  await stores.enrollments.claimDue({
    sequenceIds: [id],
    now: now(),
    limit: 2,
  });
  await sequences.exit({ sequenceId: id, email: 'b@x.co', reason: 'goal' });
  advance(16 * 60 * 1000);
  expect(await sequences.tick()).toMatchObject({ failed: 1, sent: 1 });
  expect(marketing.send).toHaveBeenCalledWith(
    expect.objectContaining({ to: 'a@x.co', subject: 'Dois ' })
  );
  expect(
    await sequences.enrollment({ sequenceId: id, email: 'b@x.co' })
  ).toMatchObject({ status: 'exited' });
});

test('a stale enrolment on its last step completes', async () => {
  const { sequences, stores, advance, now } = setup();
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'One',
    steps: [step('Um', 0)],
  });
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await stores.enrollments.claimDue({
    sequenceIds: [id],
    now: now(),
    limit: 1,
  });
  advance(16 * 60 * 1000);
  expect(await sequences.tick()).toMatchObject({ failed: 1, completed: 1 });
});

test('an exit while a step is being sent wins over the tick', async () => {
  const holder: { sequences?: ReturnType<typeof setup>['sequences'] } = {};
  const send = jest.fn(async () => {
    await holder.sequences?.exit({
      sequenceId: 's-1',
      email: 'a@x.co',
      reason: 'goal',
    });
    return { status: 'sent', messageId: 'm', from: 'a@a.co' };
  });
  const { sequences } = setup({ send });
  holder.sequences = sequences;
  await onboarding(sequences);
  await sequences.enroll({ sequenceId: 's-1', email: 'a@x.co' });
  expect(await sequences.tick()).toMatchObject({ sent: 1, exited: 1 });
  expect(
    await sequences.enrollment({ sequenceId: 's-1', email: 'a@x.co' })
  ).toMatchObject({ status: 'exited', exitReason: 'goal' });
});

test('an enrolment past the last step (steps removed) completes without sending', async () => {
  const { sequences, marketing, advance } = setup();
  const { id } = await onboarding(sequences);
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await sequences.tick();
  await sequences.update({ id, steps: [steps[0]] });
  advance(2 * DAY);
  expect(await sequences.tick()).toMatchObject({ sent: 0, completed: 1 });
  expect(marketing.send).toHaveBeenCalledTimes(1);
});

test('a sequence without steps completes on enrolment', async () => {
  const { sequences } = setup();
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'Empty',
    steps: [],
  });
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  expect(await sequences.stats(id)).toMatchObject({ completed: 1 });
});

test('a step can send as another kind', async () => {
  const { sequences, marketing } = setup();
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'Letter',
    kind: 'campaign',
    steps: [{ ...step('Carta', 0), kind: 'campaign:matheus' }, step('Oi', 0)],
  });
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await sequences.tick();
  await sequences.tick();
  expect(
    marketing.send.mock.calls.map(([input]) => {
      return input.kind;
    })
  ).toEqual(['campaign:matheus', 'campaign']);
});

test('update, preview, sendTest and get', async () => {
  const { sequences, marketing } = setup();
  const { id } = await onboarding(sequences);
  expect((await sequences.update({ id, name: 'Novo' })).name).toBe('Novo');
  expect((await sequences.get(id)).steps).toHaveLength(2);
  expect(
    await sequences.preview({ id, step: 1, variables: { nome: '<b>' } })
  ).toEqual({
    subject: 'Primeira proposta <b>',
    html: '<p>Primeira proposta, &lt;b&gt;</p>',
    text: 'Primeira proposta, <b>',
  });
  await sequences.sendTest({ id, step: 0, to: 'me@x.co' });
  expect(marketing.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'me@x.co',
      kind: 'sequence',
      tags: { [SEQUENCE_TAG]: id, [STEP_TAG]: '0', test: 'true' },
    })
  );
  await expect(sequences.preview({ id, step: 9 })).rejects.toThrow(RangeError);
  await expect(sequences.get('nope')).rejects.toThrow(
    'Sequence nope not found'
  );
  await expect(
    sequences.enroll({ sequenceId: 'nope', email: 'a@x.co' })
  ).rejects.toThrow('not found');
});

test('refuses a negative or non-finite delay', async () => {
  const { sequences } = setup();
  await expect(
    sequences.create({ scope: 's', name: 'x', steps: [step('a', -1)] })
  ).rejects.toThrow(RangeError);
  const { id } = await onboarding(sequences);
  await expect(
    sequences.update({ id, steps: [step('a', Number.NaN)] })
  ).rejects.toThrow('invalid delayMs');
});

test('works with the default clock, sleep and ids', async () => {
  const stores = createMemoryStores();
  const send = jest.fn(async () => {
    return { status: 'sent' as const, messageId: 'm', from: 'a@a.co' };
  });
  const sequences = createSequences({
    marketing: { send },
    sequences: stores.sequences,
    enrollments: stores.enrollments,
    ratePerSecond: 1000,
  });
  const { id } = await sequences.create({
    scope: 'surya',
    name: 'Now',
    steps: [step('Oi', 0)],
  });
  const other = await sequences.create({
    scope: 'surya',
    name: 'Other',
    steps: [step('Oi', DAY)],
  });
  await sequences.enroll({ sequenceId: id, email: 'a@x.co' });
  await sequences.enroll({ sequenceId: other.id, email: 'a@x.co' });
  expect(await sequences.tick()).toMatchObject({ sent: 1, completed: 1 });
  expect(await sequences.stats(other.id)).toMatchObject({ active: 1 });
});
