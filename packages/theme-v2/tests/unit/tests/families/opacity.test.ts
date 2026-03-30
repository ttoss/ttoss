/**
 * Opacity family validation tests.
 *
 * Validates opacity tokens against the documented rules:
 * - Core opacity scale order (0 < 25 < 50 < 75 < 100)
 * - Semantic opacity values stay within [0, 1]
 * - Semantic tokens avoid pure transparent (0) or opaque (1)
 *
 * @see REFACTOR.md Phase 6.8 — Test requirements
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import { filterTokensByPrefix } from './testHelpers';

// ---------------------------------------------------------------------------
// Core Opacity — Order Validation
// ---------------------------------------------------------------------------

describe('Core opacity', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: order is 0 < 25 < 50 < 75 < 100', () => {
      const { core } = bundle.base;
      const opacity = core.opacity;

      // Core opacity uses numeric values (0.0 to 1.0)
      expect(opacity[0]).toBeLessThan(opacity[25]);
      expect(opacity[25]).toBeLessThan(opacity[50]);
      expect(opacity[50]).toBeLessThan(opacity[75]);
      expect(opacity[75]).toBeLessThan(opacity[100]);
    });

    test('base mode: adjacent steps differ (no duplicate values)', () => {
      const { core } = bundle.base;
      const opacity = core.opacity;

      expect(opacity[0]).not.toBe(opacity[25]);
      expect(opacity[25]).not.toBe(opacity[50]);
      expect(opacity[50]).not.toBe(opacity[75]);
      expect(opacity[75]).not.toBe(opacity[100]);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Opacity — Range Validation
// ---------------------------------------------------------------------------

describe('Semantic opacity', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, _bundle) => {
    const { base, alt } = resolvedBundles[bundleName];

    /**
     * Helper to validate opacity tokens in a mode.
     * Reduces duplication between base and alternate mode tests.
     */
    const validateOpacityRange = (
      tokens: Record<string, string | number>,
      _modeName: string
    ) => {
      const opacityTokens = filterTokensByPrefix(tokens, 'semantic.opacity.');

      expect(opacityTokens.length).toBeGreaterThan(0);

      for (const [_key, value] of opacityTokens) {
        const numValue = Number(value);
        // Must be within [0, 1]
        expect(numValue).toBeGreaterThanOrEqual(0);
        expect(numValue).toBeLessThanOrEqual(1);
        // Must not be exactly 0 or 1 (avoid pure transparent/opaque)
        expect(numValue).not.toBe(0);
        expect(numValue).not.toBe(1);
      }
    };

    test('base mode: all semantic tokens resolve within (0, 1) exclusive', () => {
      validateOpacityRange(base, 'base');
    });

    test('alternate mode: all semantic tokens resolve within (0, 1) exclusive (if alternate exists)', () => {
      if (!alt) {
        return; // Single-mode theme
      }

      validateOpacityRange(alt, 'alternate');
    });
  });
});
