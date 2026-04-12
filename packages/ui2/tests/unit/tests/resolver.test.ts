/**
 * Semantic Token Resolver — Invariant Tests
 *
 * Verifies deterministic, structural guarantees of the resolver.
 * No rendering, no React, no DOM.
 *
 * INVARIANTS ENFORCED:
 *   1. RESPONSIBILITY_UX_MAP completeness — every Responsibility maps to a UxContext
 *   2. Canonical cross-projection mappings — non-obvious Responsibility → ux projections
 *   3. Default evaluation → 'primary' when no evaluation or consequence is given
 *   4. Consequence override — 'destructive' automatically resolves to 'negative' role
 *   5. Consequence takes precedence over explicit evaluation
 *   6. State set correctness per UX context
 *   7. Var values are CSS var() references from @ttoss/theme2/vars
 *   8. No core token vars in any resolver output (G1 enforcement)
 *   9. Invalid role → console.warn + empty ColorSpec
 *  10. UX_VALID_ROLES covers all UX contexts
 *  11. TokenSpec structure — all three dimensions always present
 *  12. STATE_SELECTORS structural integrity
 *  13. resolveRole — lightweight render-time role resolution
 *  14. buildColorSpec — var-tree navigation for a given ux + role
 *  15. generateComponentCss — per-variant CSS selector generation with direct var(--tt-*) refs
 */

import {
  buildColorSpec,
  type ColorRole,
  type FslState,
  generateComponentCss,
  resolveRole,
  resolveTokens,
  RESPONSIBILITY_UX_MAP,
  STATE_SELECTORS,
  type TokenSpec,
  UX_VALID_ROLES,
  type UxContext,
} from 'src/_model/resolver';
import { RESPONSIBILITIES } from 'src/_model/taxonomy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all unique CSS var() references from a TokenSpec. */
const flattenVars = (spec: TokenSpec): Set<string> => {
  const out = new Set<string>();
  for (const dim of ['background', 'border', 'text'] as const) {
    for (const val of Object.values(spec.colors[dim])) {
      out.add(val);
    }
  }
  return out;
};

/** Extract the CSS custom property name from a var() reference. */
const extractPropName = (varRef: string): string => {
  // 'var(--tt-colors-action-primary-background-default)' → '--tt-colors-action-primary-background-default'
  return varRef.slice(4, -1);
};

// ---------------------------------------------------------------------------
// 1. RESPONSIBILITY_UX_MAP completeness
// ---------------------------------------------------------------------------

describe('RESPONSIBILITY_UX_MAP', () => {
  test('every Responsibility value has a UxContext mapping', () => {
    for (const r of RESPONSIBILITIES) {
      expect(RESPONSIBILITY_UX_MAP[r]).toBeDefined();
    }
  });

  test('has no entries beyond RESPONSIBILITIES', () => {
    const mapKeys = Object.keys(RESPONSIBILITY_UX_MAP);
    expect(mapKeys.sort()).toEqual([...RESPONSIBILITIES].sort());
  });
});

// ---------------------------------------------------------------------------
// 2. Canonical cross-projection mappings (non-obvious)
// ---------------------------------------------------------------------------

describe('resolveTokens — canonical cross-projection mappings', () => {
  test('Action → action (1:1)', () => {
    expect(resolveTokens({ responsibility: 'Action' }).ux).toBe('action');
  });

  test('Input → input (1:1)', () => {
    expect(resolveTokens({ responsibility: 'Input' }).ux).toBe('input');
  });

  test('Selection → input (no separate selection context)', () => {
    expect(resolveTokens({ responsibility: 'Selection' }).ux).toBe('input');
  });

  test('Navigation → navigation (1:1)', () => {
    expect(resolveTokens({ responsibility: 'Navigation' }).ux).toBe(
      'navigation'
    );
  });

  test('Feedback → feedback (1:1)', () => {
    expect(resolveTokens({ responsibility: 'Feedback' }).ux).toBe('feedback');
  });

  test('Disclosure → navigation (disclosure triggers share navigation semantic)', () => {
    expect(resolveTokens({ responsibility: 'Disclosure' }).ux).toBe(
      'navigation'
    );
  });

  test('Collection → content (collection surfaces consume content tokens)', () => {
    expect(resolveTokens({ responsibility: 'Collection' }).ux).toBe('content');
  });

  test('Overlay → content (overlay surfaces consume content tokens)', () => {
    expect(resolveTokens({ responsibility: 'Overlay' }).ux).toBe('content');
  });

  test('Structure → content (structural surfaces consume content tokens)', () => {
    expect(resolveTokens({ responsibility: 'Structure' }).ux).toBe('content');
  });
});

// ---------------------------------------------------------------------------
// 3. Default evaluation
// ---------------------------------------------------------------------------

describe('resolveTokens — default evaluation', () => {
  test('role defaults to primary when no evaluation or consequence given', () => {
    const spec = resolveTokens({ responsibility: 'Action' });
    expect(spec.role).toBe('primary');
  });

  test('respects explicit evaluation when given', () => {
    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'secondary',
    });
    expect(spec.role).toBe('secondary');
  });
});

