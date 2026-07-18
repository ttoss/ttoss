import {
  deleteDraft,
  listDrafts,
  loadDraft,
  newDraftId,
  saveDraft,
} from 'src/studio/session/drafts';
import {
  sanitizeSnapshot,
  type SessionSnapshot,
} from 'src/studio/session/sessionState';

const STORAGE_KEY = 'fsl-studio.drafts.v1';

const snapshot = (preset: string): SessionSnapshot => {
  // Route through the sanitizer so the fixture always matches the schema.
  const result = sanitizeSnapshot({ v: 1, theme: { preset } });
  if (!result) {
    throw new Error('fixture must sanitize');
  }
  return result;
};

test('save → list → load → delete round-trip, most recent first', () => {
  jest
    .spyOn(Date, 'now')
    .mockReturnValueOnce(1000) // saveDraft a
    .mockReturnValueOnce(2000); // saveDraft b
  saveDraft('a', snapshot('base'));
  saveDraft('b', snapshot('bruttal'));
  jest.restoreAllMocks();

  const drafts = listDrafts();
  expect(
    drafts.map((draft) => {
      return draft.id;
    })
  ).toEqual(['b', 'a']);
  expect(loadDraft('a')?.theme.preset).toBe('base');

  deleteDraft('a');
  expect(loadDraft('a')).toBeNull();
  expect(listDrafts()).toHaveLength(1);
});

test('loadDraft of an unknown id is null', () => {
  expect(loadDraft('missing')).toBeNull();
});

test('garbage in storage degrades to an empty shelf', () => {
  window.localStorage.setItem(STORAGE_KEY, 'not json');
  expect(listDrafts()).toEqual([]);

  window.localStorage.setItem(STORAGE_KEY, '[1,2]');
  expect(listDrafts()).toEqual([]);
});

test('invalid stored snapshots are skipped; bad timestamps degrade to 0', () => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ok: { updatedAt: 'soon', snapshot: { v: 1 } },
      bad: { updatedAt: 2, snapshot: { v: 99 } },
    })
  );
  const drafts = listDrafts();
  expect(drafts).toHaveLength(1);
  expect(drafts[0].id).toBe('ok');
  expect(drafts[0].updatedAt).toBe(0);
});

test('storage write failures are swallowed (autosave stays ambient)', () => {
  const spy = jest
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('quota');
    });
  expect(() => {
    return saveDraft('a', snapshot('base'));
  }).not.toThrow();
  spy.mockRestore();
});

test('newDraftId produces unique, storable ids', () => {
  const a = newDraftId();
  const b = newDraftId();
  expect(a).toMatch(/^d-/);
  expect(a).not.toBe(b);
});
