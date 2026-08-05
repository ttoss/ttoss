/**
 * Rail family validation tests (fsl-ui F-050/F-051).
 *
 * `semantic.rail.track` is the cross-cutting address for "the unfilled part
 * of a track" — sibling of `focus`/`overlay`/`consequence` (model.md §6).
 * Before it existed, `ProgressBar`/`Meter` borrowed `feedback.muted.background`
 * and `Slider` borrowed `input.primary.background.disabled`, a state used as
 * a part. These tests pin the values this ruling chose and guard against a
 * regression back to either borrow.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/model.md#6-no-parallel-vocabulary
 * @see /docs/fsl-studio/FRICTION.md F-050, F-051
 */

import {
  bruttalFixtures,
  themeAltFlatToTest,
  themeFlatToTest,
} from '../../../fixtures/theme';

const bundleEntries: ReadonlyArray<{
  label: string;
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
}> = [
  { label: 'default', base: themeFlatToTest, alt: themeAltFlatToTest },
  { label: 'bruttal', base: bruttalFixtures.base, alt: bruttalFixtures.alt },
];

const RAIL = 'semantic.rail.track';
const FEEDBACK_MUTED_BG = 'semantic.colors.feedback.muted.background.default';
const INPUT_PRIMARY_DISABLED_BG =
  'semantic.colors.input.primary.background.disabled';

describe('Rail — resolves to the measured value in every bundle', () => {
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      // Neither bundle overrides `semantic.rail` or `semantic.colors.feedback`/
      // `input` independently of the base — bruttal only drifts brand, radii
      // and elevation (see `themes/bruttal.ts`) — so both share these values.
      test('base (light): neutral.200 (#e1e1e1)', () => {
        expect(base[RAIL]).toBe('#e1e1e1');
      });

      test('alternate (dark): neutral.700 (#3d3d3d)', () => {
        expect(alt?.[RAIL]).toBe('#3d3d3d');
      });
    });
  }
});

describe('Rail — no longer collapses onto either token it used to borrow', () => {
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      // Light: this is the half F-050 left owing — the rail borrowed from
      // `feedback.muted` reads quieter than the reference wants, and the
      // dedicated address moves off that value rather than repeating it.
      test('light: differs from feedback.muted.background', () => {
        expect(base[RAIL]).not.toBe(base[FEEDBACK_MUTED_BG]);
      });

      // Light: Slider's old borrow. Distinct from the outset — a Selection
      // control's disabled fill was never meant to double as a Feedback rail.
      test('light: differs from input.primary.background.disabled', () => {
        expect(base[RAIL]).not.toBe(base[INPUT_PRIMARY_DISABLED_BG]);
      });

      // Dark: the value F-050 already found for `feedback.muted.background`
      // (`neutral.700`) is also the closest step to the reference's own dark
      // track, so this token's dark value coincides with it by measurement,
      // not by an unretired borrow — `rail.ts` no longer reads that address
      // at all (see fsl-ui `rail.test.tsx`). What must still differ, in every
      // mode, is the state token Slider borrowed — an empty Slider rail must
      // never again mean "disabled".
      test('dark: differs from input.primary.background.disabled', () => {
        expect(alt?.[RAIL]).not.toBe(alt?.[INPUT_PRIMARY_DISABLED_BG]);
      });
    });
  }
});
