import {
  createSuppressionList,
  ResubscribeRefusedError,
  strongerReason,
} from '../../../src';
import { memoryStore } from './memoryStore';

const setup = () => {
  const { rows, store } = memoryStore();
  const onSuppress = jest.fn();
  const onResubscribe = jest.fn();
  const list = createSuppressionList({ store, onSuppress, onResubscribe });
  return { rows, list, onSuppress, onResubscribe };
};

test('a suppression is per address, normalized, and only for its scope', async () => {
  const { list, onSuppress } = setup();
  await list.suppress({
    scope: 'a',
    email: ' Maria@Example.com',
    reason: 'manual',
  });

  expect(
    await list.isSuppressed({ scope: 'a', email: 'maria@example.com' })
  ).toBe(true);
  expect(
    await list.isSuppressed({ scope: 'b', email: 'maria@example.com' })
  ).toBe(false);
  expect(onSuppress).toHaveBeenCalledWith({
    scope: 'a',
    email: 'maria@example.com',
    reason: 'manual',
    detail: null,
  });
});

test('a global suppression (scope null) applies to every scope', async () => {
  const { list } = setup();
  await list.suppress({
    scope: null,
    email: 'gone@x.co',
    reason: 'bounce',
    detail: 'General',
  });
  expect(await list.isSuppressed({ scope: 'anyone', email: 'gone@x.co' })).toBe(
    true
  );
  expect(
    await list.find({ scope: 'anyone', email: 'gone@x.co' })
  ).toMatchObject({
    reason: 'bounce',
    detail: 'General',
  });
});

test('suppressing again keeps the stronger reason and reports no change for a weaker one', async () => {
  const { list, rows, onSuppress } = setup();
  expect(
    await list.suppress({ scope: 'a', email: 'x@y.co', reason: 'manual' })
  ).toBe(true);
  expect(
    await list.suppress({ scope: 'a', email: 'x@y.co', reason: 'unsubscribe' })
  ).toBe(true);
  expect(
    await list.suppress({ scope: 'a', email: 'x@y.co', reason: 'manual' })
  ).toBe(false);
  expect(rows).toHaveLength(1);
  expect(rows[0].reason).toBe('unsubscribe');
  expect(onSuppress).toHaveBeenCalledTimes(2);
});

test('find returns the strongest of the scope and global suppressions', async () => {
  const { list } = setup();
  await list.suppress({ scope: 'a', email: 'x@y.co', reason: 'manual' });
  await list.suppress({ scope: null, email: 'x@y.co', reason: 'bounce' });
  expect((await list.find({ scope: 'a', email: 'x@y.co' }))?.reason).toBe(
    'bounce'
  );
});

test('an empty address is never suppressed and never stored', async () => {
  const { list, rows } = setup();
  expect(
    await list.suppress({ scope: 'a', email: ' ', reason: 'manual' })
  ).toBe(false);
  expect(await list.find({ scope: 'a', email: '' })).toBeNull();
  await list.resubscribe({ scope: 'a', email: '' });
  expect(rows).toHaveLength(0);
});

test('the sender may undo its own manual opt-out', async () => {
  const { list, onResubscribe } = setup();
  await list.suppress({ scope: 'a', email: 'x@y.co', reason: 'manual' });
  await list.resubscribe({ scope: 'a', email: 'X@y.co' });
  expect(await list.isSuppressed({ scope: 'a', email: 'x@y.co' })).toBe(false);
  expect(onResubscribe).toHaveBeenCalledWith({ scope: 'a', email: 'x@y.co' });
});

test.each(['unsubscribe', 'complaint'] as const)(
  "the recipient's own %s cannot be undone by the sender",
  async (reason) => {
    const { list } = setup();
    await list.suppress({ scope: 'a', email: 'x@y.co', reason });
    await expect(
      list.resubscribe({ scope: 'a', email: 'x@y.co' })
    ).rejects.toThrow(/only they can take it back/);
    expect(await list.isSuppressed({ scope: 'a', email: 'x@y.co' })).toBe(true);
  }
);

test('a bounced address cannot be resubscribed either', async () => {
  const { list } = setup();
  await list.suppress({ scope: null, email: 'x@y.co', reason: 'bounce' });
  const error = await list
    .resubscribe({ scope: 'a', email: 'x@y.co' })
    .catch((error_: unknown) => {
      return error_;
    });
  expect(error).toBeInstanceOf(ResubscribeRefusedError);
  expect((error as ResubscribeRefusedError).reason).toBe('bounce');
  expect((error as Error).message).toMatch(/bounced/);
});

test('strongerReason orders manual < unsubscribe < complaint < bounce', () => {
  expect(strongerReason('manual', 'unsubscribe')).toBe('unsubscribe');
  expect(strongerReason('bounce', 'complaint')).toBe('bounce');
  expect(strongerReason('complaint', 'unsubscribe')).toBe('complaint');
});

test('works without hooks', async () => {
  const { store } = memoryStore();
  const list = createSuppressionList({ store });
  await list.suppress({ scope: 'a', email: 'x@y.co', reason: 'manual' });
  await list.resubscribe({ scope: 'a', email: 'x@y.co' });
  expect(await list.isSuppressed({ scope: 'a', email: 'x@y.co' })).toBe(false);
});