// ---------------------------------------------------------------------------
// 4. Consequence override
// ---------------------------------------------------------------------------

describe('resolveTokens — consequence override', () => {
  test('destructive consequence → role becomes negative', () => {
    const spec = resolveTokens({
      responsibility: 'Action',
      consequence: 'destructive',
    });
    expect(spec.role).toBe('negative');
    expect(spec.ux).toBe('action');
  });

  test('neutral consequence has no effect — role falls back to evaluation or primary', () => {
    const spec = resolveTokens({
      responsibility: 'Action',
      consequence: 'neutral',
    });
    expect(spec.role).toBe('primary');
  });

  test('other consequences have no role override in V1', () => {
    for (const consequence of [
      'reversible',
      'committing',
      'interruptive',
      'recoverable',
      'safeDefaultRequired',
    ] as const) {
      const spec = resolveTokens({ responsibility: 'Action', consequence });
      expect(spec.role).toBe('primary');
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Consequence takes precedence over evaluation
// ---------------------------------------------------------------------------

describe('resolveTokens — consequence precedes evaluation', () => {
  test('destructive + explicit positive → negative wins (consequence override)', () => {
    // destructive consequence overrides the explicit evaluation
    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'positive', // positive is not valid for action anyway
      consequence: 'destructive',
    });
    expect(spec.role).toBe('negative');
  });

  test('destructive + explicit primary → negative wins', () => {
    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'primary',
      consequence: 'destructive',
    });
    expect(spec.role).toBe('negative');
  });
});

// ---------------------------------------------------------------------------
// 6. State set correctness per UX context
// ---------------------------------------------------------------------------

describe('resolveTokens — state sets per UX context', () => {
  const getStates = (ux: UxContext, role: ColorRole = 'primary'): string[] => {
    // Find a responsibility mapping to this ux
    const responsibility = Object.entries(RESPONSIBILITY_UX_MAP).find(
      ([, u]) => {
        return u === ux;
      }
    )![0] as (typeof RESPONSIBILITIES)[number];
    return Object.keys(
      resolveTokens({ responsibility, evaluation: role }).colors.background
    );
  };

  describe('action context', () => {
    let states: string[];
    beforeAll(() => {
      states = getStates('action');
    });

    test('includes base states', () => {
      expect(states).toContain('default');
      expect(states).toContain('hover');
      expect(states).toContain('disabled');
      // focused is in border dimension (focus ring), not background
    });

    test('includes pressed and expanded', () => {
      expect(states).toContain('pressed');
      expect(states).toContain('expanded');
    });

    test('does not include checked or indeterminate', () => {
      expect(states).not.toContain('checked');
      expect(states).not.toContain('indeterminate');
    });

    test('does not include current or visited', () => {
      expect(states).not.toContain('current');
      expect(states).not.toContain('visited');
    });
  });

  describe('input context (Selection responsibility)', () => {
    let states: string[];
    beforeAll(() => {
      states = Object.keys(
        resolveTokens({ responsibility: 'Selection' }).colors.background
      );
    });

    test('includes checked and indeterminate', () => {
      expect(states).toContain('checked');
      expect(states).toContain('indeterminate');
    });

    test('includes pressed and expanded', () => {
      expect(states).toContain('pressed');
      expect(states).toContain('expanded');
    });

    test('does not include current or visited', () => {
      expect(states).not.toContain('current');
      expect(states).not.toContain('visited');
    });
  });

  describe('navigation context', () => {
    let states: string[];
    beforeAll(() => {
      states = getStates('navigation');
    });

    test('includes current, visited, expanded', () => {
      expect(states).toContain('current');
      expect(states).toContain('visited');
      expect(states).toContain('expanded');
    });

    test('does not include checked or indeterminate', () => {
      expect(states).not.toContain('checked');
      expect(states).not.toContain('indeterminate');
    });

    test('does not include pressed', () => {
      expect(states).not.toContain('pressed');
    });
  });

  describe('feedback context', () => {
    let states: string[];
    beforeAll(() => {
      states = getStates('feedback');
    });

    test('has base states only — no pressed, expanded, checked, current, visited', () => {
      expect(states).not.toContain('pressed');
      expect(states).not.toContain('expanded');
      expect(states).not.toContain('checked');
      expect(states).not.toContain('current');
      expect(states).not.toContain('visited');
    });

    test('has default', () => {
      expect(states).toContain('default');
    });
  });

  describe('content context (Collection responsibility)', () => {
    let states: string[];
    beforeAll(() => {
      states = Object.keys(
        resolveTokens({ responsibility: 'Collection' }).colors.background
      );
    });

    test('includes visited', () => {
      expect(states).toContain('visited');
    });

    test('does not include expanded, pressed, checked, current', () => {
      expect(states).not.toContain('expanded');
      expect(states).not.toContain('pressed');
      expect(states).not.toContain('checked');
      expect(states).not.toContain('current');
    });
  });
});

// ---------------------------------------------------------------------------
// 7. Resolver delegates to @ttoss/theme2/vars — emitted values are var() refs
// ---------------------------------------------------------------------------

describe('resolveTokens — delegates to @ttoss/theme2/vars', () => {
  test('action.primary.background.default is a var(--tt-colors-*) reference', () => {
    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'primary',
    });
    expect(spec.colors.background['default']).toBe(
      'var(--tt-colors-action-primary-background-default)'
    );
  });

  test('input.primary.border.focused is a var(--tt-colors-*) reference', () => {
    const spec = resolveTokens({
      responsibility: 'Input',
      evaluation: 'primary',
    });
    expect(spec.colors.border['focused']).toBe(
      'var(--tt-colors-input-primary-border-focused)'
    );
  });

  test('navigation.primary.text.current is a var(--tt-colors-*) reference', () => {
    const spec = resolveTokens({
      responsibility: 'Navigation',
      evaluation: 'primary',
    });
    expect(spec.colors.text['current']).toBe(
      'var(--tt-colors-navigation-primary-text-current)'
    );
  });

  test('Selection maps to input ux — var uses "input" prefix not "selection"', () => {
    const spec = resolveTokens({
      responsibility: 'Selection',
      evaluation: 'primary',
    });
    expect(spec.colors.background['checked']).toBe(
      'var(--tt-colors-input-primary-background-checked)'
    );
  });
});

