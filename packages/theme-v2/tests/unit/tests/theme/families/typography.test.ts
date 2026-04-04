/**
 * Typography family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/typography.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// Error #4 — generated output does not emit a viewport-safe fallback before
// container-based overrides.
// Not testable here: requires CSS emit pipeline. Validated at build time only.

// Error #5 — generated output does not gate container-based overrides behind
// @supports (width: 1cqi).
// Not testable here: requires CSS emit pipeline. Validated at build time only.

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  tokens: Record<string, string | number>;
}> = [
  { label: 'default', tokens: themeFlatToTest },
  ...(themeAltFlatToTest
    ? [{ label: 'alternate', tokens: themeAltFlatToTest }]
    : []),
];

// ---------------------------------------------------------------------------
// Helpers — centralised contract comparison for adjacent step uniqueness
// ---------------------------------------------------------------------------

const CONTRACT_PROPS = [
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
] as const;

const resolveContract = (
  tokens: Record<string, string | number>,
  family: string,
  step: string
): Array<string | number | undefined> => {
  return CONTRACT_PROPS.map((prop) => {
    return tokens[`semantic.text.${family}.${step}.${prop}`];
  });
};

const contractsAreEqual = (
  a: Array<string | number | undefined>,
  b: Array<string | number | undefined>
): boolean => {
  return a.every((v, i) => {
    return v === b[i];
  });
};

// ---------------------------------------------------------------------------
// Core font — Leading order (core tokens are invariant across modes)
// ---------------------------------------------------------------------------

describe('Core font leading', () => {
  test('order: tight < snug < normal < relaxed', () => {
    const tight = themeFlatToTest['core.font.leading.tight'] as number;
    const snug = themeFlatToTest['core.font.leading.snug'] as number;
    const normal = themeFlatToTest['core.font.leading.normal'] as number;
    const relaxed = themeFlatToTest['core.font.leading.relaxed'] as number;

    // Error #1: leading order breaks — tight >= snug
    expect(tight).toBeLessThan(snug);
    // Error #1: snug >= normal
    expect(snug).toBeLessThan(normal);
    // Error #1: normal >= relaxed
    expect(normal).toBeLessThan(relaxed);
  });
});

// ---------------------------------------------------------------------------
// Core font — Weight order (core tokens are invariant across modes)
// ---------------------------------------------------------------------------

describe('Core font weights', () => {
  test('order: regular < medium < semibold < bold', () => {
    const regular = themeFlatToTest['core.font.weight.regular'] as number;
    const medium = themeFlatToTest['core.font.weight.medium'] as number;
    const semibold = themeFlatToTest['core.font.weight.semibold'] as number;
    const bold = themeFlatToTest['core.font.weight.bold'] as number;

    // Error #2: weight order breaks — regular > medium
    expect(regular).toBeLessThan(medium);
    // Error #2: medium > semibold
    expect(medium).toBeLessThan(semibold);
    // Error #2: semibold > bold
    expect(semibold).toBeLessThan(bold);
  });
});

// ---------------------------------------------------------------------------
// Semantic text — Optical sizing values must be 'auto' or 'none'
// ---------------------------------------------------------------------------

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic text — optical sizing (${label})`, () => {
    test('all emitted fontOpticalSizing values are "auto" or "none"', () => {
      const VALID = new Set(['auto', 'none']);
      const keys = Object.keys(tokens).filter((k) => {
        return (
          k.startsWith('semantic.text.') && k.endsWith('.fontOpticalSizing')
        );
      });

      expect(keys.length).toBeGreaterThan(0);

      for (const key of keys) {
        // Error #3: any emitted fontOpticalSizing value is not 'auto' or 'none'
        expect(VALID.has(String(tokens[key]))).toBe(true);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Semantic text — Adjacent steps must not collapse to the same contract
// ---------------------------------------------------------------------------

const TEXT_FAMILIES = [
  'display',
  'headline',
  'title',
  'body',
  'label',
] as const;

const ADJACENT_PAIRS = [
  ['lg', 'md'],
  ['md', 'sm'],
] as const;

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic text — adjacent step uniqueness (${label})`, () => {
    for (const family of TEXT_FAMILIES) {
      for (const [larger, smaller] of ADJACENT_PAIRS) {
        test(`${family}: ${larger} and ${smaller} resolve to distinct contracts`, () => {
          // Warning #1: adjacent steps in the same semantic family resolve to the same effective text contract
          expect(
            contractsAreEqual(
              resolveContract(tokens, family, larger),
              resolveContract(tokens, family, smaller)
            )
          ).toBe(false);
        });
      }
    }

    test('code: md and sm resolve to distinct contracts', () => {
      // Warning #1
      expect(
        contractsAreEqual(
          resolveContract(tokens, 'code', 'md'),
          resolveContract(tokens, 'code', 'sm')
        )
      ).toBe(false);
    });
  });
}
