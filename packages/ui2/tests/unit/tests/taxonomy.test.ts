/**
 * Layer 1 — Semantic Foundation: invariant tests
 *
 * Structural tests — catches corruption (duplicates, empty strings, missing
 * entries, illegal cross-references) without requiring updates when new valid
 * terms are added to the vocabulary.
 */

import { validateExpression } from 'src/semantics/taxonomy';
import {
  COGNITIVE_MODES,
  COMPOSITION_ROLES,
  ENTITIES,
  ENTITY_COMPOSITION,
  ENTITY_INTERACTION,
  ENTITY_STRUCTURE,
  ENTITY_TOKEN_MAPPING,
  EVALUATIONS,
  INTERACTION_KINDS,
  INTERACTION_STATE,
  STATES,
  STRUCTURAL_ROLES,
  SURFACE_TYPES,
  UX_CONTEXTS,
} from 'src/semantics/taxonomy';

// ---------------------------------------------------------------------------
// 1. Vocabulary invariants
// ---------------------------------------------------------------------------

const vocabularies: Array<[string, ReadonlyArray<string>]> = [
  ['ENTITIES', ENTITIES],
  ['EVALUATIONS', EVALUATIONS],
  ['STRUCTURAL_ROLES', STRUCTURAL_ROLES],
  ['INTERACTION_KINDS', INTERACTION_KINDS],
  ['STATES', STATES],
  ['COMPOSITION_ROLES', COMPOSITION_ROLES],
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

  test('STRUCTURAL_ROLES and UX_CONTEXTS are disjoint (no cross-layer collision)', () => {
    // FSL Lexicon §10.11: the `content` vs `content` collision was resolved by
    // renaming the UX-context family to `informational`. This test guards the
    // resolution — no term may live in both vocabularies simultaneously.
    const shared = STRUCTURAL_ROLES.filter((role) => {
      return (UX_CONTEXTS as readonly string[]).includes(role);
    });
    expect(shared).toEqual([]);
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
// 4b. ENTITY_COMPOSITION matrix (FSL §4)
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

  test('accepts a legal evaluation for the entity', () => {
    expect(
      validateExpression({
        entity: 'Action',
        structure: 'root',
        interaction: 'command',
        evaluation: 'primary',
      })
    ).toHaveLength(0);
  });

  test('rejects an evaluation not legal for the entity', () => {
    const errors = validateExpression({
      entity: 'Action',
      structure: 'root',
      interaction: 'command',
      // @ts-expect-error — 'positive' is not legal for Action
      evaluation: 'positive',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('"positive"');
    expect(errors[0]).toContain('"Action"');
  });

  test('accepts a legal composition for the entity', () => {
    expect(
      validateExpression({
        entity: 'Action',
        structure: 'root',
        interaction: 'command',
        composition: 'primaryAction',
      })
    ).toHaveLength(0);
  });

  test('rejects a composition not legal for the entity', () => {
    const errors = validateExpression({
      entity: 'Action',
      structure: 'root',
      interaction: 'command',
      // @ts-expect-error — 'heading' is not legal for Action
      composition: 'heading',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('"heading"');
    expect(errors[0]).toContain('"Action"');
  });

  test('rejects composition for an entity with no legal compositions', () => {
    const errors = validateExpression({
      entity: 'Collection',
      structure: 'root',
      // @ts-expect-error — Collection has no legal compositions
      composition: 'heading',
    });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('none');
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

// ---------------------------------------------------------------------------
// 6. ENTITY_TOKEN_MAPPING — cognitive mode → UX context (CONTRACT.md §1.1)
// ---------------------------------------------------------------------------

describe('ENTITY_TOKEN_MAPPING', () => {
  test('covers every entity', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_TOKEN_MAPPING).toHaveProperty(entity);
    }
  });

  test('every cognitiveMode is a known value', () => {
    for (const entity of ENTITIES) {
      expect(COGNITIVE_MODES).toContain(
        ENTITY_TOKEN_MAPPING[entity].cognitiveMode
      );
    }
  });

  test('every uxContext is a known value', () => {
    for (const entity of ENTITIES) {
      expect(UX_CONTEXTS).toContain(ENTITY_TOKEN_MAPPING[entity].uxContext);
    }
  });

  test('every surfaceType is a known value', () => {
    for (const entity of ENTITIES) {
      expect(SURFACE_TYPES).toContain(ENTITY_TOKEN_MAPPING[entity].surfaceType);
    }
  });

  test('every UX context is used by at least one entity', () => {
    const usedContexts = new Set(
      ENTITIES.map((e) => {
        return ENTITY_TOKEN_MAPPING[e].uxContext;
      })
    );
    for (const ctx of UX_CONTEXTS) {
      expect(usedContexts).toContain(ctx);
    }
  });

  test('every cognitive mode is used by at least one entity', () => {
    const usedModes = new Set(
      ENTITIES.map((e) => {
        return ENTITY_TOKEN_MAPPING[e].cognitiveMode;
      })
    );
    for (const mode of COGNITIVE_MODES) {
      expect(usedModes).toContain(mode);
    }
  });

  test('cognitive mode is consistent with entity groupings', () => {
    // Entities sharing the same UX context must share the same cognitive mode
    const contextToMode = new Map<string, string>();
    for (const entity of ENTITIES) {
      const { uxContext, cognitiveMode } = ENTITY_TOKEN_MAPPING[entity];
      if (contextToMode.has(uxContext)) {
        expect(contextToMode.get(uxContext)).toBe(cognitiveMode);
      } else {
        contextToMode.set(uxContext, cognitiveMode);
      }
    }
  });

  test('every entity has a non-empty single-line intent', () => {
    // The `intent` field carries AI-facing rationale per Entity. A regression
    // (empty string, missing entry, multi-line blob) silently degrades the AI
    // context and is caught here.
    for (const entity of ENTITIES) {
      const { intent } = ENTITY_TOKEN_MAPPING[entity];
      expect(typeof intent).toBe('string');
      expect(intent.trim()).not.toBe('');
      expect(intent).toBe(intent.trim());
      expect(intent).not.toMatch(/[\r\n]/);
    }
  });
});
