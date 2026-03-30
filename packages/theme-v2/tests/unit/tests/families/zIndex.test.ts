/**
 * Z-Index family validation tests.
 *
 * Validates z-index tokens against the documented rules:
 * - Core z-index order (level.0 < level.1 < level.2 < level.3 < level.4)
 * - level.0 must be >= 0 (no negative z-index)
 * - Adjacent core levels differ by >= 10 (warning)
 * - Semantic layer order (base < sticky < overlay < modal < transient)
 *
 * @see REFACTOR.md Phase 6.10 — Test requirements
 */

import { bundleEntries, resolvedBundles } from '../../helpers';

// ---------------------------------------------------------------------------
// Core Z-Index — Order Validation
// ---------------------------------------------------------------------------

describe('Core z-index', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: order is level.0 < level.1 < level.2 < level.3 < level.4', () => {
      const { core } = bundle.base;
      const levels = core.zIndex.level;

      // Core z-index uses integer values
      expect(levels[0]).toBeLessThan(levels[1]);
      expect(levels[1]).toBeLessThan(levels[2]);
      expect(levels[2]).toBeLessThan(levels[3]);
      expect(levels[3]).toBeLessThan(levels[4]);
    });

    test('base mode: level.0 is non-negative', () => {
      const { core } = bundle.base;
      const levels = core.zIndex.level;

      expect(levels[0]).toBeGreaterThanOrEqual(0);
    });

    test('base mode: adjacent levels differ by >= 10 (recommended spacing)', () => {
      const { core } = bundle.base;
      const levels = core.zIndex.level;

      // This is a warning-level check, not an error
      // But we test it to ensure themes follow best practices
      expect(levels[1] - levels[0]).toBeGreaterThanOrEqual(10);
      expect(levels[2] - levels[1]).toBeGreaterThanOrEqual(10);
      expect(levels[3] - levels[2]).toBeGreaterThanOrEqual(10);
      expect(levels[4] - levels[3]).toBeGreaterThanOrEqual(10);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Z-Index — Order Validation
// ---------------------------------------------------------------------------

describe('Semantic z-index', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, _bundle) => {
    const { base, alt } = resolvedBundles[bundleName];

    test('base mode: semantic layer order (base < sticky < overlay < modal < transient)', () => {
      // Filter flat tokens for semantic.zIndex.layer.* paths
      const baseVal = Number(base['semantic.zIndex.layer.base']);
      const stickyVal = Number(base['semantic.zIndex.layer.sticky']);
      const overlayVal = Number(base['semantic.zIndex.layer.overlay']);
      const modalVal = Number(base['semantic.zIndex.layer.modal']);
      const transientVal = Number(base['semantic.zIndex.layer.transient']);

      // All values should resolve to numbers
      expect(baseVal).not.toBeNaN();
      expect(stickyVal).not.toBeNaN();
      expect(overlayVal).not.toBeNaN();
      expect(modalVal).not.toBeNaN();
      expect(transientVal).not.toBeNaN();

      // Order validation
      expect(baseVal).toBeLessThan(stickyVal);
      expect(stickyVal).toBeLessThan(overlayVal);
      expect(overlayVal).toBeLessThan(modalVal);
      expect(modalVal).toBeLessThan(transientVal);
    });

    test('alternate mode: semantic layer order (if alternate exists)', () => {
      if (!alt) {
        return; // Single-mode theme
      }

      // Filter flat tokens for semantic.zIndex.layer.* paths
      const baseVal = Number(alt['semantic.zIndex.layer.base']);
      const stickyVal = Number(alt['semantic.zIndex.layer.sticky']);
      const overlayVal = Number(alt['semantic.zIndex.layer.overlay']);
      const modalVal = Number(alt['semantic.zIndex.layer.modal']);
      const transientVal = Number(alt['semantic.zIndex.layer.transient']);

      // All values should resolve to numbers
      expect(baseVal).not.toBeNaN();
      expect(stickyVal).not.toBeNaN();
      expect(overlayVal).not.toBeNaN();
      expect(modalVal).not.toBeNaN();
      expect(transientVal).not.toBeNaN();

      // Order validation
      expect(baseVal).toBeLessThan(stickyVal);
      expect(stickyVal).toBeLessThan(overlayVal);
      expect(overlayVal).toBeLessThan(modalVal);
      expect(modalVal).toBeLessThan(transientVal);
    });
  });
});
