/**
 * Opacity family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/opacity.md#validation
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
// Helpers — semantic opacity token extraction
// ---------------------------------------------------------------------------

const SEMANTIC_OPACITY_ROLES = ['scrim', 'loading', 'disabled'] as const;

const getSemanticOpacityEntries = (
  tokens: Record<string, string | number>
): Array<[string, number]> => {
  return Object.entries(tokens)
    .filter(([key]) => {
      return key.startsWith('semantic.opacity.');
    })
    .map(([key, value]) => {
      return [key, Number(value)];
    });
};

// ---------------------------------------------------------------------------
// Error tests — core opacity order
// Tested against base tokens only — alternate mode does not override core tokens.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Opacity errors — core order ($label)',
  ({ base }) => {
    // Error #1: core opacity order breaks — opacity.0 > opacity.25 is a violation
    test('core.opacity.0 must not exceed core.opacity.25', () => {
      expect(Number(base['core.opacity.0'])).toBeLessThanOrEqual(
        Number(base['core.opacity.25'])
      );
    });

    // Error #1
    test('core.opacity.25 must not exceed core.opacity.50', () => {
      expect(Number(base['core.opacity.25'])).toBeLessThanOrEqual(
        Number(base['core.opacity.50'])
      );
    });

    // Error #1
    test('core.opacity.50 must not exceed core.opacity.75', () => {
      expect(Number(base['core.opacity.50'])).toBeLessThanOrEqual(
        Number(base['core.opacity.75'])
      );
    });

    // Error #1
    test('core.opacity.75 must not exceed core.opacity.100', () => {
      expect(Number(base['core.opacity.75'])).toBeLessThanOrEqual(
        Number(base['core.opacity.100'])
      );
    });
  }
);

// ---------------------------------------------------------------------------
// Error tests — semantic opacity range and boundary exclusion
// Tested against both modes — semantic tokens may differ between base and alternate.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Opacity errors — semantic ($label)',
  ({ base, alt }) => {
    const modes = [
      { mode: 'base', tokens: base },
      ...(alt !== undefined ? [{ mode: 'alt', tokens: alt }] : []),
    ];

    describe.each(modes)('$mode mode', ({ tokens }) => {
      // Error #2: any semantic opacity token resolves outside the valid opacity range (< 0 or > 1)
      test('all semantic tokens resolve within [0, 1]', () => {
        const entries = getSemanticOpacityEntries(tokens);
        expect(entries.length).toBeGreaterThan(0);
        for (const [, numValue] of entries) {
          expect(numValue).toBeGreaterThanOrEqual(0);
          expect(numValue).toBeLessThanOrEqual(1);
        }
      });

      // Error #3: scrim, loading, disabled must not resolve to 0, 1, or equivalent non-translucent value
      test.each(SEMANTIC_OPACITY_ROLES)(
        'opacity.%s must not be fully transparent or fully opaque',
        (role) => {
          const value = Number(tokens[`semantic.opacity.${role}`]);
          expect(value).not.toBe(0);
          expect(value).not.toBe(1);
        }
      );
    });
  }
);

// ---------------------------------------------------------------------------
// Warning tests — adjacent core steps with identical values
// Tested against base tokens only — alternate mode does not override core tokens.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Opacity warnings — adjacent core steps ($label)',
  ({ base }) => {
    // Warning #1: adjacent core opacity steps resolve to the same effective value
    test('core.opacity.0 and core.opacity.25 must not be equal', () => {
      expect(Number(base['core.opacity.0'])).not.toBe(
        Number(base['core.opacity.25'])
      );
    });

    // Warning #1
    test('core.opacity.25 and core.opacity.50 must not be equal', () => {
      expect(Number(base['core.opacity.25'])).not.toBe(
        Number(base['core.opacity.50'])
      );
    });

    // Warning #1
    test('core.opacity.50 and core.opacity.75 must not be equal', () => {
      expect(Number(base['core.opacity.50'])).not.toBe(
        Number(base['core.opacity.75'])
      );
    });

    // Warning #1
    test('core.opacity.75 and core.opacity.100 must not be equal', () => {
      expect(Number(base['core.opacity.75'])).not.toBe(
        Number(base['core.opacity.100'])
      );
    });
  }
);
