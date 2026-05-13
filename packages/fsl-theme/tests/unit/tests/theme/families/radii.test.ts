/**
 * Radii family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/radii.md#validation
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

const getCoreRadiiPair = (
  tokens: Record<string, string | number>,
  key1: string,
  key2: string
): [number, number] => {
  const a = parseCssLength(tokens[`core.radii.${key1}`]!);
  const b = parseCssLength(tokens[`core.radii.${key2}`]!);
  expect(a).not.toBeNaN();
  expect(b).not.toBeNaN();
  return [a, b];
};

// ---------------------------------------------------------------------------
// Error tests — core order and full-radius visibility
// Core tokens are shared across modes; tested against base only.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)('Radii errors — core ($label)', ({ base }) => {
  // Error #1: core radii order breaks — none > sm is a violation
  test('core.radii.none must not exceed core.radii.sm', () => {
    const [none, sm] = getCoreRadiiPair(base, 'none', 'sm');
    expect(none).toBeLessThanOrEqual(sm);
  });

  // Error #1
  test('core.radii.sm must not exceed core.radii.md', () => {
    const [sm, md] = getCoreRadiiPair(base, 'sm', 'md');
    expect(sm).toBeLessThanOrEqual(md);
  });

  // Error #1
  test('core.radii.md must not exceed core.radii.lg', () => {
    const [md, lg] = getCoreRadiiPair(base, 'md', 'lg');
    expect(md).toBeLessThanOrEqual(lg);
  });

  // Error #1
  test('core.radii.lg must not exceed core.radii.xl', () => {
    const [lg, xl] = getCoreRadiiPair(base, 'lg', 'xl');
    expect(lg).toBeLessThanOrEqual(xl);
  });

  // Error #1
  test('core.radii.xl must be strictly less than core.radii.full', () => {
    const [xl, full] = getCoreRadiiPair(base, 'xl', 'full');
    expect(xl).toBeLessThan(full);
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
    // Warning #1: adjacent core radii steps resolve to the same effective value
    test('core.radii.none and core.radii.sm must not be equal', () => {
      const [none, sm] = getCoreRadiiPair(base, 'none', 'sm');
      expect(none).not.toBe(sm);
    });

    // Warning #1
    test('core.radii.sm and core.radii.md must not be equal', () => {
      const [sm, md] = getCoreRadiiPair(base, 'sm', 'md');
      expect(sm).not.toBe(md);
    });

    // Warning #1
    test('core.radii.md and core.radii.lg must not be equal', () => {
      const [md, lg] = getCoreRadiiPair(base, 'md', 'lg');
      expect(md).not.toBe(lg);
    });

    // Warning #1
    test('core.radii.lg and core.radii.xl must not be equal', () => {
      const [lg, xl] = getCoreRadiiPair(base, 'lg', 'xl');
      expect(lg).not.toBe(xl);
    });

    // Warning #1
    test('core.radii.xl and core.radii.full must not be equal', () => {
      const [xl, full] = getCoreRadiiPair(base, 'xl', 'full');
      expect(xl).not.toBe(full);
    });
  }
);

// ---------------------------------------------------------------------------
// Warning tests — semantic surface hierarchy per mode
// Semantic tokens may differ between modes; tested symmetrically.
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Radii warnings — semantic surface hierarchy ($label)',
  ({ base, alt }) => {
    const modes = [
      { mode: 'base', tokens: base },
      ...(alt !== undefined ? [{ mode: 'alt', tokens: alt }] : []),
    ];

    describe.each(modes)('$mode mode', ({ tokens }) => {
      // Warning #2: radii.surface resolves to a smaller effective radius than radii.control
      test('semantic.radii.surface must be >= semantic.radii.control', () => {
        const controlVal = parseCssLength(tokens['semantic.radii.control']!);
        const surfaceVal = parseCssLength(tokens['semantic.radii.surface']!);
        expect(controlVal).not.toBeNaN();
        expect(surfaceVal).not.toBeNaN();
        expect(surfaceVal).toBeGreaterThanOrEqual(controlVal);
      });
    });
  }
);
