import { createTheme, createThemeBundle } from '../createTheme';
import type { ThemeBundle } from '../Types';
import { semanticDarkAlternate } from './default';

/**
 * **Terra** — Earthy, warm palette with a grounded feel.
 *
 * Warm browns, amber accents, and an olive-tinted neutral scale.
 * Medium radii and warm-tinted shadows convey stability and warmth.
 */
export const terra = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          100: '#FFF3E0',
          300: '#FFB74D',
          500: '#FF8F00',
          700: '#E65100',
          900: '#BF360C',
        },
        neutral: {
          0: '#FFFCF5',
          50: '#FAF3E0',
          100: '#F0E8D5',
          200: '#D9CEB5',
          300: '#B8A88A',
          500: '#7D6F5A',
          700: '#4A3F30',
          900: '#2A2318',
          1000: '#1A1510',
        },
        red: {
          100: '#FBE9E7',
          300: '#FF8A65',
          500: '#F4511E',
          700: '#BF360C',
          900: '#8D2506',
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
        sm: '5px',
        md: '8px',
        lg: '14px',
        xl: '20px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 1px 3px rgba(93,64,55,0.08)',
          2: '0 3px 8px rgba(93,64,55,0.1)',
          3: '0 6px 14px rgba(93,64,55,0.12)',
          4: '0 12px 26px rgba(93,64,55,0.14)',
        },
        // Dark-optimized: heavier diffused shadows for warm dark surfaces
        dark: {
          0: 'none',
          1: '0 1px 3px rgba(0,0,0,0.26)',
          2: '0 3px 8px rgba(0,0,0,0.30)',
          3: '0 6px 14px rgba(0,0,0,0.34)',
          4: '0 12px 26px rgba(0,0,0,0.40)',
        },
      },
      font: {
        family: {
          sans: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
          serif: '"Lora", Georgia, "Times New Roman", serif',
        },
      },
    },
    semantic: {
      colors: {
        action: {
          /**
           * Amber accent (#FF8F00) has insufficient contrast with white text.
           * Use dark text (neutral.1000) on primary action buttons.
           */
          primary: {
            text: { default: '{core.colors.neutral.1000}' },
          },
        },
      },
    },
  },
});

/**
 * Terra theme bundle — light base with shared semantic dark alternate.
 */
export const terraBundle: ThemeBundle = createThemeBundle({
  base: terra,
  alternate: semanticDarkAlternate,
});
