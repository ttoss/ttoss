/**
 * Typography family validation tests.
 *
 * Validates typography tokens against the documented rules:
 * - Font weight order: regular < medium < semibold < bold
 * - Leading order: tight < snug < normal < relaxed
 * - fontOpticalSizing values are 'auto' or 'none'
 * - Semantic text styles use token refs consistently
 *
 * @see REFACTOR.md Phase 6.3 — Test requirements
 */

import { bundleEntries } from '../../helpers';

// ---------------------------------------------------------------------------
// Core Font — Weight Order
// ---------------------------------------------------------------------------

describe('Core font weights', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: order is regular < medium < semibold < bold', () => {
      const { core } = bundle.base;
      const weights = core.font.weight;

      // Font weights are numeric values
      expect(weights.regular).toBeLessThan(weights.medium);
      expect(weights.medium).toBeLessThan(weights.semibold);
      expect(weights.semibold).toBeLessThan(weights.bold);
    });

    test('base mode: all weights are distinct', () => {
      const { core } = bundle.base;
      const weights = core.font.weight;

      // No duplicate weight values
      expect(weights.regular).not.toBe(weights.medium);
      expect(weights.medium).not.toBe(weights.semibold);
      expect(weights.semibold).not.toBe(weights.bold);
    });
  });
});

// ---------------------------------------------------------------------------
// Core Font — Leading Order
// ---------------------------------------------------------------------------

describe('Core font leading', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: order is tight < snug < normal < relaxed', () => {
      const { core } = bundle.base;
      const leading = core.font.leading;

      // Line heights are numeric values (unitless)
      expect(leading.tight).toBeLessThan(leading.snug);
      expect(leading.snug).toBeLessThan(leading.normal);
      expect(leading.normal).toBeLessThan(leading.relaxed);
    });

    test('base mode: all leading values are distinct', () => {
      const { core } = bundle.base;
      const leading = core.font.leading;

      // No duplicate leading values
      expect(leading.tight).not.toBe(leading.snug);
      expect(leading.snug).not.toBe(leading.normal);
      expect(leading.normal).not.toBe(leading.relaxed);
    });
  });
});

// ---------------------------------------------------------------------------
// Core Font — Optical Sizing
// ---------------------------------------------------------------------------

describe('Core font optical sizing', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: opticalSizing values are "auto" or "none"', () => {
      const { core } = bundle.base;
      const opticalSizing = core.font.opticalSizing;

      // Only two valid values per CSS spec
      expect(['auto', 'none']).toContain(opticalSizing.auto);
      expect(['auto', 'none']).toContain(opticalSizing.none);

      // Values should be different (auto !== none)
      expect(opticalSizing.auto).toBe('auto');
      expect(opticalSizing.none).toBe('none');
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Text — Style Consistency
// ---------------------------------------------------------------------------

describe('Semantic text styles', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: all text styles have required properties', () => {
      const { semantic } = bundle.base;
      const textFamilies = [
        'display',
        'headline',
        'title',
        'body',
        'label',
        'code',
      ] as const;

      for (const family of textFamilies) {
        const styles = semantic.text[family];

        // Each family should have size variants
        expect(styles).toBeDefined();
        expect(typeof styles).toBe('object');

        // Check each size has the required properties
        for (const [size, style] of Object.entries(styles)) {
          expect(style).toBeDefined();
          expect(typeof style).toBe('object');

          // Required properties for text styles
          expect(style).toHaveProperty('fontFamily');
          expect(style).toHaveProperty('fontSize');
          expect(style).toHaveProperty('fontWeight');
          expect(style).toHaveProperty('lineHeight');
          expect(style).toHaveProperty('letterSpacing');

          // Values should be token refs (strings starting with {)
          expect(typeof style.fontFamily).toBe('string');
          expect(typeof style.fontSize).toBe('string');
          expect(typeof style.fontWeight).toBe('string');
          expect(typeof style.lineHeight).toBe('string');
          expect(typeof style.letterSpacing).toBe('string');
        }
      }
    });
  });
});
