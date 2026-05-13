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

/**
 * Extract the first argument (the `floor`) of a `clamp(floor, preferred, max)`
 * expression. Returns null when the value is not a clamp expression.
 */
const extractClampFloor = (value: string | number): string | null => {
  const str = String(value).trim();
  const match = str.match(/^clamp\(\s*([^,]+)\s*,/);
  return match ? match[1]!.trim() : null;
};

/**
 * Resolve a hit-target token to its ergonomic floor in px:
 *   - `coarse` profile: always fixed px (per docs) — parsed directly.
 *   - `fine` profile: may be fluid via `clamp(floor, preferred, max)` —
 *     the first argument is the fixed-px ergonomic floor and is what
 *     ergonomic guarantees and ordering invariants must measure.
 */
const hitFloorPx = (
  value: string | number,
  profile: 'fine' | 'coarse'
): number => {
  if (profile === 'coarse') return parsePx(value);
  const floor = extractClampFloor(value);
  return floor !== null ? parsePx(floor) : parsePx(value);
};

// ---------------------------------------------------------------------------
// Fluid/intrinsic values contaminate the ergonomic contract
// ---------------------------------------------------------------------------

describe('hit targets: ergonomic floors are fixed px', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      // Error #1 (coarse): coarse-pointer hit tokens must be fixed px — touch
      // ergonomics require predictable, reliable targets (no fluid scaling).
      test('coarse hit targets are fixed px', () => {
        for (const step of ['min', 'base', 'prominent']) {
          expect(isFixedPx(base[`core.sizing.hit.coarse.${step}`])).toBe(true);
        }
      });

      // Error #1 (fine): fine-pointer hit tokens may be fluid via
      // `clamp(floor, preferred, max)` — but the floor (first argument) must
      // be a fixed px ergonomic minimum so accessibility is always guaranteed.
      // Plain px values are also acceptable.
      test('fine hit targets resolve to a fixed px ergonomic floor', () => {
        for (const step of ['min', 'base', 'prominent']) {
          const value = base[`core.sizing.hit.fine.${step}`];
          const str = String(value).trim();
          if (isFixedPx(str)) continue;
          const floor = extractClampFloor(str);
          expect(floor).not.toBeNull();
          expect(isFixedPx(floor!)).toBe(true);
        }
      });
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
      test.each(['fine', 'coarse'] as const)(
        '%s: min < base < prominent',
        (profile) => {
          const min = hitFloorPx(
            base[`core.sizing.hit.${profile}.min`]!,
            profile
          );
          const def = hitFloorPx(
            base[`core.sizing.hit.${profile}.base`]!,
            profile
          );
          const prominent = hitFloorPx(
            base[`core.sizing.hit.${profile}.prominent`]!,
            profile
          );

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
      test.each(['min', 'base', 'prominent'])('coarse.%s ≥ fine.%s', (step) => {
        const coarse = hitFloorPx(
          base[`core.sizing.hit.coarse.${step}`]!,
          'coarse'
        );
        const fine = hitFloorPx(base[`core.sizing.hit.fine.${step}`]!, 'fine');

        expect(coarse).not.toBeNaN();
        expect(fine).not.toBeNaN();
        expect(coarse).toBeGreaterThanOrEqual(fine);
      });
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

describe('viewport.width.full: dynamic viewport units', () => {
  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      test('viewport.width.full uses dvw (not vw)', () => {
        const value = String(base['semantic.sizing.viewport.width.full']);
        expect(value).toContain('dvw');
        expect(value).not.toMatch(/(?<![d])vw/);
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
      // Warning #1: any icon.* token resolves outside core.sizing.ramp.ui.*
      test('icon tokens resolve within core.sizing.ramp.ui', () => {
        const rampUi = new Set(
          [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            return base[`core.sizing.ramp.ui.${n}`];
          })
        );
        for (const step of ['sm', 'md', 'lg']) {
          expect(rampUi.has(base[`semantic.sizing.icon.${step}`])).toBe(true);
        }
      });

      // Warning #2: any identity.* token resolves outside core.sizing.ramp.ui.*
      test('identity tokens resolve within core.sizing.ramp.ui', () => {
        const rampUi = new Set(
          [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
            return base[`core.sizing.ramp.ui.${n}`];
          })
        );
        for (const step of ['sm', 'md', 'lg', 'xl']) {
          expect(rampUi.has(base[`semantic.sizing.identity.${step}`])).toBe(
            true
          );
        }
      });

      // Warning #3: surface.maxWidth resolves outside core.sizing.ramp.layout.*
      test('surface.maxWidth resolves within core.sizing.ramp.layout', () => {
        const rampLayout = new Set(
          [1, 2, 3, 4, 5, 6].map((n) => {
            return base[`core.sizing.ramp.layout.${n}`];
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
      // Warning #4: viewport.height.full does not resolve to core.sizing.viewport.height.full
      test('viewport.height.full equals core.sizing.viewport.height.full', () => {
        expect(base['semantic.sizing.viewport.height.full']).toBe(
          base['core.sizing.viewport.height.full']
        );
      });

      test('viewport.width.full equals core.sizing.viewport.width.full', () => {
        expect(base['semantic.sizing.viewport.width.full']).toBe(
          base['core.sizing.viewport.width.full']
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
        for (const profile of ['fine', 'coarse'] as const) {
          for (const step of ['min', 'base', 'prominent']) {
            expect(
              hitFloorPx(base[`core.sizing.hit.${profile}.${step}`]!, profile)
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
        const steps = ['min', 'base', 'prominent'];
        const allSame = steps.every((step) => {
          return (
            base[`core.sizing.hit.fine.${step}`] ===
            base[`core.sizing.hit.coarse.${step}`]
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
