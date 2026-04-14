/**
 * Layer 1 — Semantic Foundation: invariant tests
 *
 * Structural tests — catches corruption (duplicates, empty strings, missing
 * entries, illegal cross-references) without requiring updates when new valid
 * terms are added to the vocabulary.
 */

import { validateExpression } from 'src/semantics/taxonomy';
import {
  CONSEQUENCES,
  ENTITIES,
  ENTITY_INTERACTION,
  ENTITY_STRUCTURE,
  EVALUATIONS,
  INTERACTION_KINDS,
  INTERACTION_STATE,
  STATES,
  STRUCTURAL_ROLES,
} from 'src/semantics/taxonomy';

// ---------------------------------------------------------------------------
// 1. Vocabulary invariants
// ---------------------------------------------------------------------------

const vocabularies: Array<[string, ReadonlyArray<string>]> = [
  ['ENTITIES', ENTITIES],
  ['EVALUATIONS', EVALUATIONS],
  ['CONSEQUENCES', CONSEQUENCES],
  ['STRUCTURAL_ROLES', STRUCTURAL_ROLES],
  ['INTERACTION_KINDS', INTERACTION_KINDS],
  ['STATES', STATES],
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
// 3. ENTITY_INTERACTION matrix
// ---------------------------------------------------------------------------

describe('ENTITY_INTERACTION', () => {
  test('covers every entity', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_INTERACTION).toHaveProperty(entity);
    }
  });

  test('every entry references only known interaction kinds', () => {
    for (const entity of ENTITIES) {
      for (const kind of ENTITY_INTERACTION[entity]) {
        expect(INTERACTION_KINDS).toContain(kind);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. INTERACTION_STATE matrix
// ---------------------------------------------------------------------------

describe('INTERACTION_STATE', () => {
  test('covers every interaction kind', () => {
    for (const kind of INTERACTION_KINDS) {
      expect(INTERACTION_STATE[kind]).toBeDefined();
    }
  });

  test('every entry references only known states', () => {
    for (const kind of INTERACTION_KINDS) {
      for (const state of INTERACTION_STATE[kind]) {
        expect(STATES).toContain(state);
      }
    }
  });

  test('every interaction kind has at least one legal state', () => {
    for (const kind of INTERACTION_KINDS) {
      expect(INTERACTION_STATE[kind].length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. validateExpression — legality rules
// ---------------------------------------------------------------------------

describe('validateExpression', () => {
  test('accepts a valid Action + command expression', () => {
    expect(
      validateExpression({
        entity: 'Action',
        structure: 'root',
        interaction: 'command',
      })
    ).toHaveLength(0);
  });

  test('accepts a minimal expression (no interaction)', () => {
    expect(
      validateExpression({ entity: 'Input', structure: 'control' })
    ).toHaveLength(0);
  });

  test('accepts Navigation + navigate.link', () => {
    expect(
      validateExpression({
        entity: 'Navigation',
        structure: 'root',
        interaction: 'navigate.link',
      })
    ).toHaveLength(0);
  });

  test('accepts Structure with no interaction (entity has none)', () => {
    expect(
      validateExpression({ entity: 'Structure', structure: 'surface' })
    ).toHaveLength(0);
  });

  test('rejects a structure not legal for the entity', () => {
    const errors = validateExpression({
      entity: 'Action',
      structure: 'backdrop',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('"backdrop"');
    expect(errors[0]).toContain('"Action"');
  });

  test('rejects an interaction not legal for the entity', () => {
    const errors = validateExpression({
      entity: 'Action',
      structure: 'root',
      interaction: 'entry.text',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('"entry.text"');
  });

  test('rejects interaction for an entity with no legal interactions', () => {
    const errors = validateExpression({
      entity: 'Collection',
      structure: 'root',
      interaction: 'command',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('none');
  });

  test('returns multiple errors when both structure and interaction are illegal', () => {
    const errors = validateExpression({
      entity: 'Action',
      structure: 'backdrop',
      interaction: 'entry.text',
    });
    expect(errors.length).toBe(2);
  });

  test('error messages include enough context to be actionable', () => {
    const [error] = validateExpression({
      entity: 'Action',
      structure: 'backdrop',
    });
    // must name what was illegal
    expect(error).toContain('"backdrop"');
    // must name which entity rejected it
    expect(error).toContain('"Action"');
    // must tell the developer what IS legal
    expect(error).toContain('root');
  });
});
