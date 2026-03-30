import { createTheme, createThemeBundle } from '../createTheme';
import type { ThemeBundle } from '../Types';
import { semanticDarkAlternate } from './default';

/**
 * **OCA** — Natural greens, organic warmth.
 *
 * Inspired by nature with deep forest greens and warm creams.
 * Softer radii and gentle shadows create an organic, approachable feel.
 */
export const oca = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          100: '#E8F5E9',
          300: '#A5D6A7',
          500: '#7CB342',
          700: '#558B2F',
          900: '#33691E',
        },
        neutral: {
          0: '#FFFDF7',
          50: '#F5F0E8',
          100: '#EDE8DF',
          200: '#D7CFC4',
          300: '#B0A898',
          500: '#77705F',
          700: '#4A4539',
          900: '#2A2419',
          1000: '#1A1610',
        },
        red: {
          100: '#FCEAE6',
          300: '#E8927F',
          500: '#C94C2E',
          700: '#8B2E16',
          900: '#5F1F0F',
        },
        green: {
          100: '#E8F5E9',
          300: '#A5D6A7',
          500: '#66BB6A',
          700: '#14532D',
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
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 1px 3px rgba(46,80,22,0.06)',
          2: '0 3px 8px rgba(46,80,22,0.08)',
          3: '0 6px 16px rgba(46,80,22,0.1)',
          4: '0 12px 28px rgba(46,80,22,0.12)',
        },
        // Dark-optimized: heavier diffused shadows for dark earthy surfaces
        dark: {
          0: 'none',
          1: '0 1px 3px rgba(0,0,0,0.24)',
          2: '0 3px 8px rgba(0,0,0,0.28)',
          3: '0 6px 16px rgba(0,0,0,0.32)',
          4: '0 12px 28px rgba(0,0,0,0.38)',
        },
      },
      font: {
        family: {
          sans: '"Nunito Sans", "Segoe UI", system-ui, sans-serif',
        },
      },
    },
    semantic: {
      colors: {
        action: {
          /**
           * Olive green accent (#7CB342) has insufficient contrast with white text.
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
 * OCA theme bundle — light base with shared semantic dark alternate.
 */
export const ocaBundle: ThemeBundle = createThemeBundle({
  base: oca,
  alternate: semanticDarkAlternate,
});
