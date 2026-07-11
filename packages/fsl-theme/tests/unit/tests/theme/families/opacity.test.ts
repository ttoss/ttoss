/**
 * Opacity family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/opacity.md#validation
 */

import { themeFlatToTest } from '../../../fixtures/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
}> = [{ label: 'default', base: themeFlatToTest }];

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
    // Error #1: core opacity scale must be non-decreasing
    test('core opacity scale is non-decreasing', () => {
      const STEPS = [0, 25, 50, 75, 100];
      const values = STEPS.map((k) => {
        return Number(base[`core.opacity.${k}`]);
      });
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeLessThanOrEqual(values[i + 1]);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Error tests — semantic opacity range and boundary exclusion
// Tested against both modes — semantic tokens may differ between base and alternate.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Opacity errors — semantic ($label)',
  ({ base }) => {
    // Error #2: any semantic opacity token resolves outside the valid opacity range (< 0 or > 1).
    // darkAlternate does not override semantic.opacity; tested against base tokens only.
    test('all semantic tokens resolve within [0, 1]', () => {
      const entries = getSemanticOpacityEntries(base);
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
        const value = Number(base[`semantic.opacity.${role}`]);
        expect(value).not.toBe(0);
        expect(value).not.toBe(1);
      }
    );
  }
);

// ---------------------------------------------------------------------------
// Warning tests — adjacent core steps with identical values
// Tested against base tokens only — alternate mode does not override core tokens.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Opacity warnings — adjacent core steps ($label)',
  ({ base }) => {
    // Warning #1: all adjacent core opacity steps must be distinct
    test('adjacent core opacity steps must all be distinct', () => {
      const STEPS = [0, 25, 50, 75, 100];
      const values = STEPS.map((k) => {
        return Number(base[`core.opacity.${k}`]);
      });
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).not.toBe(values[i + 1]);
      }
    });
  }
);
