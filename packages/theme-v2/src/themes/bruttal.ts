import { createTheme, createThemeBundle } from '../createTheme';
import type { ThemeBundle } from '../Types';
import { semanticDarkAlternate } from './default';

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
          100: '#FFE5E3',
          300: '#FF8A80',
          500: '#FF2D20',
          700: '#C62828',
          900: '#7F1A1A',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#D4D4D4',
          300: '#A3A3A3',
          500: '#525252',
          700: '#292929',
          900: '#0A0A0A',
          1000: '#000000',
        },
        red: {
          100: '#FFE5E3',
          300: '#FF8A80',
          500: '#FF2D20',
          700: '#C62828',
          900: '#7F1A1A',
        },
        green: {
          100: '#E8F5E9',
          300: '#81C784',
          500: '#4CAF50',
          700: '#2E7D32',
          900: '#1B5E20',
        },
        yellow: {
          100: '#FFF8E1',
          300: '#FFD54F',
          500: '#FFC107',
          700: '#A16207',
          900: '#713F12',
        },
      },
      radii: {
        none: '0px',
        sm: '0px',
        md: '2px',
        lg: '4px',
        xl: '8px',
        full: '9999px',
      },
      border: {
        width: {
          none: '0px',
          default: '2px',
          selected: '3px',
          focused: '4px',
        },
      },
      elevation: {
        level: {
          0: 'none',
          1: '2px 2px 0 rgba(0,0,0,0.15)',
          2: '4px 4px 0 rgba(0,0,0,0.2)',
          3: '6px 6px 0 rgba(0,0,0,0.25)',
          4: '8px 8px 0 rgba(0,0,0,0.3)',
        },
        // Dark-optimized: directional white-light shadows — preserves the brutalist style
        dark: {
          0: 'none',
          1: '2px 2px 0 rgba(255,255,255,0.08)',
          2: '4px 4px 0 rgba(255,255,255,0.12)',
          3: '6px 6px 0 rgba(255,255,255,0.16)',
          4: '8px 8px 0 rgba(255,255,255,0.2)',
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

/**
 * Bruttal theme bundle — light base with shared semantic dark alternate.
 */
export const bruttalBundle: ThemeBundle = createThemeBundle({
  base: bruttal,
  alternate: semanticDarkAlternate,
});
