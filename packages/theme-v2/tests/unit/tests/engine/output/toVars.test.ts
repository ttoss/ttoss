import { baseBundle } from '../../../../../src/baseBundle';
import { baseTheme as defaultTheme } from '../../../../../src/baseTheme';
import { buildTheme } from '../../../../../src/createTheme';
import { toCssVarName } from '../../../../../src/roots/toCssVars';
import { buildVarsMap } from '../../../../../src/roots/toVars';
import { vars } from '../../../../../src/vars';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect every leaf value from a nested object. */
const collectLeaves = (
  obj: unknown,
  path = ''
): { path: string; value: unknown }[] => {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object') return [{ path, value: obj }];

  const result: { path: string; value: unknown }[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      result.push(...collectLeaves(value, fullPath));
    } else {
      result.push({ path: fullPath, value });
    }
  }
  return result;
};

// ---------------------------------------------------------------------------
// vars — static instance
// ---------------------------------------------------------------------------

describe('vars', () => {
  test('is a non-null object', () => {
    expect(vars).toBeDefined();
    expect(typeof vars).toBe('object');
    expect(vars).not.toBeNull();
  });

  test('every leaf value is a var() CSS custom property reference', () => {
    const leaves = collectLeaves(vars);
    expect(leaves.length).toBeGreaterThan(0);
    for (const { value } of leaves) {
      expect(typeof value).toBe('string');
      expect(value as string).toMatch(/^var\(--tt-/);
    }
  });

  test('known semantic token resolves to correct var() reference', () => {
    // action.primary is optional in the type (themes may omit it) but always
    // present in the base theme — use ! to assert it exists here.
    expect(vars.colors.action.primary!.background!.default).toBe(
      'var(--tt-action-primary-background-default)'
    );
  });

  test('no leaf contains an unresolved token reference pattern ({...})', () => {
    const leaves = collectLeaves(vars);
    for (const { value } of leaves) {
      expect(value as string).not.toMatch(/\{[^}]+\}/);
    }
  });

  test('no key starts with $ (metadata excluded)', () => {
    const leaves = collectLeaves(vars);
    for (const { path } of leaves) {
      const lastSegment = path.split('.').pop()!;
      expect(lastSegment).not.toMatch(/^\$/);
    }
  });

  test('contains all top-level semantic categories from defaultTheme', () => {
    const semanticKeys = Object.keys(defaultTheme.semantic).filter((k) => {
      return !k.startsWith('$');
    });
    for (const key of semanticKeys) {
      // dataviz is optional — only assert keys that are actually present in the theme
      if (key === 'dataviz' && !defaultTheme.semantic.dataviz) continue;
      expect(vars).toHaveProperty(key);
    }
  });
});

// ---------------------------------------------------------------------------
// buildVarsMap
// ---------------------------------------------------------------------------

describe('buildVarsMap', () => {
  test('custom theme produces identical var names (names are path-derived, not value-derived)', () => {
    // Var names come from the token PATH, not the token VALUE.
    // A custom brand color must still resolve to var(--tt-action-primary-background-default).
    const customTheme = buildTheme({
      overrides: { core: { colors: { brand: { 500: '#FF2D20' } } } },
    });
    const customVars = buildVarsMap(customTheme);

    expect(customVars.colors.action.primary!.background!.default).toBe(
      vars.colors.action.primary!.background!.default
    );
  });

  test('leaf value matches toCssVarName for the corresponding semantic path', () => {
    const built = buildVarsMap(defaultTheme);
    const expected = `var(${toCssVarName('semantic.sizing.icon.md')})`;
    expect(built.sizing.icon.md).toBe(expected);
  });

  test('all built-in themes produce the same var names', () => {
    const baseLeaves = collectLeaves(buildVarsMap(defaultTheme));
    const baseMap = new Map(
      baseLeaves.map((l) => {
        return [l.path, l.value];
      })
    );

    {
      const themeVars = buildVarsMap(baseBundle.base);
      const themeLeaves = collectLeaves(themeVars);
      // Same number of semantic leaves
      expect(themeLeaves.length).toBe(baseLeaves.length);
      // Same var names
      for (const { path, value } of themeLeaves) {
        expect(value).toBe(baseMap.get(path));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Defensive branches
// ---------------------------------------------------------------------------

describe('buildVarsMap — defensive branches', () => {
  test('skips keys starting with $ (e.g. $deprecated metadata)', () => {
    // The semantic layer could theoretically contain metadata keys in the future.
    // The walk() guard must skip them without throwing.
    const syntheticTheme = {
      ...defaultTheme,
      semantic: {
        ...defaultTheme.semantic,
        $deprecated: { someToken: { since: '1.0.0' } },
      },
    } as unknown as typeof defaultTheme;

    const result = buildVarsMap(syntheticTheme) as Record<string, unknown>;
    // $deprecated must not appear in the output
    expect(result).not.toHaveProperty('$deprecated');
    // Normal keys still present
    expect(result).toHaveProperty('colors');
  });

  test('skips non-string, non-number, non-object leaf values (defensive null/array guard)', () => {
    // The token schema only allows string/number/object leaves,
    // but the guard protects against malformed extensions.
    const syntheticTheme = {
      ...defaultTheme,
      semantic: {
        ...defaultTheme.semantic,
        _test: {
          nullValue: null,
          arrayValue: [1, 2, 3],
          boolValue: false,
          validString: '{core.space.4}',
          validNumber: 12,
        },
      },
    } as unknown as typeof defaultTheme;

    const result = buildVarsMap(syntheticTheme) as Record<
      string,
      Record<string, unknown>
    >;

    // null / array / boolean → silently skipped
    expect(result._test.nullValue).toBeUndefined();
    expect(result._test.arrayValue).toBeUndefined();
    expect(result._test.boolValue).toBeUndefined();
    // string / number → converted to var() references
    expect(result._test.validString).toMatch(/^var\(--tt-/);
    expect(result._test.validNumber).toMatch(/^var\(--tt-/);
  });
});
