/**
 * Layer 2 — Semantic Token Projection: invariant tests
 *
 * Structural tests for `src/tokens/projection.ts`. These enforce that the
 * projection stays consistent with the foundation (Entity coverage,
 * cognitive-mode grouping) and that projection terms do not collide with
 * foundation vocabulary.
 */

import { vars } from '@ttoss/fsl-theme/vars';
import { ENTITIES, STRUCTURAL_ROLES } from 'src/semantics/taxonomy';
import {
  ENTITY_TOKEN_MAPPING,
  SURFACE_TYPES,
  UX_CONTEXTS,
} from 'src/tokens/projection';

// ---------------------------------------------------------------------------
// 1. Cross-layer disjointness
// ---------------------------------------------------------------------------

describe('projection / foundation disjointness', () => {
  test('STRUCTURAL_ROLES and UX_CONTEXTS share no terms', () => {
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
// 1b. Cross-package coupling: UX_CONTEXTS ⊆ keyof vars.colors
//
// `UX_CONTEXTS` is fsl-ui's contract with fsl-theme: every ux-context this
// package claims to consume must exist as a subtree under `vars.colors`.
// Without this check, an fsl-theme rename (e.g. `feedback` → `status`) would let fsl-ui keep an
// outdated vocabulary — components would fail at a different layer, but the
// mismatch would not be localized.
// ---------------------------------------------------------------------------

describe('UX_CONTEXTS is a subset of vars.colors', () => {
  test.each(UX_CONTEXTS)('vars.colors.%s subtree exists in theme-v2', (ctx) => {
    expect(vars.colors).toHaveProperty(ctx);
  });
});

// ---------------------------------------------------------------------------
// 2. ENTITY_TOKEN_MAPPING — entity → UX context / surface type (CONTRACT.md §1.1)
// ---------------------------------------------------------------------------

describe('ENTITY_TOKEN_MAPPING', () => {
  test('covers every entity', () => {
    for (const entity of ENTITIES) {
      expect(ENTITY_TOKEN_MAPPING).toHaveProperty(entity);
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
});

// ---------------------------------------------------------------------------
// Cross-package drift guard — STATE_PRIORITY states must be token-backed
//
// `resolveInteractiveStyle` is strict: when a flag is set, the mapped state's
// value is returned even when `undefined`. A state key that exists in the
// taxonomy but has no token in @ttoss/fsl-theme therefore renders *nothing*
// (the bug ADR-017 fixed for `invalid`). This guard pins the contract: every
// signal state consumed by form controls resolves to a real CSS var.
// ---------------------------------------------------------------------------

describe('STATE_PRIORITY states are token-backed on input.primary', () => {
  const CONTROL_SIGNAL_STATES = [
    'invalid',
    'checked',
    'indeterminate',
    'disabled',
  ] as const;

  test.each(CONTROL_SIGNAL_STATES)(
    'input.primary border/background back the %s state',
    (state) => {
      const subtree = vars.colors.input.primary as Record<
        string,
        Record<string, string | undefined>
      >;
      expect(subtree.border?.[state] ?? subtree.background?.[state]).toMatch(
        /^var\(--tt-colors-input-primary-/
      );
    }
  );

  test('invalid is fully backed on all three dimensions (ADR-017)', () => {
    expect(vars.colors.input.primary.background.invalid).toBe(
      'var(--tt-colors-input-primary-background-invalid)'
    );
    expect(vars.colors.input.primary.border.invalid).toBe(
      'var(--tt-colors-input-primary-border-invalid)'
    );
    expect(vars.colors.input.primary.text.invalid).toBe(
      'var(--tt-colors-input-primary-text-invalid)'
    );
  });
});
