import { createThemeBundle } from '../createTheme';
import { aurora, auroraBundle } from './aurora';
import { bruttal, bruttalBundle } from './bruttal';
import { defaultTheme, semanticDarkAlternate } from './default';
import { neon, neonBundle } from './neon';
import { oca, ocaBundle } from './oca';
import { terra, terraBundle } from './terra';

/**
 * Default theme bundle — light base with dark alternate.
 * Assembled here (not in default.ts) to avoid circular dependency with createTheme.
 */
const defaultBundle = createThemeBundle({
  base: defaultTheme,
  alternate: semanticDarkAlternate,
});

export { aurora, bruttal, defaultTheme, neon, oca, terra };
export {
  auroraBundle,
  bruttalBundle,
  defaultBundle,
  neonBundle,
  ocaBundle,
  terraBundle,
};

/**
 * All built-in themes as a single object.
 *
 * @example
 * ```ts
 * import { themes } from '@ttoss/theme2';
 * const theme = themes.bruttal;
 * ```
 */
export const themes = {
  default: defaultTheme,
  bruttal,
  oca,
  aurora,
  terra,
  neon,
} as const;

/**
 * All built-in theme bundles as a single object.
 *
 * @example
 * ```ts
 * import { bundles } from '@ttoss/theme2';
 * const bundle = bundles.aurora;
 * ```
 */
export const bundles = {
  default: defaultBundle,
  aurora: auroraBundle,
  bruttal: bruttalBundle,
  neon: neonBundle,
  oca: ocaBundle,
  terra: terraBundle,
} as const;
