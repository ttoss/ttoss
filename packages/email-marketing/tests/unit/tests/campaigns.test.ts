import {
  type Campaign,
  CampaignStateError,
  createCampaigns,
  createMemoryStores,
  type EmailMarketing,
  type RecipientStore,
  renderCampaign,
} from '../../../src';

const content = {
  subject: 'Oferta para {{nome}}',
  html: '<p>Olá, {{nome}}</p>',
  text: 'Olá, {{nome}}',
};

/** A clock that only moves when the code sleeps or a send takes time. */
const setup = ({
  send,
  ratePerSecond = 10,
  batchSize = 2,
  sendMs = 0,
}: {
  send?: jest.Mock;
  ratePerSecond?: number;
  batchSize?: number;
  sendMs?: number;
} = {}) => {
  let clock = Date.parse('2026-11-16T12:00:00Z');
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
  const campaigns = createCampaigns({
    marketing,
    campaigns: stores.campaigns,
    recipients: stores.recipients,
    ratePerSecond,
    batchSize,
    now: () => {
      return new Date(clock);
    },
    sleep: async (ms) => {
      clock += ms;
    },
    createId: () => {
      return `c-${(id += 1)}`;
    },
  });
  return {
    campaigns,
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

const audience = (n: number) => {
  return Array.from({ length: n }, (_, i) => {
    return {
      email: `lead${i}@x.co`,
      variables: { nome: `Lead ${i}` },
    };
  });
};

test('create starts a draft in the scope, with kind campaign by default', async () => {
  const { campaigns } = setup();
  const campaign = await campaigns.create({
    scope: 'company-1',
    name: 'BF',
    ...content,
  });
  expect(campaign).toMatchObject({
    id: 'c-1',
    scope: 'company-1',
    kind: 'campaign',
    status: 'draft',
    scheduledAt: null,
  });
  expect(await campaigns.get('c-1')).toEqual(campaign);
  expect(
    (
      await campaigns.create({
        scope: 's',
        name: 'W',
        kind: 'welcome',
        ...content,
      })
    ).kind
  ).toBe('welcome');
});

test('get throws for an unknown campaign', async () => {
  const { campaigns } = setup();
  await expect(campaigns.get('nope')).rejects.toThrow(
    'Campaign nope not found'
  );
});

test('schedule freezes a normalized, de-duplicated audience, from an array or an async iterable', async () => {
  const { campaigns, stores } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });

  const result = await campaigns.schedule({
    id,
    audience: [
      { email: ' A@X.co ' },
      { email: 'a@x.co' },
      { email: 'invalid' },
      { email: 'b@x.co', variables: { nome: 'B' } },
    ],
  });
  expect(result.added).toBe(2);
  expect(result.campaign.status).toBe('scheduled');

  async function* more() {
    yield { email: 'b@x.co' };
    yield { email: 'c@x.co' };
  }
  expect((await campaigns.schedule({ id, audience: more() })).added).toBe(1);
  expect(await stores.recipients.count({ campaignId: id })).toEqual({
    pending: 3,
    sending: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  });
});

test('a big audience is added in batches', async () => {
  const { campaigns, stores } = setup();
  const add = jest.spyOn(stores.recipients, 'add');
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(1200) });
  expect(
    add.mock.calls.map(([args]) => {
      return args.recipients.length;
    })
  ).toEqual([500, 500, 200]);
});

test('tick sends to everyone, personalized, at the configured rate, and finishes the campaign', async () => {
  const { campaigns, marketing, now } = setup({ ratePerSecond: 5 });
  const { id } = await campaigns.create({
    scope: 'company-1',
    name: 'n',
    ...content,
  });
  await campaigns.schedule({ id, audience: audience(3) });
  const start = now().getTime();

  const result = await campaigns.tick();

  expect(result).toEqual({
    started: [id],
    finished: [id],
    sent: 3,
    skipped: 0,
    failed: 0,
    timedOut: false,
  });
  expect(marketing.send).toHaveBeenCalledWith({
    scope: 'company-1',
    kind: 'campaign',
    to: 'lead0@x.co',
    subject: 'Oferta para Lead 0',
    html: '<p>Olá, Lead 0</p>',
    text: 'Olá, Lead 0',
    tags: { campaign: id },
  });
  expect(now().getTime() - start).toBe(600);
  const campaign = await campaigns.get(id);
  expect(campaign.status).toBe('sent');
  expect(campaign.finishedAt).toEqual(now());
  expect(await campaigns.stats(id)).toMatchObject({ sent: 3, pending: 0 });
});

