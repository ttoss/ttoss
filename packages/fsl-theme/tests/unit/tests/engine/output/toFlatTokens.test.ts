import { baseBundle } from '../../../../../src/baseBundle';
import { baseTheme as defaultTheme } from '../../../../../src/baseTheme';
import { buildTheme } from '../../../../../src/createTheme';
import { isTokenRef, toFlatTokens } from '../../../../../src/roots/helpers';

// ---------------------------------------------------------------------------
// Root 2 — Flat Token Map
// ---------------------------------------------------------------------------

describe('toFlatTokens', () => {
  test('returns a flat Record with dot-path keys', () => {
    const flat = toFlatTokens(defaultTheme);
    expect(flat['core.colors.brand.500']).toBeDefined();
    expect(
      flat['semantic.colors.action.primary.background.default']
    ).toBeDefined();
  });

  test('all values are fully resolved — no {refs} remain', () => {
    const flat = toFlatTokens(defaultTheme);
    const unresolvedRefs = Object.entries(flat).filter(([, v]) => {
      return isTokenRef(v);
    });

    expect(unresolvedRefs).toEqual([]);
  });

  test('semantic refs resolve to their core raw values', () => {
    const flat = toFlatTokens(defaultTheme);

    // Walk the raw semantic tree and find every leaf that is a pure {core.*} ref.
    // After resolution, flat[semanticPath] must equal flat[coreRefPath].
    let checkedCount = 0;

    const walk = (obj: unknown, prefix: string): void => {
      if (typeof obj === 'string' && isTokenRef(obj)) {
        const refPath = obj.slice(1, -1); // '{core.X.Y}' → 'core.X.Y'
        if (refPath.startsWith('core.')) {
          expect(flat[prefix]).toBe(flat[refPath]);
          checkedCount++;
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(
          obj as Record<string, unknown>
        )) {
          if (!key.startsWith('$')) {
            walk(value, `${prefix}.${key}`);
          }
        }
      }
    };

    walk(defaultTheme.semantic, 'semantic');
    // Sanity: the theme must have at least some core refs in semantic
    expect(checkedCount).toBeGreaterThan(0);
  });

  test('preserves numeric values', () => {
    const flat = toFlatTokens(defaultTheme);
    expect(typeof flat['core.opacity.100']).toBe('number');
    expect(typeof flat['core.zIndex.level.3']).toBe('number');
  });

  test('custom theme overrides are reflected', () => {
    const theme = buildTheme({
      overrides: { core: { colors: { brand: { 500: '#CUSTOM' } } } },
    });

    const flat = toFlatTokens(theme);
    expect(flat['core.colors.brand.500']).toBe('#CUSTOM');
  });

  test('all built-in themes produce fully resolved maps', () => {
    {
      const flat = toFlatTokens(baseBundle.base);
      const unresolvedRefs = Object.entries(flat).filter(([, v]) => {
        return isTokenRef(v);
      });

      expect(unresolvedRefs).toEqual([]);
    }
  });

  test('all built-in themes have a substantial number of tokens', () => {
    {
      const count = Object.keys(toFlatTokens(baseBundle.base)).length;
      expect(count).toBeGreaterThan(50);
    }
  });
});
