import { darkAlternate } from '../baseTheme';
import { createTheme } from '../createTheme';
import { withDataviz } from '../dataviz/withDataviz';
import { deepMerge } from '../roots/helpers';

/**
 * Bruttal — warm brown brand palette with a brutalist visual identity.
 *
 * Semantic drift from the default theme:
 * - Sharp corners: `radii.control` and `radii.surface` collapse to `core.radii.none`.
 * - Flat surfaces: every `elevation.surface.*` stratum maps to `core.elevation.level.0`
 *   (and to `core.elevation.emphatic.0` in the dark alternate), expressing a brutalist
 *   "no shadows" aesthetic in both modes.
 *
 * Brand palette note:
 * - `brand.500` is tuned to `#6D5D4F` (≈7.3:1 on `neutral.0`) so that semantic slots
 *   using `brand.500` as a filled background with `neutral.0` text meet WCAG AA Normal.
 *
 * The dark alternate inherits `darkAlternate`'s colour remaps and only overrides
 * `elevation.surface.*` to preserve the flat brutalist identity under dark mode.
 */
const bundle = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          50: '#FBF8F5',
          100: '#F3EDE6',
          200: '#E4D7CC',
          300: '#CCBCAE',
          400: '#96836F',
          500: '#6D5D4F',
          600: '#594A3F',
          700: '#4E4239',
          800: '#312921',
          900: '#1A150E',
        },
      },
    },
    semantic: {
      radii: {
        control: '{core.radii.none}',
        surface: '{core.radii.none}',
      },
      elevation: {
        surface: {
          flat: '{core.elevation.level.0}',
          raised: '{core.elevation.level.0}',
          overlay: '{core.elevation.level.0}',
          blocking: '{core.elevation.level.0}',
        },
      },
    },
  },
  alternate: deepMerge(darkAlternate, {
    semantic: {
      elevation: {
        surface: {
          flat: '{core.elevation.emphatic.0}',
          raised: '{core.elevation.emphatic.0}',
          overlay: '{core.elevation.emphatic.0}',
          blocking: '{core.elevation.emphatic.0}',
        },
      },
    },
  }),
});

export const bruttal = withDataviz(bundle);
