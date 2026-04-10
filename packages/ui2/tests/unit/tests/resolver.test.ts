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
 */

import {
  type ColorRole,
  type FslState,
  generateComponentCss,
  resolveInvalidOverlay,
  resolveTokens,
  RESPONSIBILITY_UX_MAP,
  STATE_SELECTORS,
  type TokenSpec,
  toScopeVars,
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

  test('returns empty ColorSpec on invalid role', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const spec = resolveTokens({
      responsibility: 'Action',
      evaluation: 'positive',
    });

    expect(spec.ux).toBe('action');
    expect(spec.role).toBe('positive');
    expect(Object.keys(spec.colors.background)).toHaveLength(0);
    expect(Object.keys(spec.colors.border)).toHaveLength(0);
    expect(Object.keys(spec.colors.text)).toHaveLength(0);

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

  test('expanded uses [data-state="open"]', () => {
    expect(STATE_SELECTORS['expanded']).toBe('[data-state="open"]');
  });
});

// ---------------------------------------------------------------------------
// 13. toScopeVars — scoped CSS custom property formula
// ---------------------------------------------------------------------------

describe('toScopeVars', () => {
  const { colors } = resolveTokens({ responsibility: 'Action' });

  test('background.default → --_bg (no suffix for default state)', () => {
    const out = toScopeVars(colors);
    expect(out['--_bg']).toBe(colors.background['default']);
  });

  test('background.hover → --_bg-hover', () => {
    const out = toScopeVars(colors);
    expect(out['--_bg-hover']).toBe(colors.background['hover']);
  });

  test('background.disabled → --_bg-disabled', () => {
    const out = toScopeVars(colors);
    expect(out['--_bg-disabled']).toBe(colors.background['disabled']);
  });

  test('border.default → --_border (no suffix)', () => {
    const out = toScopeVars(colors);
    expect(out['--_border']).toBe(colors.border['default']);
  });

  test('border.focused → --_border-focused', () => {
    const out = toScopeVars(colors);
    expect(out['--_border-focused']).toBe(colors.border['focused']);
  });

  test('text.default → --_text (no suffix)', () => {
    const out = toScopeVars(colors);
    expect(out['--_text']).toBe(colors.text['default']);
  });

  test('text.disabled → --_text-disabled', () => {
    const out = toScopeVars(colors);
    expect(out['--_text-disabled']).toBe(colors.text['disabled']);
  });

  test('emits all (dim × state) pairs — count matches sum of states per dim', () => {
    const out = toScopeVars(colors);
    const expectedCount =
      Object.keys(colors.background).length +
      Object.keys(colors.border).length +
      Object.keys(colors.text).length;
    expect(Object.keys(out)).toHaveLength(expectedCount);
  });

  test('values are CSS var() references (start with "var(")', () => {
    const out = toScopeVars(colors);
    for (const val of Object.values(out)) {
      expect(val).toMatch(/^var\(--tt-/);
    }
  });

  test('no --_* key contains "background", "border", or "text" (abbrev applied)', () => {
    const out = toScopeVars(colors);
    for (const key of Object.keys(out)) {
      expect(key).not.toContain('background');
      expect(key).not.toContain('border-color');
      expect(key).not.toContain('text-color');
    }
  });

  test('works for Feedback responsibility (base states only)', () => {
    const { colors: fbColors } = resolveTokens({ responsibility: 'Feedback' });
    const out = toScopeVars(fbColors);
    expect(out['--_bg']).toBeDefined();
    // Feedback has no pressed/expanded/checked — these keys must be absent
    expect(out['--_bg-pressed']).toBeUndefined();
    expect(out['--_bg-checked']).toBeUndefined();
  });

  test('works for Selection responsibility (includes checked, indeterminate)', () => {
    const { colors: selColors } = resolveTokens({
      responsibility: 'Selection',
    });
    const out = toScopeVars(selColors);
    expect(out['--_bg-checked']).toBeDefined();
    expect(out['--_bg-indeterminate']).toBeDefined();
  });

  test('spreading into style produces --_bg key readable via getPropertyValue', () => {
    // Verify the key format is correct for CSS custom property injection.
    // Custom property names must start with '--'.
    const out = toScopeVars(colors);
    expect(
      Object.keys(out).every((k) => {
        return k.startsWith('--');
      })
    ).toBe(true);
  });

  test('dimension filter ["text"] emits only --_text* keys', () => {
    const out = toScopeVars(colors, { dimensions: ['text'] });
    const keys = Object.keys(out);
    expect(keys.length).toBeGreaterThan(0);
    expect(
      keys.every((k) => {
        return k.startsWith('--_text');
      })
    ).toBe(true);
    expect(
      keys.some((k) => {
        return k.startsWith('--_bg');
      })
    ).toBe(false);
    expect(
      keys.some((k) => {
        return k.startsWith('--_border');
      })
    ).toBe(false);
  });

  test('dimension filter ["background", "text"] omits --_border* keys', () => {
    const out = toScopeVars(colors, { dimensions: ['background', 'text'] });
    expect(out['--_bg']).toBeDefined();
    expect(out['--_text']).toBeDefined();
    expect(
      Object.keys(out).every((k) => {
        return !k.startsWith('--_border');
      })
    ).toBe(true);
  });

  test('no options (backward compat) emits all 3 dimensions', () => {
    const out = toScopeVars(colors);
    expect(out['--_bg']).toBeDefined();
    expect(out['--_border']).toBeDefined();
    expect(out['--_text']).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 14. generateComponentCss — CSS state-selector block generation (B-01)
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

  // ── Uses scoped --_* vars, never semantic --tt-* vars ───────────────────

  test('declarations use --_* scoped vars, not --tt-* semantic vars', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    // Every var() reference in declarations must use the --_* prefix
    const varRefs = [...css.matchAll(/var\((--[a-z_-]+)\)/g)].map((m) => {
      return m[1];
    });
    expect(varRefs.length).toBeGreaterThan(0);
    for (const ref of varRefs) {
      expect(ref).toMatch(/^--_/);
      expect(ref).not.toMatch(/^--tt-/);
    }
  });

  // ── Default state is NOT in the output (handled by base rule) ───────────

  test('does not emit a rule for the default state', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    // The default state has no CSS selector suffix — its absence means the
    // base rule in the component's hand-authored CSS handles it.
    expect(css).not.toContain('--_bg)'); // that would be the default var
    expect(css).not.toContain('--_border)');
    expect(css).not.toContain('--_text)');
  });

  // ── CSS property names per dimension ────────────────────────────────────

  test('background dimension → background-color property', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('background-color: var(--_bg-');
  });

  test('border dimension → border-color property', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('border-color: var(--_border-');
  });

  test('text dimension → color property', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('color: var(--_text-');
  });

  // ── Ark UI selectors from STATE_SELECTORS ────────────────────────────────

  test('uses [data-hover] for hover state (Ark UI state machine)', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('][data-hover]');
  });

  test('uses [data-focus-visible] for focused state', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).toContain('][data-focus-visible]');
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

  // ── disabled is always the last rule (highest cascade priority) ──────────

  test('disabled rule appears after hover and focused rules', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const hoverPos = css.indexOf('[data-hover]');
    const disabledPos = css.indexOf(':disabled');
    expect(hoverPos).toBeGreaterThan(-1);
    expect(disabledPos).toBeGreaterThan(hoverPos);
  });

  // ── Action context (Button) specifics ───────────────────────────────────

  test('Action: emits hover rule with background-color and border-color', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const lines = css.split('\n');
    const hoverBlockStart = lines.findIndex((l) => {
      return l.includes('[data-hover]');
    });
    expect(hoverBlockStart).toBeGreaterThan(-1);
    // The block body follows
    const blockContent = lines
      .slice(hoverBlockStart + 1, hoverBlockStart + 5)
      .join('\n');
    expect(blockContent).toContain('background-color');
    expect(blockContent).toContain('border-color');
  });

  test('Action: emits focused rule (border-color only — bg stays same on focus)', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    const lines = css.split('\n');
    const focusedIdx = lines.findIndex((l) => {
      return l.includes('[data-focus-visible]');
    });
    expect(focusedIdx).toBeGreaterThan(-1);
    const blockBody = lines.slice(focusedIdx + 1, focusedIdx + 4).join('\n');
    expect(blockBody).toContain('border-color');
    expect(blockBody).not.toContain('background-color');
  });

  test('Action: does not include checked or indeterminate (action context has none)', () => {
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    expect(css).not.toContain('[data-state="indeterminate"]');
    // checked and selected both map to [data-state="checked"] in STATE_SELECTORS
    // action context has selected — check via token presence, not just selector text
    // but action context must not have checked-specific tokens
    const actionColors = resolveTokens({
      responsibility: 'Action',
      evaluation: 'primary',
    });
    expect(actionColors.colors.background['checked']).toBeUndefined();
  });

  // ── Input / Selection context specifics ─────────────────────────────────

  test('Selection: includes [data-state="checked"] rule for checked state', () => {
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

  test('Feedback: generates CSS string (minimal — feedback is not interactive)', () => {
    const css = generateComponentCss({
      scope: 'alert',
      responsibility: 'Feedback',
    });
    expect(typeof css).toBe('string');
    // Feedback has focused and disabled — at minimum those selectors appear
    expect(css).toContain('[data-focus-visible]');
    expect(css).toContain(':disabled');
  });

  test('Feedback: does not include hover, pressed, or expanded (no interactive states)', () => {
    const css = generateComponentCss({
      scope: 'alert',
      responsibility: 'Feedback',
    });
    expect(css).not.toContain('[data-hover]');
    expect(css).not.toContain('[data-pressed]');
    expect(css).not.toContain('[data-state="open"]');
  });

  // ── Union across evaluations (evaluation-agnostic CSS) ───────────────────

  test('Action CSS is the same regardless of which evaluation is implied — uses --_* vars', () => {
    // generateComponentCss does not take an evaluation arg — it is evaluation-agnostic.
    // All Action evaluations (primary, secondary, muted, negative) share the same CSS rules.
    const css = generateComponentCss({
      scope: 'button',
      responsibility: 'Action',
    });
    // Union of states should include hover from primary+secondary+muted+negative
    expect(css).toContain('[data-hover]');
    // selected state appears in action.primary.background.selected
    expect(css).toContain('[data-state="checked"]');
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
    // Same UX context → same state set → same CSS (only scope differs, but scope is equal here)
    expect(navCss).toBe(disclosureCss);
  });
});

