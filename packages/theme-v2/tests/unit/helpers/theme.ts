/**
 * Shared theme test fixtures.
 */

import { buildTheme, createTheme } from '../../../src/createTheme';
import { toFlatTokens } from '../../../src/css';
import { withDataviz } from '../../../src/dataviz/withDataviz';

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
