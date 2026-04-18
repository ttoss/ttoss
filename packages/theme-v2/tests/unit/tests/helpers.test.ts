import { baseBundle } from '../../../src/baseBundle';
import { baseTheme as defaultTheme } from '../../../src/baseTheme';
import { buildTheme } from '../../../src/createTheme';
import {
  deepMerge,
  extractRefPath,
  flattenObject,
  isPlainObject,
  isTokenRef,
  toFlatTokens,
} from '../../../src/roots/helpers';
import type { ThemeTokens } from '../../../src/Types';

// ---------------------------------------------------------------------------
// Token reference detection
// ---------------------------------------------------------------------------

describe('isTokenRef', () => {
  test('recognizes valid token refs', () => {
    expect(isTokenRef('{core.colors.brand.500}')).toBe(true);
    expect(isTokenRef('{semantic.spacing.gap.stack.xs}')).toBe(true);
  });

  test('rejects non-refs', () => {
    expect(isTokenRef('#FF0000')).toBe(false);
    expect(isTokenRef('8px')).toBe(false);
    expect(isTokenRef(42)).toBe(false);
    expect(isTokenRef(null)).toBe(false);
    expect(isTokenRef(undefined)).toBe(false);
    expect(isTokenRef('')).toBe(false);
    expect(isTokenRef('{}')).toBe(false);
  });
});

describe('extractRefPath', () => {
  test('strips braces from ref', () => {
    expect(extractRefPath('{core.colors.brand.500}')).toBe(
      'core.colors.brand.500'
    );
  });
});

// ---------------------------------------------------------------------------
// isPlainObject
// ---------------------------------------------------------------------------