test('does not sleep when a send already took longer than the interval', async () => {
  const { campaigns, now } = setup({ ratePerSecond: 10, sendMs: 300 });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(2) });
  const start = now().getTime();
  await campaigns.tick();
  expect(now().getTime() - start).toBe(600);
});

test('records skips and failures per recipient and keeps going', async () => {
  const send = jest
    .fn()
    .mockResolvedValueOnce({ status: 'skipped', reason: 'suppressed' })
    .mockRejectedValueOnce(new Error('SES throttled'))
    .mockResolvedValueOnce({
      status: 'sent',
      messageId: 'm-3',
      from: 'a@a.co',
    });
  const { campaigns, stores } = setup({ send });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(3) });

  const result = await campaigns.tick();

  expect(result).toMatchObject({
    sent: 1,
    skipped: 1,
    failed: 1,
    finished: [id],
  });
  const failed = (
    await stores.recipients.claim({
      campaignId: id,
      limit: 10,
      now: new Date(),
    })
  ).length;
  expect(failed).toBe(0);
  expect(await campaigns.stats(id)).toEqual({
    pending: 0,
    sending: 0,
    sent: 1,
    skipped: 1,
    failed: 1,
  });
});

test('a tick that runs out of budget releases what it claimed, and the next tick continues', async () => {
  const { campaigns, stores } = setup({ ratePerSecond: 1, batchSize: 5 });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(5) });

  const first = await campaigns.tick({ budgetMs: 2500 });
  expect(first).toMatchObject({ sent: 3, timedOut: true, finished: [] });
  expect(await stores.recipients.count({ campaignId: id })).toMatchObject({
    sent: 3,
    pending: 2,
    sending: 0,
  });
  expect((await campaigns.get(id)).status).toBe('sending');

  const second = await campaigns.tick({ budgetMs: 10_000 });
  expect(second).toMatchObject({
    started: [],
    sent: 2,
    finished: [id],
    timedOut: false,
  });
});

test('a tick whose budget ends between batches reports it timed out', async () => {
  const { campaigns } = setup({ ratePerSecond: 1, batchSize: 1 });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(3) });
  expect(await campaigns.tick({ budgetMs: 1000 })).toMatchObject({
    sent: 1,
    timedOut: true,
  });
});

test('a scheduled campaign waits for its time', async () => {
  const { campaigns, advance, now } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({
    id,
    audience: audience(1),
    at: new Date(now().getTime() + 3_600_000),
  });

  expect(await campaigns.tick()).toMatchObject({ started: [], sent: 0 });
  advance(3_600_000);
  expect(await campaigns.tick()).toMatchObject({ started: [id], sent: 1 });
});

test('recipients a dead tick left sending are failed as interrupted, never sent again', async () => {
  const { campaigns, stores, advance, now, marketing } = setup({
    batchSize: 10,
  });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(2) });
  await stores.campaigns.save({
    ...(await campaigns.get(id)),
    status: 'sending',
    startedAt: now(),
  });
  await stores.recipients.claim({ campaignId: id, limit: 1, now: now() });

  advance(16 * 60 * 1000);
  const result = await campaigns.tick();

  expect(result).toMatchObject({ sent: 1, finished: [id] });
  expect(marketing.send).toHaveBeenCalledTimes(1);
  expect(await campaigns.stats(id)).toMatchObject({ failed: 1, sent: 1 });
});

