/**
 * Colors family validation tests.
 *
 * Validates WCAG 2.1 color contrast requirements across all themes and modes:
 * - Text vs background: ≥ 4.5:1 (AA normal)
 * - Border vs adjacent background: ≥ 3:1 (AA large)
 * - Focus/selected states distinguishable from default
 *
 * Known violation counts are tracked as baselines. Tests fail only if
 * NEW violations are introduced. As themes are fixed, update the baselines
 * downward.
 *
 * @see REFACTOR.md Gap 2 — Color contrast validation
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import {
  getContrastRatio,
  hexToRgb,
  WCAGLevels,
} from '../../../../src/roots/accessibility';

// ---------------------------------------------------------------------------
// Violation Baselines — decrease these as themes are fixed
// ---------------------------------------------------------------------------

/**
 * Known total violation count for text contrast (≥ 4.5:1).
 * Aggregate across ALL bundles and modes.
 * Current value was measured from all themes on 2026-03-29.
 */
const KNOWN_TEXT_VIOLATION_COUNT = 44;

/**
 * Known total violation count for border contrast (≥ 3:1).
 * Aggregate across ALL bundles and modes.
 * Re-measured 2026-03-30.
 */
const KNOWN_BORDER_VIOLATION_COUNT = 143;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a flat token value to a hex color.
 * Returns undefined if the token doesn't exist or isn't a hex color.
 */
const resolveHexColor = (
  tokens: Record<string, string | number>,
  path: string
): string | undefined => {
  const value = tokens[path];
  if (typeof value === 'string' && value.startsWith('#')) {
    return value;
  }
  return undefined;
};

/**
 * Collect all semantic color pairings of text.default vs background.default
 * for a given UX context and role.
 */
const findTextBackgroundPairs = (
  tokens: Record<string, string | number>,
  prefix: string
): Array<{ text: string; bg: string; context: string }> => {
  const pairs: Array<{ text: string; bg: string; context: string }> = [];
  const entries = Object.entries(tokens).filter(([key]) =>
    key.startsWith(prefix)
  );

  // Group by ux.role prefix
  const uxRoles = new Set<string>();
  for (const [key] of entries) {
    // Extract ux.role from: semantic.colors.{ux}.{role}.{dimension}.{state}
    const withoutPrefix = key.slice('semantic.colors.'.length);
    const parts = withoutPrefix.split('.');
    if (parts.length >= 4) {
      uxRoles.add(`${parts[0]}.${parts[1]}`);
    }
  }

  for (const uxRole of uxRoles) {
    const textPath = `semantic.colors.${uxRole}.text.default`;
    const bgPath = `semantic.colors.${uxRole}.background.default`;

    const textColor = resolveHexColor(tokens, textPath);
    const bgColor = resolveHexColor(tokens, bgPath);

    if (textColor && bgColor) {
      pairs.push({ text: textColor, bg: bgColor, context: uxRole });
    }
  }

  return pairs;
};

/**
 * Collect all border.default vs background.default pairings.
 */
const findBorderBackgroundPairs = (
  tokens: Record<string, string | number>,
  prefix: string
): Array<{ border: string; bg: string; context: string }> => {
  const pairs: Array<{ border: string; bg: string; context: string }> = [];
  const entries = Object.entries(tokens).filter(([key]) =>
    key.startsWith(prefix)
  );

  const uxRoles = new Set<string>();
  for (const [key] of entries) {
    const withoutPrefix = key.slice('semantic.colors.'.length);
    const parts = withoutPrefix.split('.');
    if (parts.length >= 4) {
      uxRoles.add(`${parts[0]}.${parts[1]}`);
    }
  }

  for (const uxRole of uxRoles) {
    const borderPath = `semantic.colors.${uxRole}.border.default`;
    const bgPath = `semantic.colors.${uxRole}.background.default`;

    const borderColor = resolveHexColor(tokens, borderPath);
    const bgColor = resolveHexColor(tokens, bgPath);

    if (borderColor && bgColor) {
      pairs.push({ border: borderColor, bg: bgColor, context: uxRole });
    }
  }

  return pairs;
};

// ---------------------------------------------------------------------------
// Text vs Background Contrast — AA Normal (≥ 4.5:1)
// ---------------------------------------------------------------------------