// ---------------------------------------------------------------------------
// 15. resolveInvalidOverlay — invalid-state scoped var generation (B-03)
// ---------------------------------------------------------------------------

describe('resolveInvalidOverlay', () => {
  // ── Structural invariants ────────────────────────────────────────────────

  test('returns a plain object', () => {
    expect(typeof resolveInvalidOverlay({ responsibility: 'Input' })).toBe(
      'object'
    );
  });

  test('all keys start with "--_" and contain "-invalid"', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    const keys = Object.keys(out);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key).toMatch(/^--_/);
      expect(key).toContain('-invalid');
    }
  });

  test('all values are var(--tt-colors-*) CSS var references', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    for (const val of Object.values(out)) {
      expect(val).toMatch(/^var\(--tt-colors-/);
    }
  });

  // ── Naming formula (the canonical contract) ───────────────────────────────
  //
  // Formula: --_{dim_prefix}-invalid        for state='default'
  //          --_{dim_prefix}-invalid-{state} for non-default states

  test('background default → --_bg-invalid (no extra state suffix)', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_bg-invalid']).toBeDefined();
    // Must NOT contain a state segment after "-invalid"
    expect(out['--_bg-invalid']).toMatch(
      /^var\(--tt-colors-input-negative-background-default\)$/
    );
  });

  test('border default → --_border-invalid', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_border-invalid']).toBeDefined();
    expect(out['--_border-invalid']).toMatch(
      /^var\(--tt-colors-input-negative-border-default\)$/
    );
  });

  test('text default → --_text-invalid', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_text-invalid']).toBeDefined();
    expect(out['--_text-invalid']).toMatch(
      /^var\(--tt-colors-input-negative-text-default\)$/
    );
  });

  test('border focused → --_border-invalid-focused (state suffix after -invalid)', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_border-invalid-focused']).toBeDefined();
    expect(out['--_border-invalid-focused']).toMatch(
      /^var\(--tt-colors-input-negative-border-focused\)$/
    );
  });

  test('no key is just --_bg-invalid-default (default state uses no suffix)', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_bg-invalid-default']).toBeUndefined();
    expect(out['--_border-invalid-default']).toBeUndefined();
    expect(out['--_text-invalid-default']).toBeUndefined();
  });

  test('"background" is abbreviated to "bg" — no key contains the full word "background"', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    for (const key of Object.keys(out)) {
      expect(key).not.toContain('background');
    }
    // Explicit check: --_background-invalid must not exist; --_bg-invalid must exist
    expect(out['--_background-invalid']).toBeUndefined();
    expect(out['--_bg-invalid']).toBeDefined();
  });

  // ── Formula equivalence with resolveTokens + toScopeVars for negative role ──

  test('--_bg-invalid equals the background.default var from input.negative resolved tokens', () => {
    const { colors: negColors } = resolveTokens({
      responsibility: 'Input',
      evaluation: 'negative',
    });
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_bg-invalid']).toBe(negColors.background['default']);
  });

  test('--_border-invalid-focused equals the border.focused var from input.negative resolved tokens', () => {
    const { colors: negColors } = resolveTokens({
      responsibility: 'Input',
      evaluation: 'negative',
    });
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_border-invalid-focused']).toBe(negColors.border['focused']);
  });

  test('--_text-invalid equals the text.default var from input.negative resolved tokens', () => {
    const { colors: negColors } = resolveTokens({
      responsibility: 'Input',
      evaluation: 'negative',
    });
    const out = resolveInvalidOverlay({ responsibility: 'Input' });
    expect(out['--_text-invalid']).toBe(negColors.text['default']);
  });

  // ── Works for other Responsibilities with negative roles ─────────────────

  test('Action responsibility produces non-empty output (action.negative is defined)', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Action' });
    expect(Object.keys(out).length).toBeGreaterThan(0);
    expect(out['--_bg-invalid']).toMatch(
      /^var\(--tt-colors-action-negative-background-default\)$/
    );
  });

  test('Feedback responsibility produces non-empty output (feedback.negative is defined)', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Feedback' });
    expect(Object.keys(out).length).toBeGreaterThan(0);
    expect(out['--_bg-invalid']).toMatch(
      /^var\(--tt-colors-feedback-negative-background-default\)$/
    );
  });

  test('Selection maps to input UX context — same output as Input responsibility', () => {
    const inputOut = resolveInvalidOverlay({ responsibility: 'Input' });
    const selectionOut = resolveInvalidOverlay({ responsibility: 'Selection' });
    expect(selectionOut).toEqual(inputOut);
  });

  // ── Safe empty output for contexts without negative role ──────────────────

  test('Navigation responsibility returns an empty record (navigation has no negative role in baseTheme)', () => {
    const out = resolveInvalidOverlay({ responsibility: 'Navigation' });
    // navigation.negative is not defined in baseTheme → no vars to inject
    expect(Object.keys(out)).toHaveLength(0);
  });

  // ── No cross-contamination with normal toScopeVars keys ──────────────────

  test('keys do not collide with normal toScopeVars keys (no --_bg or --_border without -invalid)', () => {
    const { colors } = resolveTokens({ responsibility: 'Input' });
    const normalOut = toScopeVars(colors);
    const invalidOut = resolveInvalidOverlay({ responsibility: 'Input' });

    // No key from invalidOut exists in normalOut
    for (const key of Object.keys(invalidOut)) {
      expect(normalOut[key]).toBeUndefined();
    }

    // No key from normalOut exists in invalidOut
    for (const key of Object.keys(normalOut)) {
      expect(invalidOut[key]).toBeUndefined();
    }
  });

  test('merging toScopeVars and resolveInvalidOverlay produces a superset with both key families', () => {
    const { colors } = resolveTokens({ responsibility: 'Input' });
    const merged = {
      ...toScopeVars(colors),
      ...resolveInvalidOverlay({ responsibility: 'Input' }),
    };
    // Normal var present
    expect(merged['--_bg']).toBeDefined();
    expect(merged['--_border']).toBeDefined();
    // Invalid var present
    expect(merged['--_bg-invalid']).toBeDefined();
    expect(merged['--_border-invalid']).toBeDefined();
    expect(merged['--_border-invalid-focused']).toBeDefined();
  });
});
