import { createTheme } from '@ttoss/fsl-theme';
import { toFlatTokens } from '@ttoss/fsl-theme/css';
import {
  computeContrast,
  computeThemeContrast,
  contrastRatio,
  parseHex,
  rateContrast,
} from 'src/studio/theme/palette';

describe('parseHex', () => {
  test('parses 6-digit hex', () => {
    expect(parseHex('#ffffff')).toEqual([255, 255, 255]);
    expect(parseHex('#000000')).toEqual([0, 0, 0]);
    expect(parseHex('0469e3')).toEqual([4, 105, 227]);
  });

  test('parses 3-digit shorthand', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('#f00')).toEqual([255, 0, 0]);
  });

  test('rejects non-hex values', () => {
    expect(parseHex('rgb(0,0,0)')).toBeNull();
    expect(parseHex('#12')).toBeNull();
    expect(parseHex('#zzzzzz')).toBeNull();
    expect(parseHex('#xyz')).toBeNull();
  });
});

describe('contrastRatio', () => {
  test('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  test('identical colors are 1:1', () => {
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  test('returns null when a value is not hex', () => {
    expect(contrastRatio('nope', '#ffffff')).toBeNull();
    expect(contrastRatio('#ffffff', 'nope')).toBeNull();
  });
});

describe('rateContrast', () => {
  test('classifies by WCAG thresholds', () => {
    expect(rateContrast(21)).toBe('AAA');
    expect(rateContrast(7)).toBe('AAA');
    expect(rateContrast(4.5)).toBe('AA');
    expect(rateContrast(3)).toBe('fail');
  });
});

describe('computeContrast', () => {
  test('includes only pairs whose keys resolve to hex', () => {
    const resolved = {
      'semantic.colors.action.accent.text.default': '#ffffff',
      'semantic.colors.action.accent.background.default': '#0469e3',
      // primary bg present but text missing → pair skipped
      'semantic.colors.action.primary.background.default': '#000000',
      // surface pair present
      'semantic.colors.informational.primary.text.default': '#0f172a',
      'semantic.colors.informational.primary.background.default': '#ffffff',
    };

    const results = computeContrast(resolved);
    const labels = results.map((r) => {
      return r.label;
    });

    expect(labels).toContain('Accent action');
    expect(labels).toContain('Surface');
    expect(labels).not.toContain('Primary action');
    expect(labels).not.toContain('Negative action');

    const accent = results.find((r) => {
      return r.label === 'Accent action';
    });
    expect(accent?.ratio).toBeGreaterThan(1);
    expect(['AAA', 'AA', 'fail']).toContain(accent?.rating);
  });

  test('skips a pair whose value is not a hex string', () => {
    const resolved = {
      'semantic.colors.action.accent.text.default': '#ffffff',
      'semantic.colors.action.accent.background.default': 42,
    };
    expect(computeContrast(resolved)).toHaveLength(0);
  });

  test('skips a pair whose string value is not parseable hex', () => {
    // Both are strings (passing the typeof gate) but not hex, so the ratio is
    // null and the pair is dropped rather than reported.
    const resolved = {
      'semantic.colors.action.accent.text.default': 'white',
      'semantic.colors.action.accent.background.default': 'blue',
    };
    expect(computeContrast(resolved)).toHaveLength(0);
  });
});

describe('computeThemeContrast', () => {
  test('computes both modes when the bundle has an alternate', () => {
    const bundle = createTheme();
    const lightFlat = toFlatTokens(bundle.base);
    const { light, dark } = computeThemeContrast(bundle, lightFlat);
    expect(light.length).toBeGreaterThan(0);
    expect(dark.length).toBeGreaterThan(0);
    // Dark surfaces resolve to different values than light ones.
    const surfaceLight = light.find((result) => {
      return result.label === 'Surface';
    });
    const surfaceDark = dark.find((result) => {
      return result.label === 'Surface';
    });
    expect(surfaceLight?.background).not.toBe(surfaceDark?.background);
  });

  test('a single-mode bundle yields no dark results', () => {
    const bundle = createTheme({ alternate: null });
    const lightFlat = toFlatTokens(bundle.base);
    expect(computeThemeContrast(bundle, lightFlat).dark).toEqual([]);
  });
});
