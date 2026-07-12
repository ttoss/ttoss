/* eslint-disable no-console */
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
import { validateRefs } from '../../../src/roots/validateRefs';
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

  test('rejects compound and multi-ref strings (interior braces)', () => {
    // Only a single `{path}` is a pure ref. A multi-ref or compound expression
    // must take the compound resolution path, not be mis-parsed as one path.
    expect(isTokenRef('{a} {b}')).toBe(false);
    expect(isTokenRef('{a}{b}')).toBe(false);
    expect(isTokenRef('clamp({a}, {b})')).toBe(false);
    expect(isTokenRef('{core.spacing.2} {core.spacing.4}')).toBe(false);
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

  test('does not pollute the prototype via a __proto__ override key', () => {
    // Simulates untrusted (e.g. JSON-parsed) overrides carrying a __proto__ key.
    const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
    const out = deepMerge({ a: 1 }, malicious);
    expect(out).toEqual({ a: 1 });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  test('skips constructor / prototype override keys', () => {
    const out = deepMerge({ a: 1 }, {
      constructor: 'x',
      prototype: 'y',
      a: 2,
    } as never);
    expect(out).toEqual({ a: 2 });
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

  test('resolves a multi-ref string (interior braces) via the compound path', () => {
    // Before the isTokenRef fix this was mis-classified as one pure ref and
    // left unresolved; now it goes through compound resolution like toCssVars.
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.border.width.selected} {core.border.width.default}' as any,
            },
          },
        },
      },
    });

    const flat = toFlatTokens(theme);
    expect(flat['semantic.elevation.surface.flat']).toBe('2px 1px');
    expect(flat['semantic.elevation.surface.flat']).not.toContain('{');
  });

  test('fully resolves nested compound refs (compound → compound → raw)', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // raised is itself a compound expression with an embedded ref…
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              raised: 'calc({core.border.width.selected} + 1px)' as any,
              // …and flat references raised — the inner ref must still expand.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: 'outer({semantic.elevation.surface.raised})' as any,
            },
          },
        },
      },
    });

    const flat = toFlatTokens(theme);
    expect(flat['semantic.elevation.surface.flat']).toBe(
      'outer(calc(2px + 1px))'
    );
    expect(flat['semantic.elevation.surface.flat']).not.toContain('{');
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
    // These tests intentionally use broken refs; silence validateRefs warnings.
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      jest.mocked(console.warn).mockRestore();
    });

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

// ---------------------------------------------------------------------------
// validateRefs — DEV-only ref validation
// ---------------------------------------------------------------------------

describe('validateRefs', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('does not warn for a fully valid theme', () => {
    validateRefs(defaultTheme);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('warns and suggests the closest path for a typo with same prefix', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.colorz.brand.500}' as any,
            },
          },
        },
      },
    });

    // buildTheme already calls validateRefs in non-prod; clear and re-run
    // explicitly so we assert against this call alone.
    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(
      /Invalid token reference '\{core\.colorz\.brand\.500\}'/
    );
    expect(message).toMatch(/at path 'semantic\.elevation\.surface\.flat'/);
    expect(message).toMatch(/Did you mean '\{core\.colors\.brand\.500\}'\?/);
  });

  test('warns for a broken ref embedded in a compound expression', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          spacing: {
            gutter: {
              page: 'clamp({core.spacing.4}, {core.spacing.nope}, {core.spacing.12})',
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(
      /Invalid token reference '\{core\.spacing\.nope\}'/
    );
    expect(message).toMatch(/at path 'semantic\.spacing\.gutter\.page'/);
  });

  test('omits suggestion when the broken prefix has no candidates', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{nonexistent.namespace.foo}' as any,
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(
      /Invalid token reference '\{nonexistent\.namespace\.foo\}'/
    );
    expect(message).not.toMatch(/Did you mean/);
  });

  test('omits suggestion when the closest candidate is too distant', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.x}' as any,
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(/Invalid token reference '\{core\.x\}'/);
    expect(message).not.toMatch(/Did you mean/);
  });

  test('reports each broken ref independently', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.colorz.brand.500}' as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              raised: '{core.spacingz.4}' as any,
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(2);
    const messages = warnSpy.mock.calls.map((call) => {
      return call[0] as string;
    });
    expect(
      messages.some((m) => {
        return m.includes('core.colorz.brand.500');
      })
    ).toBe(true);
    expect(
      messages.some((m) => {
        return m.includes('core.spacingz.4');
      })
    ).toBe(true);
  });

  test('accepts refs to paths added by overrides (validates after merge)', () => {
    // Add a new color family via override and reference it in semantic.
    // The ref is only valid because validation runs against the merged theme.
    const theme = buildTheme({
      overrides: {
        core: {
          colors: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cyan: { 500: '#06b6d4' } as any,
          },
        },
        semantic: {
          colors: {
            informational: {
              accent: {
                background: { default: '{core.colors.cyan.500}' },
              },
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
