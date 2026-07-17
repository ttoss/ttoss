import * as fslUi from '@ttoss/fsl-ui';
import { ENTITY_CONSEQUENCE, ENTITY_EVALUATION } from '@ttoss/fsl-ui/semantics';
import {
  CATALOG,
  catalogByEntity,
  findEntry,
  isComponentMeta,
  legalConsequences,
  legalEvaluations,
} from 'src/studio/components/catalog';

const metaExportCount = Object.entries(fslUi as Record<string, unknown>).filter(
  ([key, value]) => {
    return (
      key.endsWith('Meta') &&
      typeof value === 'object' &&
      value !== null &&
      'displayName' in value
    );
  }
).length;

describe('catalog auto-discovery', () => {
  test('discovers every *Meta export (reachability — PRD F3.1 AC)', () => {
    expect(CATALOG.length).toBeGreaterThan(0);
    expect(CATALOG.length).toBe(metaExportCount);
  });

  test('every entry has a valid semantic identity', () => {
    for (const entry of CATALOG) {
      expect(typeof entry.meta.displayName).toBe('string');
      expect(typeof entry.meta.entity).toBe('string');
      expect(typeof entry.meta.structure).toBe('string');
    }
  });

  test('entries are sorted by display name', () => {
    const names = CATALOG.map((entry) => {
      return entry.meta.displayName;
    });
    expect(names).toEqual(
      [...names].sort((a, b) => {
        return a.localeCompare(b);
      })
    );
  });

  test('findEntry resolves by key and misses gracefully', () => {
    const first = CATALOG[0];
    expect(findEntry(first.key)).toBe(first);
    expect(findEntry('__missing__')).toBeUndefined();
  });
});

describe('isComponentMeta', () => {
  test('accepts a well-shaped meta and rejects everything else', () => {
    expect(
      isComponentMeta({ displayName: 'X', entity: 'Action', structure: 'root' })
    ).toBe(true);
    expect(isComponentMeta(null)).toBe(false);
    expect(isComponentMeta('nope')).toBe(false);
    expect(
      isComponentMeta(() => {
        return undefined;
      })
    ).toBe(false);
    expect(isComponentMeta({ displayName: 'X' })).toBe(false);
  });
});

describe('catalogByEntity', () => {
  test('groups only non-empty entities and covers the whole catalog', () => {
    const groups = catalogByEntity();
    const grouped = groups.flatMap((group) => {
      return group.entries;
    });
    expect(grouped).toHaveLength(CATALOG.length);
    for (const group of groups) {
      expect(group.entries.length).toBeGreaterThan(0);
      for (const entry of group.entries) {
        expect(entry.meta.entity).toBe(group.entity);
      }
    }
  });
});

describe('legality (PRD AD-6: no illegal combination is expressible)', () => {
  test('offered props are always a subset of the entity legality matrices', () => {
    for (const entry of CATALOG) {
      const { entity } = entry.meta;
      expect(legalEvaluations(entity)).toEqual(ENTITY_EVALUATION[entity]);
      expect(legalConsequences(entity)).toEqual(ENTITY_CONSEQUENCE[entity]);
      for (const value of legalEvaluations(entity)) {
        expect(ENTITY_EVALUATION[entity]).toContain(value);
      }
      for (const value of legalConsequences(entity)) {
        expect(ENTITY_CONSEQUENCE[entity]).toContain(value);
      }
    }
  });

  test('only Action carries a consequence', () => {
    expect(legalConsequences('Action').length).toBeGreaterThan(0);
    expect(legalConsequences('Input')).toHaveLength(0);
    expect(legalConsequences('Selection')).toHaveLength(0);
  });

  test('Input and Selection carry no evaluation', () => {
    expect(legalEvaluations('Input')).toHaveLength(0);
    expect(legalEvaluations('Selection')).toHaveLength(0);
    expect(legalEvaluations('Action').length).toBeGreaterThan(0);
  });
});