test('a recipient claimed elsewhere keeps the campaign open until it is done', async () => {
  const { campaigns, stores, now } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(1) });
  await stores.campaigns.save({
    ...(await campaigns.get(id)),
    status: 'sending',
    startedAt: now(),
  });
  await stores.recipients.claim({ campaignId: id, limit: 1, now: now() });

  expect(await campaigns.tick()).toMatchObject({ sent: 0, finished: [] });
  expect((await campaigns.get(id)).status).toBe('sending');
});

test('pausing stops sending; resuming continues; cancelling stops for good', async () => {
  const { campaigns } = setup({ ratePerSecond: 1, batchSize: 1 });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(5) });
  expect(await campaigns.tick({ budgetMs: 1500 })).toMatchObject({ sent: 2 });

  expect((await campaigns.pause(id)).status).toBe('paused');
  expect(await campaigns.tick()).toMatchObject({ sent: 0 });
  expect((await campaigns.resume(id)).status).toBe('sending');
  expect(await campaigns.tick({ budgetMs: 1500 })).toMatchObject({ sent: 2 });

  const cancelled = await campaigns.cancel(id);
  expect(cancelled.status).toBe('cancelled');
  expect(cancelled.finishedAt).not.toBeNull();
  expect(await campaigns.tick()).toMatchObject({ sent: 0 });
  expect(await campaigns.stats(id)).toMatchObject({ pending: 1 });
});

test('a campaign paused before it started resumes as scheduled', async () => {
  const { campaigns, now } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({
    id,
    audience: audience(1),
    at: new Date(now().getTime() + 1000),
  });
  await campaigns.pause(id);
  expect((await campaigns.resume(id)).status).toBe('scheduled');
});

test('a campaign that pauses mid-tick stops at its next batch', async () => {
  const { campaigns, stores } = setup({ batchSize: 1 });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(3) });
  const complete = stores.recipients.complete;
  jest
    .spyOn(stores.recipients, 'complete')
    .mockImplementationOnce(async (args) => {
      await complete(args);
      await stores.campaigns.save({
        ...(await campaigns.get(id)),
        status: 'paused',
      });
    });
  expect(await campaigns.tick()).toMatchObject({ sent: 1, finished: [] });
});

test('editing is allowed only before sending, and the state machine refuses the rest', async () => {
  const { campaigns } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  expect((await campaigns.update({ id, name: 'New', subject: 'S' })).name).toBe(
    'New'
  );
  await campaigns.schedule({ id, audience: audience(1) });
  expect((await campaigns.update({ id, text: 'T' })).text).toBe('T');
  await campaigns.tick();

  const error = await campaigns
    .update({ id, html: 'x' })
    .catch((error_: unknown) => {
      return error_;
    });
  expect(error).toBeInstanceOf(CampaignStateError);
  expect((error as CampaignStateError).status).toBe('sent');
  expect((error as Error).message).toBe('Cannot edit a campaign that is sent');
  await expect(
    campaigns.schedule({ id, audience: audience(1) })
  ).rejects.toThrow('Cannot schedule a campaign that is sent');
  await expect(campaigns.pause(id)).rejects.toThrow(CampaignStateError);
  await expect(campaigns.resume(id)).rejects.toThrow(CampaignStateError);
  await expect(campaigns.cancel(id)).rejects.toThrow(CampaignStateError);
});

test('preview renders for given variables, and sendTest sends one e-mail tagged as a test', async () => {
  const { campaigns, marketing } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  expect(await campaigns.preview({ id, variables: { nome: '<Ana>' } })).toEqual(
    {
      subject: 'Oferta para <Ana>',
      html: '<p>Olá, &lt;Ana&gt;</p>',
      text: 'Olá, <Ana>',
    }
  );
  await campaigns.sendTest({ id, to: 'me@x.co', variables: { nome: 'Eu' } });
  expect(marketing.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'me@x.co',
      subject: 'Oferta para Eu',
      tags: { campaign: id, test: 'true' },
    })
  );
  expect(renderCampaign({ content })).toEqual({
    subject: 'Oferta para ',
    html: '<p>Olá, </p>',
    text: 'Olá, ',
  });
});

