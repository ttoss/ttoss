import { createTheme, createThemeBundle } from '../createTheme';
import type { ThemeBundle } from '../Types';
import { semanticDarkAlternate } from './default';

/**
 * **Aurora** — Soft, cool-toned palette with rounded surfaces.
 *
 * Deep indigo base with cool lavender tones and a vibrant purple accent.
 * Generous radii and diffused shadows create a smooth, modern aesthetic.
 */
export const aurora = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          100: '#E8EAF6',
          300: '#9FA8DA',
          500: '#7C4DFF',
          700: '#512DA8',
          900: '#311B92',
        },
        neutral: {
          0: '#FAFAFF',
          50: '#F0F0FA',
          100: '#E3E3F0',
          200: '#C9C9DE',
          300: '#9E9EBF',
          500: '#6A6A8E',
          700: '#3D3D5C',
          900: '#1A1A33',
          1000: '#0D0D1A',
        },
        red: {
          100: '#FCE4EC',
          300: '#F48FB1',
          500: '#E91E63',
          700: '#AD1457',
          900: '#880E4F',
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
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '28px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 2px 4px rgba(26,35,126,0.06)',
          2: '0 4px 8px rgba(26,35,126,0.08)',
          3: '0 8px 16px rgba(26,35,126,0.1)',
          4: '0 16px 32px rgba(26,35,126,0.12)',
        },
        // Dark-optimized: higher-opacity diffused shadows for dark aurora surfaces
        dark: {
          0: 'none',
          1: '0 2px 4px rgba(0,0,0,0.24)',
          2: '0 4px 8px rgba(0,0,0,0.28)',
          3: '0 8px 16px rgba(0,0,0,0.32)',
          4: '0 16px 32px rgba(0,0,0,0.38)',
        },
      },
      font: {
        family: {
          sans: '"Inter", "Segoe UI", system-ui, sans-serif',
        },
      },
    },
  },
});

/**
 * Aurora theme bundle — light base with shared semantic dark alternate.
 */
export const auroraBundle: ThemeBundle = createThemeBundle({
  base: aurora,
  alternate: semanticDarkAlternate,
});
