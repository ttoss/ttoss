/**
 * Valence family validation tests (ADR-029).
 *
 * `semantic.valence.{positive,caution,negative}.ink` is the cross-cutting
 * address for "the ink of a part that *reports* a valence while painting no
 * surface" — sibling of `focus`/`overlay`/`consequence`/`rail` (model.md §6).
 * It generalizes `consequence.destructive.ink` (ADR-025), which minted the
 * same shape for one valence on one trigger.
 *
 * Two things need guarding, and they pull in opposite directions:
 *
 *   1. The resolved values, per mode per bundle — each member aliases the ink
 *      its own `{ux}` already ships, so a remap of that token must carry here.
 *   2. That `valence.negative.ink` and `consequence.destructive.ink` stay
 *      **separately declared addresses**. They resolve alike in this theme by
 *      choice, not by identity: FSL Lexicon §10.5 keeps `negative` (reported
 *      outcome) apart from `destructive` (effect on state). So the coincidence
 *      is asserted as *deliberate* — never that one derives from the other,
 *      which is the assertion that would let a future refactor collapse them.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/model.md#6-no-parallel-vocabulary
 * @see /docs/website/docs/design/design-system/fsl/fsl-lexicon.md
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

const VALENCE = {
  positive: 'semantic.valence.positive.ink',
  caution: 'semantic.valence.caution.ink',
  negative: 'semantic.valence.negative.ink',
} as const;

/** The ink each member aliases — `informational.{valence}.text.default`. */
const SOURCE = {
  positive: 'semantic.colors.informational.positive.text.default',
  caution: 'semantic.colors.informational.caution.text.default',
  negative: 'semantic.colors.informational.negative.text.default',
} as const;

const CONSEQUENCE_INK = 'semantic.consequence.destructive.ink';

/** Measured in ADR-029. Neither bundle drifts these hues. */
const EXPECTED = {
  positive: { light: '#14532d', dark: '#86efac' }, // green.900 / green.300
  caution: { light: '#713f12', dark: '#fde047' }, // yellow.900 / yellow.300
  negative: { light: '#7f1d1d', dark: '#fca5a5' }, // red.900 / red.300
} as const;

const VALENCES = ['positive', 'caution', 'negative'] as const;

describe('Valence — resolves to the measured value in every bundle', () => {
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      for (const valence of VALENCES) {
        test(`${valence} — light: ${EXPECTED[valence].light}`, () => {
          expect(base[VALENCE[valence]]).toBe(EXPECTED[valence].light);
        });

        test(`${valence} — dark: ${EXPECTED[valence].dark}`, () => {
          expect(alt?.[VALENCE[valence]]).toBe(EXPECTED[valence].dark);
        });
      }
    });
  }
});

describe('Valence — every member tracks the ink it aliases, in both modes', () => {
  // The alias is the whole mechanism: a semantic→semantic reference is what
  // makes a mode remap of `informational.{valence}.text` carry this token with
  // it, exactly as `focus.ring.color` and `consequence.destructive.ink` do. A
  // theme that repointed one and not the other would have two addresses for
  // one meaning drifting apart silently.
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      for (const valence of VALENCES) {
        test(`${valence} — light matches ${SOURCE[valence]}`, () => {
          expect(base[VALENCE[valence]]).toBe(base[SOURCE[valence]]);
        });

        test(`${valence} — dark matches ${SOURCE[valence]}`, () => {
          expect(alt?.[VALENCE[valence]]).toBe(alt?.[SOURCE[valence]]);
        });
      }
    });
  }
});

describe('Valence — `negative` and the destructive consequence are two addresses', () => {
  // FSL Lexicon §10.5: `negative` is an Evaluation (what is being reported),
  // `destructive` is a Consequence (what the interaction does). They coincide
  // in this theme deliberately, so the guard asserts the coincidence *and*
  // that both paths exist — a refactor that deleted either one would keep the
  // value assertions green while destroying the distinction.
  for (const { label, base, alt } of bundleEntries) {
    describe(label, () => {
      test('both addresses are declared', () => {
        expect(base[VALENCE.negative]).toBeDefined();
        expect(base[CONSEQUENCE_INK]).toBeDefined();
        expect(alt?.[VALENCE.negative]).toBeDefined();
        expect(alt?.[CONSEQUENCE_INK]).toBeDefined();
      });

      test('they coincide in this theme, by choice — light', () => {
        expect(base[VALENCE.negative]).toBe(base[CONSEQUENCE_INK]);
      });

      test('they coincide in this theme, by choice — dark', () => {
        expect(alt?.[VALENCE.negative]).toBe(alt?.[CONSEQUENCE_INK]);
      });
    });
  }
});

describe('Valence — the family has no emphasis members', () => {
  // `role` is a discriminated union of Emphasis and Valence, and FSL Lexicon §5
  // owns the classification: `accent` is Emphasis — "semantic divergence" — not
  // a judgement about outcome, so a valence ink has nothing to say there.
  // Settled rather than open: `Types.ts` and `colors.md` agree, and §11 ranks
  // the Lexicon above both. This test is the tripwire — a fourth member added
  // here fails rather than quietly shipping an ink that contradicts §5.
  const EMPHASIS_ROLES = ['primary', 'secondary', 'accent', 'muted'] as const;

  for (const { label, base } of bundleEntries) {
    describe(label, () => {
      for (const role of EMPHASIS_ROLES) {
        test(`no semantic.valence.${role}.ink`, () => {
          expect(base[`semantic.valence.${role}.ink`]).toBeUndefined();
        });
      }
    });
  }
});