describe('Color contrast: text vs background', () => {
  test('total text/bg violations do not exceed known baseline', () => {
    let totalViolations = 0;

    for (const [bundleName] of bundleEntries) {
      const { base, alt } = resolvedBundles[bundleName];

      for (const [modeLabel, tokens] of [
        ['base', base],
        ...(alt ? [['alt', alt]] : []),
      ] as Array<[string, Record<string, string | number>]>) {
        const pairs = findTextBackgroundPairs(tokens, 'semantic.colors.');

        for (const { text, bg } of pairs) {
          const ratio = getContrastRatio(text, bg);
          if (ratio !== null && ratio < WCAGLevels.AA_NORMAL) {
            totalViolations++;
          }
        }
      }
    }

    // Fail if new violations are introduced (count increases)
    expect(totalViolations).toBeLessThanOrEqual(KNOWN_TEXT_VIOLATION_COUNT);
  });

  // Per-bundle check: mechanism validation
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('finds text/background pairs for validation', () => {
      const pairs = findTextBackgroundPairs(base, 'semantic.colors.');
      expect(pairs.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Border vs Background Contrast — AA Large (≥ 3:1)
// ---------------------------------------------------------------------------

describe('Color contrast: border vs background', () => {
  test('total border/bg violations do not exceed known baseline', () => {
    let totalViolations = 0;

    for (const [bundleName] of bundleEntries) {
      const { base, alt } = resolvedBundles[bundleName];

      for (const [modeLabel, tokens] of [
        ['base', base],
        ...(alt ? [['alt', alt]] : []),
      ] as Array<[string, Record<string, string | number>]>) {
        const pairs = findBorderBackgroundPairs(tokens, 'semantic.colors.');

        for (const { border, bg } of pairs) {
          const ratio = getContrastRatio(border, bg);
          if (ratio !== null && ratio < WCAGLevels.AA_LARGE) {
            totalViolations++;
          }
        }
      }
    }

    expect(totalViolations).toBeLessThanOrEqual(KNOWN_BORDER_VIOLATION_COUNT);
  });

  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('finds border/background pairs for validation', () => {
      const pairs = findBorderBackgroundPairs(base, 'semantic.colors.');
      expect(pairs.length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Focused/Selected state distinguishability
// ---------------------------------------------------------------------------

describe('Color contrast: state distinguishability', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base, alt } = resolvedBundles[bundleName];

    const checkStateDistinguishability = (
      tokens: Record<string, string | number>,
      modeLabel: string
    ) => {
      const warnings: string[] = [];
      const entries = Object.entries(tokens).filter(
        ([key]) =>
          key.startsWith('semantic.colors.') &&
          (key.endsWith('.focused') || key.endsWith('.selected'))
      );

      for (const [statePath, stateValue] of entries) {
        if (typeof stateValue !== 'string' || !stateValue.startsWith('#')) {
          continue;
        }

        // Derive the default path
        const defaultPath = statePath.replace(
          /\.(focused|selected)$/,
          '.default'
        );
        const defaultValue = tokens[defaultPath];

        if (
          typeof defaultValue !== 'string' ||
          !defaultValue.startsWith('#')
        ) {
          continue;
        }

        // Check that focused/selected is visually distinct from default
        if (stateValue === defaultValue) {
          warnings.push(
            `${modeLabel}: ${statePath} resolves to same color as ${defaultPath} (${stateValue})`
          );
        }
      }

      return warnings;
    };

    test('base mode: focused/selected states differ from default', () => {
      const warnings = checkStateDistinguishability(base, 'base');
      expect(warnings).toEqual([]);
    });

    if (alt) {
      test('alt mode: focused/selected states differ from default', () => {
        const warnings = checkStateDistinguishability(alt, 'alt');
        expect(warnings).toEqual([]);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// hexToRgb edge cases (ensures utility works for all theme hex values)
// ---------------------------------------------------------------------------

describe('hexToRgb coverage for theme colors', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('all core color hex values parse correctly', () => {
      const colorEntries = Object.entries(base).filter(
        ([key, value]) =>
          key.startsWith('core.colors.') &&
          typeof value === 'string' &&
          value.startsWith('#')
      );

      expect(colorEntries.length).toBeGreaterThan(0);

      for (const [key, value] of colorEntries) {
        const rgb = hexToRgb(value as string);
        expect(rgb).not.toBeNull();
        expect(rgb!.r).toBeGreaterThanOrEqual(0);
        expect(rgb!.r).toBeLessThanOrEqual(255);
      }
    });
  });
});
