import { createTheme, defaultTheme, themes } from '../../../src';
import {
  extractRefPath,
  flattenAndResolve,
  flattenObject,
  isTokenRef,
} from '../../../src/roots/helpers';

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
// flattenAndResolve
// ---------------------------------------------------------------------------

describe('flattenAndResolve', () => {
  test('resolves semantic refs to core raw values', () => {
    const flat = flattenAndResolve(defaultTheme);

    const coreBrand500 = flat['core.colors.brand.500'];
    const semanticAction =
      flat['semantic.colors.action.primary.background.default'];

    expect(typeof coreBrand500).toBe('string');
    expect(semanticAction).toBe(coreBrand500);
  });

  test('resolves all refs — no {path} strings remain', () => {
    const flat = flattenAndResolve(defaultTheme);

    const unresolvedRefs = Object.entries(flat).filter(([, value]) => {
      return isTokenRef(value);
    });

    expect(unresolvedRefs).toEqual([]);
  });

  test('preserves raw numeric values', () => {
    const flat = flattenAndResolve(defaultTheme);
    expect(flat['core.opacity.100']).toBe(1);
    expect(flat['core.zIndex.level.3']).toBe(300);
    expect(flat['core.font.weight.bold']).toBe(700);
  });

  test('handles chained refs (A → B → raw)', () => {
    const flat = flattenAndResolve(defaultTheme);
    // semantic.elevation.surface.flat → {core.elevation.level.0} → "none"
    expect(flat['semantic.elevation.surface.flat']).toBe('none');
  });

  test('survives without infinite loop on any theme', () => {
    expect(() => {
      return flattenAndResolve(defaultTheme);
    }).not.toThrow();
  });

  test('works with custom themes', () => {
    const theme = createTheme({
      overrides: {
        core: { colors: { brand: { 500: '#FF4500' } } },
      },
    });

    const flat = flattenAndResolve(theme);
    expect(flat['core.colors.brand.500']).toBe('#FF4500');
  });

  test('all built-in themes resolve completely', () => {
    for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
      const flat = flattenAndResolve(themes[name]);
      const unresolvedRefs = Object.entries(flat).filter(([, value]) => {
        return isTokenRef(value);
      });

      expect(unresolvedRefs).toEqual([]);
    }
  });
});
