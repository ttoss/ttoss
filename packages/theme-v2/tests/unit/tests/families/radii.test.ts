/**
 * Radii family validation tests.
 *
 * Validates radii tokens against the documented rules:
 * - Core radii order (none < sm < md < lg < xl < full)
 * - full must not be 0 or none
 * - Adjacent core radii should differ (no duplicates)
 * - Semantic surface >= control (warning)
 *
 * @see REFACTOR.md Phase 6.6 — Test requirements
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import { getTokenValue, parseCssLength } from './testHelpers';

// ---------------------------------------------------------------------------
// Core Radii — Order Validation
// ---------------------------------------------------------------------------

describe('Core radii', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: order is none <= sm <= md <= lg <= xl < full', () => {
      const { core } = bundle.base;
      const radii = core.radii;

      const noneVal = parseCssLength(radii.none);
      const smVal = parseCssLength(radii.sm);
      const mdVal = parseCssLength(radii.md);
      const lgVal = parseCssLength(radii.lg);
      const xlVal = parseCssLength(radii.xl);
      const fullVal = parseCssLength(radii.full);

      // All should be parseable
      expect(noneVal).not.toBeNaN();
      expect(smVal).not.toBeNaN();
      expect(mdVal).not.toBeNaN();
      expect(lgVal).not.toBeNaN();
      expect(xlVal).not.toBeNaN();
      expect(fullVal).not.toBeNaN();

      // Order validation (allow equal values at start for brutalist themes)
      expect(noneVal).toBeLessThanOrEqual(smVal);
      expect(smVal).toBeLessThanOrEqual(mdVal);
      expect(mdVal).toBeLessThanOrEqual(lgVal);
      expect(lgVal).toBeLessThanOrEqual(xlVal);
      expect(xlVal).toBeLessThan(fullVal); // full MUST be larger (not equal)
    });

    test('base mode: full is not 0 or none', () => {
      const { core } = bundle.base;
      const fullVal = parseCssLength(core.radii.full);

      expect(fullVal).toBeGreaterThan(0);
    });

    test('base mode: md, lg, xl differ (no duplicates in middle scale)', () => {
      const { core } = bundle.base;
      const radii = core.radii;

      const mdVal = parseCssLength(radii.md);
      const lgVal = parseCssLength(radii.lg);
      const xlVal = parseCssLength(radii.xl);
      const fullVal = parseCssLength(radii.full);

      // Middle scale should have distinct values (none/sm can be equal for brutalist themes)
      expect(mdVal).not.toBe(lgVal);
      expect(lgVal).not.toBe(xlVal);
      expect(xlVal).not.toBe(fullVal);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Radii — Validation
// ---------------------------------------------------------------------------

describe('Semantic radii', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, _bundle) => {
    const { base, alt } = resolvedBundles[bundleName];

    /**
     * Helper to validate surface >= control hierarchy.
     * Extracted to avoid duplication between base and alternate modes.
     */
    const validateSurfaceHierarchy = (
      tokens: Record<string, string | number>,
      _modeName: string
    ) => {
      const controlVal = parseCssLength(
        getTokenValue(tokens, 'semantic.radii.control')!
      );
      const surfaceVal = parseCssLength(
        getTokenValue(tokens, 'semantic.radii.surface')!
      );

      // Both should be parseable
      expect(controlVal).not.toBeNaN();
      expect(surfaceVal).not.toBeNaN();

      // Surface radii should be >= control radii (larger surfaces, rounder corners)
      // This is a warning-level recommendation, not a hard error
      expect(surfaceVal).toBeGreaterThanOrEqual(controlVal);
    };

    test('base mode: surface >= control (recommended hierarchy)', () => {
      validateSurfaceHierarchy(base, 'base');
    });

    test('alternate mode: surface >= control (if alternate exists)', () => {
      if (!alt) {
        return; // Single-mode theme
      }

      validateSurfaceHierarchy(alt, 'alternate');
    });
  });
});
