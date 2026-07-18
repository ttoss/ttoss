import { sanitizeSnapshot, type SessionSnapshot } from './sessionState';

/**
 * Drafts shelf (PRD F1.3, AD-10): silent autosave to localStorage keyed by
 * draft id. Two tabs on the same draft = last-write-wins — an accepted v1
 * limitation, documented in-app on the drafts list. Storage failures (quota,
 * private mode) are swallowed: autosave is ambient, never an interruption
 * (PRD §6.4-P2); stored garbage is sanitized on the way out.
 */

const STORAGE_KEY = 'fsl-studio.drafts.v1';

export interface DraftRecord {
  id: string;
  updatedAt: number;
  snapshot: SessionSnapshot;
}

type DraftIndex = Record<string, { updatedAt: number; snapshot: unknown }>;

const readIndex = (): DraftIndex => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as DraftIndex)
      : {};
  } catch {
    return {};
  }
};

const writeIndex = (index: DraftIndex): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
  } catch {
    // Quota/private-mode failures: autosave silently degrades (PRD F1.3).
  }
};

export const newDraftId = (): string => {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

/** Last-write-wins upsert of a draft (PRD F1.3). */
export const saveDraft = (id: string, snapshot: SessionSnapshot): void => {
  const index = readIndex();
  index[id] = { updatedAt: Date.now(), snapshot };
  writeIndex(index);
};

export const loadDraft = (id: string): SessionSnapshot | null => {
  const entry = readIndex()[id];
  return entry ? sanitizeSnapshot(entry.snapshot) : null;
};

export const deleteDraft = (id: string): void => {
  const index = readIndex();
  delete index[id];
  writeIndex(index);
};

/** All valid drafts, most recently updated first. */
export const listDrafts = (): DraftRecord[] => {
  const index = readIndex();
  const records: DraftRecord[] = [];
  for (const id of Object.keys(index)) {
    const snapshot = sanitizeSnapshot(index[id].snapshot);
    if (snapshot) {
      records.push({
        id,
        updatedAt: Number(index[id].updatedAt) || 0,
        snapshot,
      });
    }
  }
  return records.sort((a, b) => {
    return b.updatedAt - a.updatedAt;
  });
};
