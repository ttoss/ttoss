import { defaultTheme } from '../createTheme';
import { aurora } from './aurora';
import { bruttal } from './bruttal';
import { neon } from './neon';
import { oca } from './oca';
import { terra } from './terra';

export { aurora, bruttal, neon, oca, terra };

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
