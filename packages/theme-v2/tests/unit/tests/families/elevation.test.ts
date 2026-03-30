/**
 * Elevation family validation tests.
 *
 * Validates elevation tokens against the documented rules:
 * - flat resolves to no shadow (none)
 * - raised, overlay, modal resolve to visible shadows
 * - Depth order: flat < raised < overlay < modal
 *
 * @see REFACTOR.md Gap 3 — Elevation depth-order validation
 */

import { bundleEntries, resolvedBundles } from '../../helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a CSS box-shadow value into a rough "depth" metric.
 * Uses a combined heuristic: sum of (blur-radius + max offset) across layers.
 * This handles both traditional blur-based (default theme) and hard-edge
 * offset-based (bruttal theme) shadow styles.
 *
 * Returns 0 for 'none' or empty shadow values.
 */
const parseShadowDepth = (shadow: string | number): number => {
  const str = String(shadow).trim();

  if (str === 'none' || str === '0' || str === '') {
    return 0;
  }

  // Split composite shadows by comma
  const shadows = str.split(',');
  let totalDepth = 0;

  for (const single of shadows) {
    // Extract numeric values (offset-x offset-y [blur] [spread])
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

/**
 * Check if a shadow value represents a visible shadow (not none/0).
 */
const isVisibleShadow = (shadow: string | number): boolean => {
  const str = String(shadow).trim();
  return str !== 'none' && str !== '0' && str !== '' && str.includes('(');
};

// ---------------------------------------------------------------------------
// Core Elevation — Level Order
// ---------------------------------------------------------------------------

describe('Core elevation levels', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('level.0 resolves to none', () => {
      expect(String(base['core.elevation.level.0']).trim()).toBe('none');
    });

    test('levels 1-4 resolve to visible shadows', () => {
      for (const level of [1, 2, 3, 4]) {
        const value = base[`core.elevation.level.${level}`];
        expect(isVisibleShadow(value)).toBe(true);
      }
    });

    test('depth increases from level 1 to level 4', () => {
      const depths = [1, 2, 3, 4].map((level) =>
        parseShadowDepth(base[`core.elevation.level.${level}`])
      );

      for (let i = 0; i < depths.length - 1; i++) {
        expect(depths[i]).toBeLessThan(depths[i + 1]);
      }
    });

    // Dark elevation levels (if present)
    test('dark.0 resolves to none (if present)', () => {
      const darkLevel0 = base['core.elevation.dark.0'];
      if (darkLevel0 !== undefined) {
        expect(String(darkLevel0).trim()).toBe('none');
      }
    });

    test('dark levels 1-4 resolve to visible shadows (if present)', () => {
      const darkLevel1 = base['core.elevation.dark.1'];
      if (darkLevel1 === undefined) {
        return; // Theme has no dark elevation
      }

      for (const level of [1, 2, 3, 4]) {
        const value = base[`core.elevation.dark.${level}`];
        expect(isVisibleShadow(value)).toBe(true);
      }
    });

    test('dark depth increases from level 1 to level 4 (if present)', () => {
      const darkLevel1 = base['core.elevation.dark.1'];
      if (darkLevel1 === undefined) {
        return;
      }

      const depths = [1, 2, 3, 4].map((level) =>
        parseShadowDepth(base[`core.elevation.dark.${level}`])
      );

      for (let i = 0; i < depths.length - 1; i++) {
        expect(depths[i]).toBeLessThan(depths[i + 1]);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Elevation — Surface Strata
// ---------------------------------------------------------------------------

describe('Semantic elevation surfaces', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base, alt } = resolvedBundles[bundleName];

    const validateSurfaceStrata = (
      tokens: Record<string, string | number>,
      label: string
    ) => {
      const flat = tokens['semantic.elevation.surface.flat'];
      const raised = tokens['semantic.elevation.surface.raised'];
      const overlay = tokens['semantic.elevation.surface.overlay'];
      const modal = tokens['semantic.elevation.surface.modal'];

      // flat must be no shadow
      expect(String(flat).trim()).toBe('none');

      // raised, overlay, modal must be visible
      expect(isVisibleShadow(raised)).toBe(true);
      expect(isVisibleShadow(overlay)).toBe(true);
      expect(isVisibleShadow(modal)).toBe(true);

      // Depth ordering
      const flatDepth = parseShadowDepth(flat);
      const raisedDepth = parseShadowDepth(raised);
      const overlayDepth = parseShadowDepth(overlay);
      const modalDepth = parseShadowDepth(modal);

      expect(flatDepth).toBeLessThan(raisedDepth);
      expect(raisedDepth).toBeLessThan(overlayDepth);
      expect(overlayDepth).toBeLessThan(modalDepth);
    };

    test('base mode: flat < raised < overlay < modal', () => {
      validateSurfaceStrata(base, 'base');
    });

    if (alt) {
      test('alt mode: flat < raised < overlay < modal', () => {
        validateSurfaceStrata(alt, 'alt');
      });
    }
  });
});
