/**
 * Sizing family validation tests.
 *
 * Validates sizing tokens against the documented rules:
 * - hit.* tokens are fixed px (no clamp/cqi)
 * - Hit target ordering: min < default < prominent within each pointer profile
 * - Coarse ≥ fine at each step
 * - measure.reading is character-based (ch)
 * - viewport.height.full uses dynamic viewport units (dvh)
 *
 * @see REFACTOR.md Gap 5 — Sizing hit-target validation
 * @see REFACTOR.md Gap 9 — Dynamic viewport unit test
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import { getTokenValue, parseCssLength } from './testHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value is a fixed px value (no clamp, no cqi, no calc).
 */
const isFixedPx = (value: string | number): boolean => {
  const str = String(value).trim();
  return /^\d+(\.\d+)?px$/.test(str);
};

// ---------------------------------------------------------------------------
// Core Hit Targets — Fixed px Requirement
// ---------------------------------------------------------------------------

describe('Core hit targets: fixed px values', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test.each(['fine', 'coarse'])('%s hit targets are fixed px', (profile) => {
      for (const step of ['min', 'default', 'prominent']) {
        const value = base[`core.size.hit.${profile}.${step}`];
        expect(isFixedPx(value)).toBe(true);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Core Hit Targets — Ordering Within Profile
// ---------------------------------------------------------------------------

describe('Core hit targets: ordering within pointer profile', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test.each(['fine', 'coarse'])(
      '%s: min < default < prominent',
      (profile) => {
        const min = parseCssLength(base[`core.size.hit.${profile}.min`]);
        const def = parseCssLength(base[`core.size.hit.${profile}.default`]);
        const prominent = parseCssLength(
          base[`core.size.hit.${profile}.prominent`]
        );

        expect(min).not.toBeNaN();
        expect(def).not.toBeNaN();
        expect(prominent).not.toBeNaN();

        expect(min).toBeLessThan(def);
        expect(def).toBeLessThan(prominent);
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Core Hit Targets — Coarse ≥ Fine at Each Step
// ---------------------------------------------------------------------------

describe('Core hit targets: coarse ≥ fine at each step', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test.each(['min', 'default', 'prominent'])(
      'coarse.%s ≥ fine.%s',
      (step) => {
        const coarse = parseCssLength(base[`core.size.hit.coarse.${step}`]);
        const fine = parseCssLength(base[`core.size.hit.fine.${step}`]);

        expect(coarse).not.toBeNaN();
        expect(fine).not.toBeNaN();
        expect(coarse).toBeGreaterThanOrEqual(fine);
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Hit Target Minimum Size Warning
// ---------------------------------------------------------------------------

describe('Core hit targets: minimum size check', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('no hit target below 24px', () => {
      const warnings: string[] = [];

      for (const profile of ['fine', 'coarse']) {
        for (const step of ['min', 'default', 'prominent']) {
          const value = parseCssLength(
            base[`core.size.hit.${profile}.${step}`]
          );
          if (!isNaN(value) && value < 24) {
            warnings.push(
              `core.size.hit.${profile}.${step}: ${value}px < 24px`
            );
          }
        }
      }

      expect(warnings).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic measure.reading — Character-Based
// ---------------------------------------------------------------------------

describe('Semantic sizing: measure.reading', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('measure.reading uses ch units', () => {
      const value = String(
        getTokenValue(base, 'semantic.sizing.measure.reading')
      );
      expect(value).toContain('ch');
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic viewport.height.full — Dynamic Viewport Units (Gap 9)
// ---------------------------------------------------------------------------

describe('Semantic sizing: viewport.height.full', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('viewport.height.full uses dvh (not vh)', () => {
      const value = String(
        getTokenValue(base, 'semantic.sizing.viewport.height.full')
      );
      expect(value).toContain('dvh');
      expect(value).not.toMatch(/(?<![d])vh/); // must not contain plain vh
    });
  });
});
