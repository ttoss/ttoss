import { buildTheme } from '../createTheme';
import type { ThemeBundle } from '../Types';
import { coreDatavizDefault, semanticDataviz } from './baseTheme';

// -- Composer ---------------------------------------------------------------

/**
 * Extend a `ThemeBundle` with the dataviz token layer.
 *
 * Applies `core.dataviz` (encoding primitives) and `semantic.dataviz` on top
 * of the bundle's base theme. Semantic color mappings reference `core.colors.*`
 * from the base theme, so brand-aligned dataviz palettes are automatic.
 * The dark-mode alternate (if any) is preserved as-is.
 *
 * @param bundle - Bundle to extend (return value of `createTheme`).
 * @returns A new `ThemeBundle` with dataviz tokens included.
 *
 * @example
 * ```ts
 * import { createTheme } from '@ttoss/theme2';
 * import { withDataviz } from '@ttoss/theme2/dataviz';
 *
 * export const myTheme = withDataviz(createTheme({
 *   overrides: { core: { colors: { brand: { 500: '#FF0000' } } } },
 * }));
 * ```
 */
export const withDataviz = (bundle: ThemeBundle): ThemeBundle => {
  return {
    ...bundle,
    base: buildTheme({
      base: bundle.base,
      overrides: {
        core: { dataviz: coreDatavizDefault },
        semantic: { dataviz: semanticDataviz },
      },
    }),
  };
};
