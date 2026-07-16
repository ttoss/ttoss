/**
 * Layer 1 — Semantic Foundation: invariant tests
 *
 * Structural tests — catches corruption (duplicates, empty strings, missing
 * entries, illegal cross-references) without requiring updates when new valid
 * terms are added to the vocabulary.
 */

import {
  COMPOSITION_ROLES,
  CONSEQUENCES,
  ENTITIES,
  ENTITY_COMPOSITION,
  ENTITY_CONSEQUENCE,
  ENTITY_STRUCTURE,
  EVALUATIONS,
  STATE_PRIORITY,
  STATES,
  STRUCTURAL_ROLES,
} from 'src/semantics/taxonomy';

// ---------------------------------------------------------------------------
// 1. Vocabulary invariants
// ---------------------------------------------------------------------------

const vocabularies: Array<[string, ReadonlyArray<string>]> = [
  ['ENTITIES', ENTITIES],
  ['EVALUATIONS', EVALUATIONS],
  ['STRUCTURAL_ROLES', STRUCTURAL_ROLES],
  ['STATES', STATES],
  ['COMPOSITION_ROLES', COMPOSITION_ROLES],
  ['CONSEQUENCES', CONSEQUENCES],
];

describe('vocabulary invariants', () => {
  test.each(vocabularies)('%s has no duplicates', (_name, vocab) => {
    expect(new Set(vocab).size).toBe(vocab.length);
  });

  test.each(vocabularies)('%s has no empty strings', (_name, vocab) => {
    for (const term of vocab) {
      expect(term).not.toBe('');
    }
  });
});

// ---------------------------------------------------------------------------
// 2. ENTITY_STRUCTURE matrix
// ---------------------------------------------------------------------------

describe('ENTITY_STRUCTURE', () => {
  test('covers every entity', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_STRUCTURE).toHaveProperty(entity);
    }
  });

  test('every entry references only known structural roles', () => {
    for (const entity of ENTITIES) {
      for (const role of ENTITY_STRUCTURE[entity]) {
        expect(STRUCTURAL_ROLES).toContain(role);
      }
    }
  });

  test('every entity has at least one legal structural role', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_STRUCTURE[entity].length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. ENTITY_COMPOSITION matrix (FSL §4)
// ---------------------------------------------------------------------------

describe('ENTITY_COMPOSITION', () => {
  test('covers every entity', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_COMPOSITION).toHaveProperty(entity);
    }
  });

  test('every entry references only known composition roles', () => {
    for (const entity of ENTITIES) {
      for (const role of ENTITY_COMPOSITION[entity]) {
        expect(COMPOSITION_ROLES).toContain(role);
      }
    }
  });

  test('Action allows the three canonical action slots', () => {
    expect(ENTITY_COMPOSITION.Action).toEqual(
      expect.arrayContaining([
        'primaryAction',
        'secondaryAction',
        'dismissAction',
      ])
    );
  });

  test('Feedback allows the status slot', () => {
    expect(ENTITY_COMPOSITION.Feedback).toContain('status');
  });
});

// ---------------------------------------------------------------------------
// 5. ENTITY_CONSEQUENCE matrix (FSL §6, profile-narrowed)
// ---------------------------------------------------------------------------

describe('ENTITY_CONSEQUENCE', () => {
  test('covers every entity', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_CONSEQUENCE).toHaveProperty(entity);
    }
  });

  test('every entry references only known consequence values', () => {
    for (const entity of ENTITIES) {
      for (const value of ENTITY_CONSEQUENCE[entity]) {
        expect(CONSEQUENCES).toContain(value);
      }
    }
  });

  test('Action is the only entity with non-empty consequence vocabulary', () => {
    for (const entity of ENTITIES) {
      if (entity === 'Action') {
        expect(ENTITY_CONSEQUENCE[entity].length).toBeGreaterThan(0);
      } else {
        expect(ENTITY_CONSEQUENCE[entity]).toEqual([]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. STATE_PRIORITY cascade — the canonical order referenced by
//    CONTRACT.md §3 and iterated by resolveInteractiveStyle.
// ---------------------------------------------------------------------------

describe('STATE_PRIORITY', () => {
  test('lists the canonical cascade order (highest to lowest priority)', () => {
    // Pinning the full order: any change here must be a deliberate edit that
    // updates CONTRACT.md §3 and resolveInteractiveStyle tests in the same
    // commit. This is the single source of truth for cascade precedence.
    expect(
      STATE_PRIORITY.map((e) => {
        return e.flag;
      })
    ).toEqual([
      'isDisabled',
      'isInvalid',
      'isExpanded',
      'isIndeterminate',
      'isSelected',
      'isFocusVisible',
      'isPressed',
      'isHovered',
    ]);
  });

  test('has no duplicate flags', () => {
    const flags = STATE_PRIORITY.map((e) => {
      return e.flag;
    });
    expect(new Set(flags).size).toBe(flags.length);
  });

  test('has no duplicate states', () => {
    const states = STATE_PRIORITY.map((e) => {
      return e.state;
    });
    expect(new Set(states).size).toBe(states.length);
  });

  test('every mapped state is a known State (or the "default" fallback)', () => {
    for (const { state } of STATE_PRIORITY) {
      expect(STATES).toContain(state);
    }
  });

  test('does not include "default" — that is the implicit fallback', () => {
    expect(
      STATE_PRIORITY.map((e) => {
        return e.state;
      })
    ).not.toContain('default');
  });
});