// ---------------------------------------------------------------------------
// 8. No core token vars in any output (G1)
// ---------------------------------------------------------------------------

describe('resolveTokens — no core tokens in output (G1 guardrail)', () => {
  test.each(RESPONSIBILITIES)(
    '%s — no --tt-core- vars in TokenSpec',
    (responsibility) => {
      const spec = resolveTokens({ responsibility });
      const vars = flattenVars(spec);
      for (const v of vars) {
        const propName = extractPropName(v);
        expect(propName).not.toMatch(/^--tt-core-/);
      }
    }
  );
});

// ---------------------------------------------------------------------------
// 9. Invalid role → console.warn + empty ColorSpec
// ---------------------------------------------------------------------------

describe('resolveTokens — invalid role handling', () => {
  test('warns when role is not valid for ux context', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // 'positive' is not a valid role for 'action' context
    resolveTokens({ responsibility: 'Action', evaluation: 'positive' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('[ui2/resolver]');
    expect(spy.mock.calls[0][0]).toContain('"positive"');
    expect(spy.mock.calls[0][0]).toContain('"action"');

    spy.mockRestore();
  });

  test('returns fallback primary ColorSpec on invalid role', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'positive',
    });

    expect(spec.ux).toBe('action');
    expect(spec.role).toBe('primary');
    // Falls back to 'primary' and builds that role's ColorSpec
    expect(Object.keys(spec.colors.background).length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  test('accent is not valid for feedback context', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    resolveTokens({ responsibility: 'Feedback', evaluation: 'accent' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 10. UX_VALID_ROLES completeness
// ---------------------------------------------------------------------------

describe('UX_VALID_ROLES', () => {
  const allUxContexts: UxContext[] = [
    'action',
    'input',
    'navigation',
    'feedback',
    'content',
  ];

  test('has an entry for every UxContext', () => {
    for (const ux of allUxContexts) {
      expect(UX_VALID_ROLES[ux]).toBeDefined();
      expect(UX_VALID_ROLES[ux].length).toBeGreaterThan(0);
    }
  });

  test("every context includes 'primary'", () => {
    for (const ux of allUxContexts) {
      expect(UX_VALID_ROLES[ux]).toContain('primary');
    }
  });

  test("non-navigation contexts include 'muted'", () => {
    // navigation is trimmed to ['primary'] (baseTheme only defines navigation.primary)
    for (const ux of allUxContexts.filter((u) => {
      return u !== 'navigation';
    })) {
      expect(UX_VALID_ROLES[ux]).toContain('muted');
    }
  });

  test("'positive' is not valid for action or navigation", () => {
    expect(UX_VALID_ROLES['action']).not.toContain('positive');
    expect(UX_VALID_ROLES['navigation']).not.toContain('positive');
  });

  test("'accent' is not valid for action, input, feedback, or content", () => {
    // These roles are absent from baseTheme — would produce invisible components (B-08)
    expect(UX_VALID_ROLES['action']).not.toContain('accent');
    expect(UX_VALID_ROLES['input']).not.toContain('accent');
    expect(UX_VALID_ROLES['feedback']).not.toContain('accent');
    expect(UX_VALID_ROLES['content']).not.toContain('accent');
  });

  test("'secondary' is not valid for input (absent from baseTheme)", () => {
    expect(UX_VALID_ROLES['input']).not.toContain('secondary');
  });

  test("navigation only defines 'primary' (matches baseTheme coverage)", () => {
    expect(UX_VALID_ROLES['navigation']).toEqual(['primary']);
  });
});

// ---------------------------------------------------------------------------
// 11. TokenSpec structure — all three dimensions always present
// ---------------------------------------------------------------------------

describe('resolveTokens — TokenSpec structure', () => {
  test.each(RESPONSIBILITIES)(
    '%s — all three dimensions present and non-empty',
    (responsibility) => {
      const spec = resolveTokens({ responsibility });
      expect(spec.colors).toHaveProperty('background');
      expect(spec.colors).toHaveProperty('border');
      expect(spec.colors).toHaveProperty('text');
      // Default state always present in valid resolution
      expect(spec.colors.background['default']).toBeDefined();
      expect(spec.colors.border['default']).toBeDefined();
      expect(spec.colors.text['default']).toBeDefined();
    }
  );

  test('ux and role are both surfaces in the TokenSpec', () => {
    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'secondary',
    });
    expect(spec.ux).toBe('action');
    expect(spec.role).toBe('secondary');
  });
});

// ---------------------------------------------------------------------------
// 12. STATE_SELECTORS structural integrity
// ---------------------------------------------------------------------------

describe('STATE_SELECTORS', () => {
  test('default state has null selector (base selector, no attribute)', () => {
    expect(STATE_SELECTORS['default']).toBeNull();
  });

  test('all other states have a non-empty selector string', () => {
    const states = Object.keys(STATE_SELECTORS) as FslState[];
    for (const state of states) {
      if (state === 'default') continue;
      expect(typeof STATE_SELECTORS[state]).toBe('string');
      expect((STATE_SELECTORS[state] as string).length).toBeGreaterThan(0);
    }
  });

  test(':visited uses CSS pseudo-class syntax (starts with :)', () => {
    expect(STATE_SELECTORS['visited']).toBe(':visited');
  });

  test('hover uses :hover CSS pseudo-class (works for native elements and Ark UI alike)', () => {
    expect(STATE_SELECTORS['hover']).toBe(':hover');
  });

  test('active uses :active CSS pseudo-class', () => {
    expect(STATE_SELECTORS['active']).toBe(':active');
  });

  test('focused uses :focus-visible CSS pseudo-class', () => {
    expect(STATE_SELECTORS['focused']).toBe(':focus-visible');
  });

  test('expanded uses [data-state="open"] (Ark state machine — no CSS pseudo-class equivalent)', () => {
    expect(STATE_SELECTORS['expanded']).toBe('[data-state="open"]');
  });

  test('checked uses [data-state="checked"] (Ark state machine)', () => {
    expect(STATE_SELECTORS['checked']).toBe('[data-state="checked"]');
  });

  test('disabled uses [data-disabled] (Ark context propagation form)', () => {
    expect(STATE_SELECTORS['disabled']).toBe('[data-disabled]');
  });

  test('selected and checked produce the same CSS selector (collision by design)', () => {
    expect(STATE_SELECTORS['selected']).toBe(STATE_SELECTORS['checked']);
  });
});

// ---------------------------------------------------------------------------
// 13. resolveRole — lightweight render-time role resolution
// ---------------------------------------------------------------------------

describe('resolveRole', () => {
  // ── Default fallback ───────────────────────────────────────────────────────

  test("returns 'primary' by default (no evaluation, no consequence)", () => {
    const role = resolveRole({ responsibility: 'Action' });
    expect(role).toBe('primary');
  });

  // ── Evaluation passthrough ─────────────────────────────────────────────────

  test('returns the evaluation when provided', () => {
    const role = resolveRole({
      responsibility: 'Action',
      evaluation: 'secondary',
    });
    expect(role).toBe('secondary');
  });

  test('returns muted when evaluation is muted', () => {
    const role = resolveRole({
      responsibility: 'Action',
      evaluation: 'muted',
    });
    expect(role).toBe('muted');
  });

  // ── Consequence override ───────────────────────────────────────────────────

  test("returns 'negative' when consequence is 'destructive'", () => {
    const role = resolveRole({
      responsibility: 'Action',
      consequence: 'destructive',
    });
    expect(role).toBe('negative');
  });

  test('consequence override takes precedence over evaluation', () => {
    const role = resolveRole({
      responsibility: 'Action',
      evaluation: 'secondary',
      consequence: 'destructive',
    });
    expect(role).toBe('negative');
  });

  test('neutral consequence has no override — falls back to evaluation', () => {
    const role = resolveRole({
      responsibility: 'Action',
      evaluation: 'secondary',
      consequence: 'neutral',
    });
    expect(role).toBe('secondary');
  });

  test('non-override consequences do not affect role (V1)', () => {
    for (const consequence of [
      'reversible',
      'committing',
      'interruptive',
      'recoverable',
      'safeDefaultRequired',
    ] as const) {
      const role = resolveRole({ responsibility: 'Action', consequence });
      expect(role).toBe('primary');
    }
  });

  // ── Invalid role fallback ──────────────────────────────────────────────────

  test("falls back to 'primary' with console.warn when role is invalid for ux context", () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // 'positive' is not valid for 'action' context
    const role = resolveRole({
      responsibility: 'Action',
      evaluation: 'positive',
    });

    expect(role).toBe('primary');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('[ui2/resolver]');
    expect(spy.mock.calls[0][0]).toContain('"positive"');
    expect(spy.mock.calls[0][0]).toContain('"action"');
    expect(spy.mock.calls[0][0]).toContain("Falling back to 'primary'");

    spy.mockRestore();
  });

  test("falls back to 'primary' when accent is used in feedback context", () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const role = resolveRole({
      responsibility: 'Feedback',
      evaluation: 'accent',
    });

    expect(role).toBe('primary');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  // ── Each responsibility maps to the correct UX context for role resolution ─

  test('each responsibility with default expression resolves to primary', () => {
    for (const r of RESPONSIBILITIES) {
      const role = resolveRole({ responsibility: r });
      expect(role).toBe('primary');
    }
  });

  test('Selection uses input ux context — negative is a valid role', () => {
    const role = resolveRole({
      responsibility: 'Selection',
      evaluation: 'negative',
    });
    expect(role).toBe('negative');
  });

  test('Disclosure uses navigation ux context — only primary is valid', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // secondary is not valid for navigation context
    const role = resolveRole({
      responsibility: 'Disclosure',
      evaluation: 'secondary',
    });
    expect(role).toBe('primary');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  // ── Consistency with resolveTokens role resolution ─────────────────────────

  test('resolveRole returns the same role as resolveTokens for valid roles', () => {
    for (const r of RESPONSIBILITIES) {
      const roleFromResolveRole = resolveRole({ responsibility: r });
      const { role: roleFromResolveTokens } = resolveTokens({
        responsibility: r,
      });
      expect(roleFromResolveRole).toBe(roleFromResolveTokens);
    }
  });

  test('resolveRole and resolveTokens both fall back to primary for invalid roles', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // resolveRole falls back to 'primary'
    const roleResult = resolveRole({
      responsibility: 'Action',
      evaluation: 'positive',
    });
    expect(roleResult).toBe('primary');

    // resolveTokens also falls back to 'primary' (consistent behavior)
    const tokenResult = resolveTokens({
      responsibility: 'Action',
      evaluation: 'positive',
    });
    expect(tokenResult.role).toBe('primary');

    spy.mockRestore();
  });

  // ── Warn message includes valid roles and responsibility ───────────────────

  test('warn message lists valid roles for the context', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    resolveRole({ responsibility: 'Action', evaluation: 'positive' });

    const msg = spy.mock.calls[0][0] as string;
    expect(msg).toContain('Valid roles:');
    expect(msg).toContain('primary');
    expect(msg).toContain('secondary');
    expect(msg).toContain('Responsibility: "Action"');

    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// 14. buildColorSpec — var-tree navigation for a given ux + role
// ---------------------------------------------------------------------------

describe('buildColorSpec', () => {
  test('returns all three dimensions', () => {
    const spec = buildColorSpec('action', 'primary');
    expect(spec).toHaveProperty('background');
    expect(spec).toHaveProperty('border');
    expect(spec).toHaveProperty('text');
  });

  test('each dimension has a default state', () => {
    const spec = buildColorSpec('action', 'primary');
    expect(spec.background['default']).toBeDefined();
    expect(spec.border['default']).toBeDefined();
    expect(spec.text['default']).toBeDefined();
  });

  test('values are var(--tt-colors-*) references', () => {
    const spec = buildColorSpec('action', 'primary');
    expect(spec.background['default']).toBe(
      'var(--tt-colors-action-primary-background-default)'
    );
  });

  test('matches resolveTokens output for the same ux/role', () => {
    const fromBuild = buildColorSpec('input', 'primary');
    const fromResolve = resolveTokens({
      responsibility: 'Input',
      evaluation: 'primary',
    });
    expect(fromBuild).toEqual(fromResolve.colors);
  });

  test('returns all states defined in baseTheme for the given ux/role', () => {
    const spec = buildColorSpec('action', 'primary');
    // action.primary should have hover, disabled, etc.
    expect(spec.background['hover']).toBeDefined();
    expect(spec.background['disabled']).toBeDefined();
  });

  test('content.secondary returns valid ColorSpec', () => {
    const spec = buildColorSpec('content', 'secondary');
    expect(spec.background['default']).toBe(
      'var(--tt-colors-content-secondary-background-default)'
    );
  });

  test('all values across all dimensions are CSS var() references', () => {
    const spec = buildColorSpec('action', 'primary');
    for (const dim of ['background', 'border', 'text'] as const) {
      for (const val of Object.values(spec[dim])) {
        expect(val).toMatch(/^var\(--tt-colors-/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 15. generateComponentCss — per-variant CSS generation with direct var(--tt-*)
// ---------------------------------------------------------------------------

describe('generateComponentCss', () => {
  // ── Structural invariants ────────────────────────────────────────────────

  test('returns a string', () => {
    expect(
      typeof generateComponentCss({ scope: 'button', responsibility: 'Action' })
    ).toBe('string');
  });

  test('uses the correct base selector with scope and part', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain("[data-scope='button'][data-part='root']");
  });

  test('accepts a custom part', () => {
    const css = generateComponentCss({
      scope: 'checkbox',
      responsibility: 'Selection',
      part: 'control',
    });
    expect(css).toContain("[data-scope='checkbox'][data-part='control']");
  });

  test('default part is "root"', () => {
    const withDefault = generateComponentCss({
      scope: 'x',
      responsibility: 'Action',
    });
    const withExplicit = generateComponentCss({
      scope: 'x',
      responsibility: 'Action',
      part: 'root',
    });
    expect(withDefault).toBe(withExplicit);
  });

  // ── Per-variant selectors (data-variant) ────────────────────────────────

  test('emits per-variant selectors for each valid role', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const actionRoles = UX_VALID_ROLES['action'];
    for (const role of actionRoles) {
      expect(css).toContain(`[data-variant='${role}']`);
    }
  });

  test('navigation context emits only primary variant (only valid role)', () => {
    const css = generateComponentCss({
      scope: 'nav-item',
      responsibility: 'Navigation',
    });
    expect(css).toContain("[data-variant='primary']");
    // navigation only has 'primary' — no secondary, muted, etc.
    expect(css).not.toContain("[data-variant='secondary']");
    expect(css).not.toContain("[data-variant='muted']");
  });

  test('input context emits all its valid roles', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
    });
    const inputRoles = UX_VALID_ROLES['input'];
    for (const role of inputRoles) {
      expect(css).toContain(`[data-variant='${role}']`);
    }
  });

  // ── Direct theme token references (var(--tt-colors-*)) ─────────────────

  test('declarations use direct var(--tt-colors-*) references, not var(--_*) scoped vars', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const varRefs = [...css.matchAll(/var\((--[a-z_-]+)\)/g)].map((m) => {
      return m[1];
    });
    expect(varRefs.length).toBeGreaterThan(0);
    for (const ref of varRefs) {
      expect(ref).toMatch(/^--tt-colors-/);
      expect(ref).not.toMatch(/^--_/);
    }
  });

  test('base rule for primary variant uses correct token reference', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('var(--tt-colors-action-primary-background-default)');
  });

  test('base rule for negative variant uses negative token references', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain(
      'var(--tt-colors-action-negative-background-default)'
    );
  });

  // ── CSS property names per dimension ────────────────────────────────────

  test('background dimension → background-color property', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('background-color:');
  });

  test('border dimension → border-color property', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('border-color:');
  });

  test('text dimension → color property', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('color:');
  });

  // ── Base + state rules for each role ───────────────────────────────────

  test('emits base (default state) rule for each variant', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    for (const role of UX_VALID_ROLES['action']) {
      expect(css).toContain(
        `var(--tt-colors-action-${role}-background-default)`
      );
    }
  });

  test('emits hover state rules for each variant with hover tokens', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const colors = buildColorSpec('action', 'primary');
    if (colors.background['hover']) {
      expect(css).toContain('var(--tt-colors-action-primary-background-hover)');
    }
  });

  // ── CSS selectors from STATE_SELECTORS ──────────────────────────────────

  test('uses :hover for hover state (universal CSS pseudo-class)', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain(']:hover');
  });

  test('uses :focus-visible for focused state (universal CSS pseudo-class)', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain(']:focus-visible');
  });

  // ── Disabled: both :disabled and [data-disabled] ─────────────────────────

  test('disabled state includes :disabled pseudo-class selector', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain(']:disabled');
  });

  test('disabled state includes [data-disabled] attribute selector', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('][data-disabled]');
  });

  test('disabled rule includes all three CSS properties when all dims have tokens', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    // action.primary has disabled state in background, border, and text dimensions
    const disabledBlockMatch = css.match(/:disabled[^{]*\{([^}]+)\}/);
    expect(disabledBlockMatch).not.toBeNull();
    const disabledBlock = disabledBlockMatch![1];
    expect(disabledBlock).toContain('background-color');
    expect(disabledBlock).toContain('border-color');
    expect(disabledBlock).toContain('color');
  });

  test('disabled rule emits both :disabled and [data-disabled] in a comma-separated selector', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    // The format is: variantBase:disabled,\nvariantBase[data-disabled] { ... }
    expect(css).toMatch(/:disabled,\n.*\[data-disabled\]/);
  });

  // ── disabled is always the last state rule (highest cascade priority) ──

  test('disabled rule appears after hover and focused rules within a variant block', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const primaryHoverPos = css.indexOf("[data-variant='primary']:hover");
    const primaryDisabledPos = css.indexOf("[data-variant='primary']:disabled");
    expect(primaryHoverPos).toBeGreaterThan(-1);
    expect(primaryDisabledPos).toBeGreaterThan(primaryHoverPos);
  });

  // ── Selector deduplication (selected/checked collision) ─────────────────

  test('deduplicates selected and checked selectors (both map to [data-state="checked"])', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    // Both selected and checked map to [data-state="checked"]
    // The generator should emit at most ONE rule block per unique selector per variant
    const primaryCheckedMatches = css.match(
      /\[data-variant='primary'\]\[data-state="checked"\]\s*\{/g
    );
    // If selected or checked tokens exist, there should be at most 1 rule
    if (primaryCheckedMatches) {
      expect(primaryCheckedMatches.length).toBe(1);
    }
  });

  // ── Action context specifics ───────────────────────────────────────────

  test('Action: hover rule with background-color for primary variant', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const hoverIdx = css.indexOf("[data-variant='primary']:hover");
    expect(hoverIdx).toBeGreaterThan(-1);
    const blockEnd = css.indexOf('}', hoverIdx);
    const blockContent = css.slice(hoverIdx, blockEnd);
    expect(blockContent).toContain('background-color');
  });

  test('Action: emits focused rule with border-color', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain("[data-variant='primary']:focus-visible");
    const focusIdx = css.indexOf("[data-variant='primary']:focus-visible");
    const blockEnd = css.indexOf('}', focusIdx);
    const blockBody = css.slice(focusIdx, blockEnd);
    expect(blockBody).toContain('border-color');
  });

  test('Action: does not include indeterminate (action context has none)', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).not.toContain('[data-state="indeterminate"]');
  });

  // ── Input / Selection context specifics ─────────────────────────────────

  test('Selection: includes [data-state="checked"] rule', () => {
    const css = generateComponentCss({
      scope: 'checkbox',
      responsibility: 'Selection',
    });
    expect(css).toContain('[data-state="checked"]');
  });

  test('Selection: includes [data-state="indeterminate"] rule', () => {
    const css = generateComponentCss({
      scope: 'checkbox',
      responsibility: 'Selection',
    });
    expect(css).toContain('[data-state="indeterminate"]');
  });

  // ── Navigation context specifics ─────────────────────────────────────────

  test('Navigation: includes [data-current] rule', () => {
    const css = generateComponentCss({
      scope: 'nav-item',
      responsibility: 'Navigation',
    });
    expect(css).toContain('[data-current]');
  });

  test('Navigation: includes :visited pseudo-class rule', () => {
    const css = generateComponentCss({
      scope: 'nav-item',
      responsibility: 'Navigation',
    });
    expect(css).toContain(':visited');
  });

  // ── Feedback context — minimal states ────────────────────────────────────

  test('Feedback: generates CSS for all valid feedback roles', () => {
    const css = generateComponentCss({
      scope: 'alert',
      responsibility: 'Feedback',
    });
    expect(typeof css).toBe('string');
    for (const role of UX_VALID_ROLES['feedback']) {
      expect(css).toContain(`[data-variant='${role}']`);
    }
  });

  test('Feedback: does not include hover, pressed, or expanded (no interactive states)', () => {
    const css = generateComponentCss({
      scope: 'alert',
      responsibility: 'Feedback',
    });
    expect(css).not.toContain(':hover');
    expect(css).not.toContain('[data-pressed]');
    expect(css).not.toContain('[data-state="open"]');
  });

  // ── Multiple Responsibilities sharing a UX context ───────────────────────

  test('Disclosure produces the same CSS block as Navigation (same UX context)', () => {
    const navCss = generateComponentCss({
      scope: 'nav',
      responsibility: 'Navigation',
    });
    const disclosureCss = generateComponentCss({
      scope: 'nav',
      responsibility: 'Disclosure',
    });
    // Same UX context → same valid roles → same CSS output (scope is equal)
    expect(navCss).toBe(disclosureCss);
  });

  // ── dimensions filter ─────────────────────────────────────────────────────

  test('dimensions filter omits unrequested dimension CSS properties', () => {
    const css = generateComponentCss({
      scope: 'label',
      responsibility: 'Structure',
      dimensions: ['text'],
    });
    expect(css).not.toContain('background-color:');
    expect(css).not.toContain('border-color:');
  });

  test('dimensions filter ["text"] only generates rules with text-dimension vars', () => {
    const css = generateComponentCss({
      scope: 'label',
      responsibility: 'Structure',
      dimensions: ['text'],
    });
    if (css.length > 0) {
      // Every var() reference should be for text dimension
      const varRefs = [...css.matchAll(/var\((--tt-colors-[a-z-]+)\)/g)].map(
        (m) => {
          return m[1];
        }
      );
      for (const ref of varRefs) {
        expect(ref).toContain('-text-');
      }
    }
  });

  test('no dimensions filter emits all three CSS property types', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('background-color:');
    expect(css).toContain('border-color:');
    expect(css).toContain('color:');
  });

  // ── withInvalidOverlay ───────────────────────────────────────────────────

  test('withInvalidOverlay: false (default) does not emit [data-invalid] rules', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
    });
    expect(css).not.toContain('[data-invalid]');
  });

  test('withInvalidOverlay: true emits per-variant [data-invalid] base rules', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
    });
    // Each valid role gets its own [data-invalid] rule
    for (const role of UX_VALID_ROLES['input']) {
      expect(css).toContain(`[data-variant='${role}'][data-invalid]`);
    }
  });

  test('withInvalidOverlay: true base invalid rule uses negative token references', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
    });
    // Invalid overlay should reference input.negative tokens
    expect(css).toContain('var(--tt-colors-input-negative-background-default)');
    expect(css).toContain('var(--tt-colors-input-negative-border-default)');
    expect(css).toContain('var(--tt-colors-input-negative-text-default)');
  });

  test('withInvalidOverlay: true emits compound [data-invalid]:focus-visible rule', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
    });
    expect(css).toContain('[data-invalid]:focus-visible');
    // The compound rule uses negative border focused token
    expect(css).toContain('var(--tt-colors-input-negative-border-focused)');
  });

  test('withInvalidOverlay: true emits [data-invalid]:disabled dual selector', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
    });
    expect(css).toContain('[data-invalid]:disabled');
    expect(css).toContain('[data-invalid][data-disabled]');
  });

  test('withInvalidOverlay: true invalid rules appear after normal disabled rule (cascade ordering)', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
    });
    // For each variant, the normal disabled rule comes before [data-invalid] base rule
    const normalDisabledPos = css.indexOf("[data-variant='primary']:disabled");
    const invalidBasePos = css.indexOf(
      "[data-variant='primary'][data-invalid]"
    );
    expect(normalDisabledPos).toBeGreaterThan(-1);
    expect(invalidBasePos).toBeGreaterThan(normalDisabledPos);
  });

  test('withInvalidOverlay: true respects dimensions filter', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
      dimensions: ['border'],
    });
    // Invalid rules should only contain border-color, not background-color or color (text)
    const invalidPart = css.slice(css.indexOf('[data-invalid]'));
    expect(invalidPart).toContain('border-color:');
    expect(invalidPart).not.toContain('background-color:');
    // "color:" as a standalone CSS property (text dimension) — exclude "border-color:"
    const hasStandaloneColor = /(?<!-)color:/m.test(invalidPart);
    expect(hasStandaloneColor).toBe(false);
  });

  test('withInvalidOverlay: true normal state rules do NOT have :not([data-invalid]) guards', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      withInvalidOverlay: true,
    });
    // The whole point: no :not() guards — cascade ordering handles it
    expect(css).not.toContain(':not(');
  });

  test('withInvalidOverlay: true with Action responsibility emits invalid rules from action.negative', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
      withInvalidOverlay: true,
    });
    expect(css).toContain('[data-invalid]');
    expect(css).toContain(
      'var(--tt-colors-action-negative-background-default)'
    );
  });

  // ── Invalid overlay deduplication ─────────────────────────────────────────

  test('withInvalidOverlay: true deduplicates compound invalid selectors (selected/checked collision)', () => {
    const css = generateComponentCss({
      scope: 'checkbox',
      responsibility: 'Selection',
      withInvalidOverlay: true,
    });
    // [data-invalid][data-state="checked"] should appear at most once per variant
    const primaryInvalidChecked = css.match(
      /\[data-variant='primary'\]\[data-invalid\]\[data-state="checked"\]\s*\{/g
    );
    if (primaryInvalidChecked) {
      expect(primaryInvalidChecked.length).toBe(1);
    }
  });

  // ── Every valid role gets rules ─────────────────────────────────────────

  test('content context emits all 6 valid roles', () => {
    const css = generateComponentCss({
      scope: 'card',
      responsibility: 'Collection',
    });
    for (const role of UX_VALID_ROLES['content']) {
      expect(css).toContain(`[data-variant='${role}']`);
    }
  });

  // ── Determinism ─────────────────────────────────────────────────────────

  test('same inputs always produce the same CSS output', () => {
    const a = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const b = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(a).toBe(b);
  });

  // ── Variant rules contain role-specific token paths ─────────────────────

  test('secondary variant rules reference secondary tokens', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const secondaryStart = css.indexOf("[data-variant='secondary']");
    expect(secondaryStart).toBeGreaterThan(-1);
    const secondarySection = css.slice(
      secondaryStart,
      css.indexOf("[data-variant='muted']")
    );
    expect(secondarySection).toContain(
      'var(--tt-colors-action-secondary-background-default)'
    );
  });

  test('muted variant rules reference muted tokens', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('var(--tt-colors-action-muted-background-default)');
  });

  // ── Edge case: empty dimensions ──────────────────────────────────────────

  test('empty dimensions array produces no base or state CSS declarations', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
      dimensions: [],
    });
    // With no active dimensions, there are no CSS property declarations to emit
    expect(css).toBe('');
  });

  test('empty dimensions array with withInvalidOverlay produces no invalid rules', () => {
    const css = generateComponentCss({
      scope: 'input',
      responsibility: 'Input',
      dimensions: [],
      withInvalidOverlay: true,
    });
    expect(css).toBe('');
  });
});
