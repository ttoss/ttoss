/**
 * Radii family validation tests.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/families/radii.md#validation
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
// Helpers — resolve CSS length values to comparable numbers
// ---------------------------------------------------------------------------

const parseCssLength = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (str === '0' || str === 'none') return 0;
  if (str.endsWith('px')) return parseFloat(str);
  if (str.endsWith('rem')) return parseFloat(str) * 16;
  return NaN;
};

// ---------------------------------------------------------------------------
// Error tests — core order and full-radius visibility
// Core tokens are shared across modes; tested against base only.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Radii errors — core ($label)', ({ base }) => {
  const SCALE = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const;

  // Error #1: core radii scale — none ≤ sm ≤ md ≤ lg ≤ xl < full
  test('core radii scale is non-decreasing and full exceeds xl', () => {
    const values = SCALE.map((k) => {
      return parseCssLength(base[`core.radii.${k}`]!);
    });
    for (let i = 0; i < values.length - 2; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i + 1]);
    }
    expect(values[4]).toBeLessThan(values[5]); // xl < full (strict)
  });

  // Error #2: core.radii.full resolves to 0, none, or an equivalent non-visible radius
  test('core.radii.full must resolve to a positive, visible radius', () => {
    const full = parseCssLength(base['core.radii.full']!);
    expect(full).not.toBeNaN();
    expect(full).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Warning tests — adjacent core steps that collapse to the same value
// Core tokens are shared across modes; tested against base only.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Radii warnings — adjacent core steps ($label)',
  ({ base }) => {
    // Warning #1: all adjacent core radii steps must be distinct
    test('adjacent core radii steps must all be distinct', () => {
      const steps = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
      const values = steps.map((k) => {
        return parseCssLength(base[`core.radii.${k}`]!);
      });
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).not.toBe(values[i + 1]);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Warning tests — semantic surface hierarchy per mode
// Semantic tokens may differ between modes; tested symmetrically.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Radii warnings — semantic surface hierarchy ($label)',
  ({ base }) => {
    // Warning #2: semantic.radii.surface resolves to a smaller effective radius than semantic.radii.control.
    // darkAlternate does not override semantic.radii; tested against base tokens only.
    test('semantic.radii.surface must be >= semantic.radii.control', () => {
      const controlVal = parseCssLength(base['semantic.radii.control']!);
      const surfaceVal = parseCssLength(base['semantic.radii.surface']!);
      expect(controlVal).not.toBeNaN();
      expect(surfaceVal).not.toBeNaN();
      expect(surfaceVal).toBeGreaterThanOrEqual(controlVal);
    });
  }
);
