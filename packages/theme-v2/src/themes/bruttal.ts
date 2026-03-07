import { createTheme } from '../createTheme';

/**
 * **Bruttal** — Bold contrasts, dark neutrals, geometric feel.
 *
 * Strong black/white contrasts with a vivid red accent.
 * Sharp corners (near-zero radii) and heavier borders reinforce the brutalist aesthetic.
 */
export const bruttal = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          main: '#0A0A0A',
          complimentary: '#FFFFFF',
          accent: '#FF2D20',
          darkNeutral: '#111111',
          lightNeutral: '#FAFAFA',
        },
        neutral: {
          white: '#FFFFFF',
          gray50: '#F5F5F5',
          gray100: '#E5E5E5',
          gray200: '#D4D4D4',
          gray300: '#A3A3A3',
          gray500: '#525252',
          gray700: '#292929',
          gray900: '#0A0A0A',
          black: '#000000',
        },
      },
      radii: {
        none: '0px',
        xs: '0px',
        sm: '0px',
        md: '2px',
        lg: '4px',
        full: '9999px',
      },
      borders: {
        width: {
          0: '0',
          hairline: '2px',
          sm: '3px',
          md: '5px',
        },
      },
      elevation: {
        level: {
          0: 'none',
          1: '2px 2px 0 rgba(0,0,0,0.15)',
          2: '4px 4px 0 rgba(0,0,0,0.2)',
          3: '6px 6px 0 rgba(0,0,0,0.25)',
          4: '8px 8px 0 rgba(0,0,0,0.3)',
          5: '12px 12px 0 rgba(0,0,0,0.35)',
        },
      },
      font: {
        family: {
          sans: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
        },
      },
    },
  },
});
