/**
 * Elevation family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/elevation.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest, alt: themeAltFlatToTest }];

// ---------------------------------------------------------------------------
// Helpers — shadow depth comparison for elevation assertions
// ---------------------------------------------------------------------------

/**
 * Parse a CSS box-shadow value into a rough "depth" metric.
 * Sum of (blur-radius + max offset) across all shadow layers.
 * Handles blur-based and hard-edge offset-based shadow styles.
 * Returns 0 for 'none', '0', or empty values.
 */
const parseShadowDepth = (shadow: string | number): number => {
  const str = String(shadow).trim();
  if (str === 'none' || str === '0' || str === '') return 0;

  let totalDepth = 0;
  for (const single of str.split(',')) {
    const numbers = single.match(/-?\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 2) {
      const offsetX = Math.abs(parseFloat(numbers[0]));
      const offsetY = Math.abs(parseFloat(numbers[1]));
      const blur = numbers.length >= 3 ? Math.abs(parseFloat(numbers[2])) : 0;
      totalDepth += blur + Math.max(offsetX, offsetY);
    }
  }
  return totalDepth;
};

const isVisibleShadow = (shadow: string | number): boolean => {
  const str = String(shadow).trim();
  return str !== 'none' && str !== '0' && str !== '';
};

// ---------------------------------------------------------------------------
// Error tests — surface stratum contracts that must never be violated
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Elevation errors — $label', ({ base, alt }) => {
  const modes = [
    { mode: 'base', tokens: base },
    ...(alt !== undefined ? [{ mode: 'alt', tokens: alt }] : []),
  ];

  describe.each(modes)('$mode mode', ({ tokens }) => {
    // Error #1: elevation.surface.flat resolves to a visible shadow recipe instead of no elevation
    test('flat must not be a visible shadow', () => {
      expect(String(tokens['semantic.elevation.surface.flat']).trim()).toBe(
        'none'
      );
    });

    // Error #2: raised, overlay, and blocking resolve to none, 0, or equivalent non-visible value
    test('raised must be a visible shadow', () => {
      expect(isVisibleShadow(tokens['semantic.elevation.surface.raised'])).toBe(
        true
      );
    });

    // Error #2
    test('overlay must be a visible shadow', () => {
      expect(
        isVisibleShadow(tokens['semantic.elevation.surface.overlay'])
      ).toBe(true);
    });

    // Error #2
    test('blocking must be a visible shadow', () => {
      expect(
        isVisibleShadow(tokens['semantic.elevation.surface.blocking'])
      ).toBe(true);
    });

    // Error #3: semantic depth order breaks — flat < raised < overlay < blocking required
    test('flat depth must be less than raised', () => {
      expect(
        parseShadowDepth(tokens['semantic.elevation.surface.flat'])
      ).toBeLessThan(
        parseShadowDepth(tokens['semantic.elevation.surface.raised'])
      );
    });

    // Error #3
    test('raised depth must be less than overlay', () => {
      expect(
        parseShadowDepth(tokens['semantic.elevation.surface.raised'])
      ).toBeLessThan(
        parseShadowDepth(tokens['semantic.elevation.surface.overlay'])
      );
    });

    // Error #3
    test('overlay depth must be less than blocking', () => {
      expect(
        parseShadowDepth(tokens['semantic.elevation.surface.overlay'])
      ).toBeLessThan(
        parseShadowDepth(tokens['semantic.elevation.surface.blocking'])
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Warning tests — conditions that signal design quality degradation
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Elevation warnings — $label', ({ base, alt }) => {
  const modes = [
    { mode: 'base', tokens: base },
    ...(alt !== undefined ? [{ mode: 'alt', tokens: alt }] : []),
  ];

  describe.each(modes)('$mode mode', ({ tokens }) => {
    // Warning #1: adjacent semantic strata resolve to the same effective elevation contract
    test('Warning #1 — flat and raised must not share equal depth', () => {
      expect(
        parseShadowDepth(tokens['semantic.elevation.surface.flat'])
      ).not.toBe(parseShadowDepth(tokens['semantic.elevation.surface.raised']));
    });

    // Warning #1
    test('Warning #1 — raised and overlay must not share equal depth', () => {
      expect(
        parseShadowDepth(tokens['semantic.elevation.surface.raised'])
      ).not.toBe(
        parseShadowDepth(tokens['semantic.elevation.surface.overlay'])
      );
    });

    // Warning #1
    test('Warning #1 — overlay and blocking must not share equal depth', () => {
      expect(
        parseShadowDepth(tokens['semantic.elevation.surface.overlay'])
      ).not.toBe(
        parseShadowDepth(tokens['semantic.elevation.surface.blocking'])
      );
    });
  });

  // Warning #2: adjacent core elevation levels resolve to the same effective shadow recipe
  // Tested against base tokens only — alternate mode does not override core tokens.
  test('Warning #2 — adjacent core levels must not share equal depth', () => {
    const depths = [0, 1, 2, 3, 4].map((level) => {
      return parseShadowDepth(base[`core.elevation.level.${level}`]);
    });
    for (let i = 0; i < depths.length - 1; i++) {
      expect(depths[i]).not.toBe(depths[i + 1]);
    }
  });
});
