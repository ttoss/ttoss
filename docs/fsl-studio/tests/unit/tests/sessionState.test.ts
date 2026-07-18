import { CATALOG } from 'src/studio/components/catalog';
import {
  decodeSession,
  DEFAULT_SELECTION,
  encodeSession,
  sanitizeSnapshot,
  type SessionSnapshot,
  snapshotFromHash,
  snapshotToHash,
} from 'src/studio/session/sessionState';

const snapshot: SessionSnapshot = {
  v: 1,
  lens: 'components',
  altitude: 'page',
  theme: {
    preset: 'bruttal',
    overrides: {
      'core.colors.brand.500': '#abcdef',
      'semantic.radii.control': '{core.radii.none}',
    },
    origins: {
      'core.colors.brand.500': 'manual',
      'semantic.radii.control': 'ai',
    },
  },
  component: {
    selection: { kind: 'page', id: 'form' },
    evaluation: 'accent',
    consequence: 'destructive',
  },
};

test('URL round-trip reproduces the full session state (F1 AC)', () => {
  const encoded = encodeSession(snapshot);
  // URL-safe payload (lz-string EncodedURIComponent alphabet).
  expect(encoded).toMatch(/^[A-Za-z0-9+$\-_.!*'(),]+$/);
  expect(decodeSession(encoded)).toEqual(snapshot);
  // And through the hash form used in the location bar.
  expect(snapshotFromHash(snapshotToHash(snapshot))).toEqual(snapshot);
});

test('hash without the session marker parses to null', () => {
  expect(snapshotFromHash('')).toBeNull();
  expect(snapshotFromHash('#other=1')).toBeNull();
});

describe('decodeSession on foreign payloads', () => {
  test('garbage that does not decompress yields null', () => {
    expect(decodeSession('%%%not-lz%%%')).toBeNull();
  });

  test('decompressible non-JSON yields null', () => {
    // Compress a plain string that is not valid JSON.
    const { compressToEncodedURIComponent } = jest.requireActual('lz-string');
    expect(decodeSession(compressToEncodedURIComponent('not json'))).toBeNull();
  });
});

describe('sanitizeSnapshot', () => {
  test('rejects non-objects and unknown versions', () => {
    expect(sanitizeSnapshot(null)).toBeNull();
    expect(sanitizeSnapshot('x')).toBeNull();
    expect(sanitizeSnapshot({ v: 2 })).toBeNull();
    expect(sanitizeSnapshot([1])).toBeNull();
  });

  test('a bare v1 payload degrades every field to safe defaults', () => {
    expect(sanitizeSnapshot({ v: 1 })).toEqual({
      v: 1,
      lens: 'theme',
      altitude: 'component',
      theme: { preset: 'base', overrides: {}, origins: {} },
      component: { selection: DEFAULT_SELECTION },
    });
  });

  test('invalid fields fall back individually', () => {
    const result = sanitizeSnapshot({
      v: 1,
      lens: 'nope',
      altitude: 'orbit',
      theme: {
        preset: 'vaporwave',
        overrides: { good: '#fff', bad: 42 },
        origins: { good: 'manual', bad: 'manual', good2: 'alien' },
      },
      component: {
        selection: { kind: 'component', key: '__missing__' },
        evaluation: 7,
        consequence: null,
      },
    });
    expect(result?.lens).toBe('theme');
    expect(result?.altitude).toBe('component');
    expect(result?.theme.preset).toBe('base');
    // Non-string override values are dropped…
    expect(result?.theme.overrides).toEqual({ good: '#fff' });
    // …and origins keep only valid values for surviving overrides.
    expect(result?.theme.origins).toEqual({ good: 'manual' });
    // Unknown component key falls back to the first catalog entry.
    expect(result?.component.selection).toEqual({
      kind: 'component',
      key: CATALOG[0].key,
    });
    expect(result?.component.evaluation).toBeUndefined();
    expect(result?.component.consequence).toBeUndefined();
  });

  test('valid page and component selections survive', () => {
    expect(
      sanitizeSnapshot({
        v: 1,
        component: { selection: { kind: 'page', id: 'wizard' } },
      })?.component.selection
    ).toEqual({ kind: 'page', id: 'wizard' });

    expect(
      sanitizeSnapshot({
        v: 1,
        component: { selection: { kind: 'component', key: 'buttonMeta' } },
      })?.component.selection
    ).toEqual({ kind: 'component', key: 'buttonMeta' });
  });

  test('an unknown page id falls back to the default selection', () => {
    expect(
      sanitizeSnapshot({
        v: 1,
        component: { selection: { kind: 'page', id: 'nope' } },
      })?.component.selection
    ).toEqual(DEFAULT_SELECTION);
  });

  test('non-object overrides/origins/selection degrade safely', () => {
    const result = sanitizeSnapshot({
      v: 1,
      theme: { overrides: [1, 2], origins: 'x' },
      component: { selection: 'x' },
    });
    expect(result?.theme.overrides).toEqual({});
    expect(result?.theme.origins).toEqual({});
    expect(result?.component.selection).toEqual(DEFAULT_SELECTION);
  });
});