describe('isPlainObject', () => {
  test('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  test('returns false for non-plain-object values', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// flattenObject
// ---------------------------------------------------------------------------

describe('flattenObject', () => {
  test('flattens nested object with dot separator', () => {
    const input = { a: { b: { c: 'value' } }, d: 42 };
    expect(flattenObject(input)).toEqual({ 'a.b.c': 'value', d: 42 });
  });

  test('handles single-level object', () => {
    expect(flattenObject({ x: 'y' })).toEqual({ x: 'y' });
  });

  test('uses prefix', () => {
    expect(flattenObject({ x: 'y' }, 'p')).toEqual({ 'p.x': 'y' });
  });

  test('skips non-string/number values', () => {
    const input = { a: 'ok', b: null, c: undefined, d: [1, 2] };
    expect(flattenObject(input as Record<string, unknown>)).toEqual({
      a: 'ok',
    });
  });
});

// ---------------------------------------------------------------------------
// deepMerge
// ---------------------------------------------------------------------------

describe('deepMerge', () => {
  test('returns base unchanged when overrides is empty', () => {
    const base = { a: 1, b: { c: 2 } };
    expect(deepMerge(base, {})).toEqual(base);
  });

  test('recursively merges nested objects', () => {
    const base = { a: { b: 1, c: 2 } };
    expect(deepMerge(base, { a: { b: 99 } })).toEqual({ a: { b: 99, c: 2 } });
  });

  test('replaces primitive values', () => {
    expect(deepMerge({ a: 1 }, { a: 99 })).toEqual({ a: 99 });
  });

  test('replaces arrays without merging', () => {
    const base = { tags: ['a', 'b'] };
    expect(deepMerge(base, { tags: ['c'] })).toEqual({ tags: ['c'] });
  });

  test('skips undefined override values', () => {
    const base = { a: 1, b: 2 };
    expect(deepMerge(base, { a: undefined })).toEqual(base);
  });
});

// ---------------------------------------------------------------------------
// flattenAndResolve
// ---------------------------------------------------------------------------

describe('flattenAndResolve', () => {
  test('resolves semantic refs to core raw values', () => {
    const flat = toFlatTokens(defaultTheme);

    const coreNeutral1000 = flat['core.colors.neutral.1000'];
    const semanticAction =
      flat['semantic.colors.action.primary.background.default'];

    expect(typeof coreNeutral1000).toBe('string');
    expect(semanticAction).toBe(coreNeutral1000);
  });

  test('resolves all refs — no {path} strings remain', () => {
    const flat = toFlatTokens(defaultTheme);

    const unresolvedRefs = Object.entries(flat).filter(([, value]) => {
      return isTokenRef(value);
    });

    expect(unresolvedRefs).toEqual([]);
  });

  test('preserves raw numeric values', () => {
    const flat = toFlatTokens(defaultTheme);
    expect(flat['core.opacity.100']).toBe(1);
    expect(flat['core.zIndex.level.3']).toBe(300);
    expect(flat['core.font.weight.bold']).toBe(700);
  });

  test('handles chained refs (A → B → raw)', () => {
    const flat = toFlatTokens(defaultTheme);
    // semantic.elevation.surface.flat → {core.elevation.level.0} → "none"
    expect(flat['semantic.elevation.surface.flat']).toBe('none');
  });

  test('works with custom themes', () => {
    const theme = buildTheme({
      overrides: {
        core: { colors: { brand: { 500: '#FF4500' } } },
      },
    });

    const flat = toFlatTokens(theme);
    expect(flat['core.colors.brand.500']).toBe('#FF4500');
  });

  test('resolves compound expressions with embedded refs', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // compound expression: not a pure {ref}, but contains embedded refs
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: 'inset 0 0 {core.border.width.selected} {core.colors.brand.500}' as any,
            },
          },
        },
      },
    });

    const flat = toFlatTokens(theme);
    // core.border.width.selected = '2px', core.colors.brand.500 = '#0469e3'
    expect(flat['semantic.elevation.surface.flat']).toBe(
      'inset 0 0 2px #0469e3'
    );
  });

  test('breaks circular references — returns ref as-is without throwing', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{semantic.elevation.surface.raised}' as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              raised: '{semantic.elevation.surface.flat}' as any,
            },
          },
        },
      },
    });

    expect(() => {
      return toFlatTokens(theme);
    }).not.toThrow();
    const flat = toFlatTokens(theme);
    // cycle guard breaks the loop — the ref is returned as-is (still a token ref)
    expect(isTokenRef(flat['semantic.elevation.surface.flat'])).toBe(true);
  });

  test('preserves unresolvable refs as-is', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.nonexistent.token}' as any,
            },
          },
        },
      },
    });

    const flat = toFlatTokens(theme);
    expect(flat['semantic.elevation.surface.flat']).toBe(
      '{core.nonexistent.token}'
    );
  });

  test('all built-in themes resolve completely', () => {
    const themes: ThemeTokens[] = [baseBundle.base];
    if (baseBundle.alternate) {
      themes.push(
        buildTheme({ overrides: { semantic: baseBundle.alternate.semantic } })
      );
    }

    for (const theme of themes) {
      const flat = toFlatTokens(theme);
      const unresolvedRefs = Object.entries(flat).filter(([, value]) => {
        return isTokenRef(value);
      });
      expect(unresolvedRefs).toEqual([]);
    }
  });

  // -------------------------------------------------------------------------
  // strict mode — palette/reference drift guard
  // -------------------------------------------------------------------------

  describe('strict mode', () => {
    test('throws on a missing pure ref target', () => {
      const theme = buildTheme({
        overrides: {
          semantic: {
            elevation: {
              surface: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                flat: '{core.nonexistent.token}' as any,
              },
            },
          },
        },
      });

      expect(() => {
        return toFlatTokens(theme, { strict: true });
      }).toThrow(
        /semantic\.elevation\.surface\.flat → \{core\.nonexistent\.token\}.*missing target/
      );
    });

    test('throws on a missing embedded ref inside a compound expression', () => {
      const theme = buildTheme({
        overrides: {
          semantic: {
            elevation: {
              surface: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                flat: 'inset 0 0 {core.nonexistent.token} #000' as any,
              },
            },
          },
        },
      });

      expect(() => {
        return toFlatTokens(theme, { strict: true });
      }).toThrow(/missing target/);
    });

    test('throws on a circular reference', () => {
      const theme = buildTheme({
        overrides: {
          semantic: {
            elevation: {
              surface: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                flat: '{semantic.elevation.surface.raised}' as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                raised: '{semantic.elevation.surface.flat}' as any,
              },
            },
          },
        },
      });

      expect(() => {
        return toFlatTokens(theme, { strict: true });
      }).toThrow(/circular reference/);
    });

    test('reports every unresolved ref in a single error', () => {
      const theme = buildTheme({
        overrides: {
          semantic: {
            elevation: {
              surface: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                flat: '{core.missing.a}' as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                raised: '{core.missing.b}' as any,
              },
            },
          },
        },
      });

      try {
        toFlatTokens(theme, { strict: true });
        throw new Error('expected toFlatTokens to throw');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).toMatch(/core\.missing\.a/);
        expect(message).toMatch(/core\.missing\.b/);
      }
    });

    test('all built-in themes pass strict resolution (regression guard)', () => {
      const themes: ThemeTokens[] = [baseBundle.base];
      if (baseBundle.alternate) {
        themes.push(
          buildTheme({
            overrides: { semantic: baseBundle.alternate.semantic },
          })
        );
      }

      for (const theme of themes) {
        expect(() => {
          return toFlatTokens(theme, { strict: true });
        }).not.toThrow();
      }
    });
  });
});
