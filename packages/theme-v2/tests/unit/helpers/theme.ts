/**
 * Shared theme test fixtures.
 */

import { buildTheme, createTheme } from '../../../src/createTheme';
import { toFlatTokens } from '../../../src/css';
import { withDataviz } from '../../../src/dataviz/withDataviz';
import { bruttal } from '../../../src/themes/bruttal';
import type { ThemeBundle } from '../../../src/Types';

/** Theme under test — default bundle extended with dataviz. */
export const themeToTest = withDataviz(createTheme());

/** Pre-resolved flat tokens for the base mode (dataviz-extended). */
export const themeFlatToTest = toFlatTokens(themeToTest.base);

/** Pre-resolved flat tokens for the alternate (dark) mode (dataviz-extended). */
export const themeAltFlatToTest = themeToTest.alternate
  ? toFlatTokens(
      buildTheme({
        base: themeToTest.base,
        overrides: { semantic: themeToTest.alternate.semantic },
      })
    )
  : undefined;

/**
 * Flattens a theme bundle into base + optional alternate flat-token records.
 * Used by cross-theme contrast tests that iterate over every bundle.
 */
export const toBundleFixtures = (
  bundle: ThemeBundle
): {
  base: Record<string, string | number>;
  alt?: Record<string, string | number>;
} => {
  return {
    base: toFlatTokens(bundle.base),
    alt: bundle.alternate
      ? toFlatTokens(
          buildTheme({
            base: bundle.base,
            overrides: { semantic: bundle.alternate.semantic },
          })
        )
      : undefined,
  };
};

/** Pre-resolved flat tokens for the bruttal theme. */
export const bruttalFixtures = toBundleFixtures(bruttal);
