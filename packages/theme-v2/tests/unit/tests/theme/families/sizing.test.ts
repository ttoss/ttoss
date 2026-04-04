/**
 * Sizing family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/sizing.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// Error #5 — generated output does not emit fine-pointer hit values as the
// baseline and coarse-pointer hit values inside @media (any-pointer: coarse).
// Not testable here: requires CSS emit pipeline. Validated at build time only.

// Error #6 — generated output does not emit a viewport-safe fallback before
// container-based overrides.
// Not testable here: requires CSS emit pipeline. Validated at build time only.

// Error #7 — generated output does not gate container-based overrides behind
// @supports (width: 1cqi).
// Not testable here: requires CSS emit pipeline. Validated at build time only.

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
}> = [
  { label: 'default', base: themeFlatToTest },
  ...(themeAltFlatToTest
    ? [{ label: 'alternate', base: themeAltFlatToTest }]
    : []),
];

// ---------------------------------------------------------------------------
// Helpers — centralised comparison logic
// ---------------------------------------------------------------------------

const parsePx = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (str === '0' || str === 'none') return 0;
  if (str.endsWith('px')) return parseFloat(str);
  if (str.endsWith('rem')) return parseFloat(str) * 16;
  return NaN;
};

const isFixedPx = (value: string | number): boolean => {
  return /^\d+(\.\d+)?px$/.test(String(value).trim());
};

// ---------------------------------------------------------------------------
// Fluid/intrinsic values contaminate the ergonomic contract
// ---------------------------------------------------------------------------

describe('hit targets: no fluid or intrinsic values', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Error #1: any hit.* token resolves to a fluid or intrinsic value (clamp, cqi, %, auto, fit-content, min-content, max-content)
      test.each(['fine', 'coarse'])(
        '%s hit targets are fixed px',
        (profile) => {
          for (const step of ['min', 'default', 'prominent']) {
            expect(isFixedPx(base[`core.size.hit.${profile}.${step}`])).toBe(
              true
            );
          }
        }
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Scale coherence: larger effort should map to a larger target
// ---------------------------------------------------------------------------

describe('hit targets: ordering within pointer profile', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Error #2: hit targets do not preserve order inside a pointer profile
      test.each(['fine', 'coarse'])(
        '%s: min < default < prominent',
        (profile) => {
          const min = parsePx(base[`core.size.hit.${profile}.min`]);
          const def = parsePx(base[`core.size.hit.${profile}.default`]);
          const prominent = parsePx(base[`core.size.hit.${profile}.prominent`]);

          expect(min).not.toBeNaN();
          expect(def).not.toBeNaN();
          expect(prominent).not.toBeNaN();

          expect(min).toBeLessThan(def);
          expect(def).toBeLessThan(prominent);
        }
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Touch targets must always equal or exceed their mouse equivalents
// ---------------------------------------------------------------------------

describe('hit targets: coarse ≥ fine at each step', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Error #3: any coarse-pointer hit token is smaller than its fine-pointer counterpart
      test.each(['min', 'default', 'prominent'])(
        'coarse.%s ≥ fine.%s',
        (step) => {
          const coarse = parsePx(base[`core.size.hit.coarse.${step}`]);
          const fine = parsePx(base[`core.size.hit.fine.${step}`]);

          expect(coarse).not.toBeNaN();
          expect(fine).not.toBeNaN();
          expect(coarse).toBeGreaterThanOrEqual(fine);
        }
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Character units survive font-size zoom; pixel units do not
// ---------------------------------------------------------------------------

describe('measure.reading: character-based contract', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Error #4: measure.reading is not a bounded character-based measure
      test('measure.reading uses ch units', () => {
        expect(String(base['semantic.sizing.measure.reading'])).toContain('ch');
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Dynamic viewport units avoid iOS address-bar resize jank
// ---------------------------------------------------------------------------

describe('viewport.height.full: dynamic viewport units', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Error #8: generated output emits viewport.height.full as vh instead of dynamic viewport units
      test('viewport.height.full uses dvh (not vh)', () => {
        const value = String(base['semantic.sizing.viewport.height.full']);
        expect(value).toContain('dvh');
        expect(value).not.toMatch(/(?<![d])vh/);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Semantic families must anchor to core ramps, not define ad-hoc values
// ---------------------------------------------------------------------------

describe('semantic sizing: core ramp anchoring', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Warning #1: any icon.* token resolves outside core.size.ramp.ui.*
      test('icon tokens resolve within core.size.ramp.ui', () => {
        const rampUi = new Set(
          [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            return base[`core.size.ramp.ui.${n}`];
          })
        );
        for (const step of ['sm', 'md', 'lg']) {
          expect(rampUi.has(base[`semantic.sizing.icon.${step}`])).toBe(true);
        }
      });

      // Warning #2: any identity.* token resolves outside core.size.ramp.ui.*
      test('identity tokens resolve within core.size.ramp.ui', () => {
        const rampUi = new Set(
          [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            return base[`core.size.ramp.ui.${n}`];
          })
        );
        for (const step of ['sm', 'md', 'lg', 'xl']) {
          expect(rampUi.has(base[`semantic.sizing.identity.${step}`])).toBe(
            true
          );
        }
      });

      // Warning #3: surface.maxWidth resolves outside core.size.ramp.layout.*
      test('surface.maxWidth resolves within core.size.ramp.layout', () => {
        const rampLayout = new Set(
          [1, 2, 3, 4, 5, 6].map((n) => {
            return base[`core.size.ramp.layout.${n}`];
          })
        );
        expect(rampLayout.has(base['semantic.sizing.surface.maxWidth'])).toBe(
          true
        );
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Semantic viewport alias must stay synchronised with the core primitive
// ---------------------------------------------------------------------------

describe('semantic sizing: viewport.height.full alias', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Warning #4: viewport.height.full does not resolve to core.size.viewport.heightFull
      test('viewport.height.full equals core.size.viewport.heightFull', () => {
        expect(base['semantic.sizing.viewport.height.full']).toBe(
          base['core.size.viewport.heightFull']
        );
      });
    });
  }
});

// ---------------------------------------------------------------------------
// WCAG 2.2 interactive target baseline
// ---------------------------------------------------------------------------

describe('hit targets: minimum 24px threshold', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Warning #5: any resolved hit.* value is below 24px
      test('no hit target below 24px', () => {
        for (const profile of ['fine', 'coarse']) {
          for (const step of ['min', 'default', 'prominent']) {
            expect(
              parsePx(base[`core.size.hit.${profile}.${step}`])
            ).toBeGreaterThanOrEqual(24);
          }
        }
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Duplicate ramp steps collapse the scale and reduce expressive range
// ---------------------------------------------------------------------------

describe('semantic sizing: adjacent steps must be distinct', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Warning #6: adjacent icon.* tokens resolve to the same effective value
      test('adjacent icon tokens have distinct values', () => {
        expect(base['semantic.sizing.icon.sm']).not.toBe(
          base['semantic.sizing.icon.md']
        );
        expect(base['semantic.sizing.icon.md']).not.toBe(
          base['semantic.sizing.icon.lg']
        );
      });

      // Warning #7: adjacent identity.* tokens resolve to the same effective value
      test('adjacent identity tokens have distinct values', () => {
        expect(base['semantic.sizing.identity.sm']).not.toBe(
          base['semantic.sizing.identity.md']
        );
        expect(base['semantic.sizing.identity.md']).not.toBe(
          base['semantic.sizing.identity.lg']
        );
        expect(base['semantic.sizing.identity.lg']).not.toBe(
          base['semantic.sizing.identity.xl']
        );
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Identical profiles indicate pointer-capability misconfiguration
// ---------------------------------------------------------------------------

describe('hit targets: fine and coarse profiles must differ', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Warning #8: all fine-pointer and coarse-pointer hit tokens resolve to the same values
      test('fine and coarse profiles are not all identical', () => {
        const steps = ['min', 'default', 'prominent'];
        const allSame = steps.every((step) => {
          return (
            base[`core.size.hit.fine.${step}`] ===
            base[`core.size.hit.coarse.${step}`]
          );
        });
        expect(allSame).toBe(false);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Confusing two distinct spatial contracts creates copy-paste errors
// ---------------------------------------------------------------------------

describe('semantic sizing: measure.reading ≠ surface.maxWidth', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Warning #9: measure.reading and surface.maxWidth resolve to the same effective value
      test('measure.reading and surface.maxWidth are distinct', () => {
        expect(base['semantic.sizing.measure.reading']).not.toBe(
          base['semantic.sizing.surface.maxWidth']
        );
      });
    });
  }
});
