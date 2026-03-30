import {
  createTheme,
  defaultTheme,
  themes,
  toFlatTokens,
} from '../../../../src';
import { isTokenRef } from '../../../../src/roots/helpers';

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
    // semantic action.primary.background.default → core.colors.brand.500
    expect(flat['semantic.colors.action.primary.background.default']).toBe(
      flat['core.colors.brand.500']
    );
  });

  test('preserves numeric values', () => {
    const flat = toFlatTokens(defaultTheme);
    expect(typeof flat['core.opacity.100']).toBe('number');
    expect(typeof flat['core.zIndex.level.3']).toBe('number');
  });

  test('custom theme overrides are reflected', () => {
    const theme = createTheme({
      overrides: { core: { colors: { brand: { 500: '#CUSTOM' } } } },
    });

    const flat = toFlatTokens(theme);
    expect(flat['core.colors.brand.500']).toBe('#CUSTOM');
  });

  test('all built-in themes produce fully resolved maps', () => {
    for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
      const flat = toFlatTokens(themes[name]);
      const unresolvedRefs = Object.entries(flat).filter(([, v]) => {
        return isTokenRef(v);
      });

      expect(unresolvedRefs).toEqual([]);
    }
  });

  test('all built-in themes have a substantial number of tokens', () => {
    for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
      const count = Object.keys(toFlatTokens(themes[name])).length;
      expect(count).toBeGreaterThan(50);
    }
  });
});