test('works with the default clock, sleep and ids', async () => {
  const stores = createMemoryStores();
  const send = jest
    .fn()
    .mockResolvedValue({ status: 'sent', messageId: null, from: 'a@a.co' });
  const campaigns = createCampaigns({
    marketing: { send },
    campaigns: stores.campaigns,
    recipients: stores.recipients,
    ratePerSecond: 1000,
  });
  const campaign: Campaign = await campaigns.create({
    scope: 's',
    name: 'n',
    ...content,
  });
  expect(campaign.id).toMatch(/^[0-9a-f-]{36}$/);
  await campaigns.schedule({ id: campaign.id, audience: audience(2) });
  expect(await campaigns.tick()).toMatchObject({
    sent: 2,
    finished: [campaign.id],
  });
});

describe('memory stores', () => {
  test('release and complete ignore rows that are not there or not sending', async () => {
    const { recipients } = createMemoryStores() as {
      recipients: RecipientStore;
    };
    await recipients.add({
      campaignId: 'c',
      recipients: [{ email: 'a@x.co', variables: {} }],
    });
    await recipients.release({ campaignId: 'c', emails: ['a@x.co', 'b@x.co'] });
    await recipients.complete({
      campaignId: 'c',
      email: 'b@x.co',
      status: 'sent',
      reason: null,
      messageId: null,
    });
    expect(
      await recipients.failStale({ campaignId: 'c', claimedBefore: new Date() })
    ).toBe(0);
    expect(await recipients.count({ campaignId: 'c' })).toMatchObject({
      pending: 1,
    });
  });

  test('the suppression store keeps one row per scope and address', async () => {
    const { suppressions } = createMemoryStores();
    await suppressions.save({ email: 'a@x.co', scope: 's', reason: 'manual' });
    await suppressions.save({
      email: 'a@x.co',
      scope: 's',
      reason: 'complaint',
    });
    await suppressions.save({ email: 'a@x.co', scope: null, reason: 'bounce' });
    expect(await suppressions.find({ email: 'a@x.co', scopes: ['s'] })).toEqual(
      [{ email: 'a@x.co', scope: 's', reason: 'complaint' }]
    );
    await suppressions.removeManual({ email: 'a@x.co', scope: 's' });
    await suppressions.save({ email: 'b@x.co', scope: 's', reason: 'manual' });
    await suppressions.removeManual({ email: 'b@x.co', scope: 's' });
    expect(
      await suppressions.find({ email: 'b@x.co', scopes: ['s', null] })
    ).toEqual([]);
  });
});

test('an empty audience schedules a campaign that finishes on its first tick', async () => {
  const { campaigns } = setup();
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  expect((await campaigns.schedule({ id, audience: [] })).added).toBe(0);
  expect(await campaigns.tick()).toMatchObject({
    started: [id],
    finished: [id],
    sent: 0,
  });
});

test('the default rate is 10 per second', async () => {
  const stores = createMemoryStores();
  const send = jest
    .fn()
    .mockResolvedValue({ status: 'sent', messageId: null, from: 'a@a.co' });
  const sleep = jest.fn(async () => {});
  const campaigns = createCampaigns({
    marketing: { send },
    campaigns: stores.campaigns,
    recipients: stores.recipients,
    sleep,
    now: () => {
      return new Date(0);
    },
  });
  const { id } = await campaigns.create({ scope: 's', name: 'n', ...content });
  await campaigns.schedule({ id, audience: audience(1) });
  await campaigns.tick();
  expect(sleep).toHaveBeenCalledWith(100);
});

test('the memory campaign store treats a scheduled campaign without a date as due', async () => {
  const { campaigns } = createMemoryStores();
  const now = new Date();
  await campaigns.save({
    id: 'x',
    scope: 's',
    name: 'n',
    kind: 'campaign',
    ...content,
    status: 'scheduled',
    scheduledAt: null,
    startedAt: null,
    finishedAt: null,
    createdAt: now,
  });
  expect(
    (await campaigns.listDue({ now })).map((c) => {
      return c.id;
    })
  ).toEqual(['x']);
});
