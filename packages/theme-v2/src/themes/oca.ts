import { createTheme } from '../createTheme';

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
          main: '#2D5016',
          complimentary: '#FFF8E7',
          accent: '#7CB342',
          darkNeutral: '#3E2723',
          lightNeutral: '#F5F0E8',
        },
        neutral: {
          white: '#FFFDF7',
          gray50: '#F5F0E8',
          gray100: '#EDE8DF',
          gray200: '#D7CFC4',
          gray300: '#B0A898',
          gray500: '#77705F',
          gray700: '#4A4539',
          gray900: '#2A2419',
          black: '#1A1610',
        },
        red: {
          100: '#FCEAE6',
          200: '#F5C2B8',
          300: '#E8927F',
          400: '#D9664D',
          500: '#C94C2E',
          600: '#AB3A1E',
          700: '#8B2E16',
        },
      },
      radii: {
        none: '0px',
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 1px 3px rgba(46,80,22,0.06)',
          2: '0 3px 8px rgba(46,80,22,0.08)',
          3: '0 6px 16px rgba(46,80,22,0.1)',
          4: '0 12px 28px rgba(46,80,22,0.12)',
          5: '0 24px 48px rgba(46,80,22,0.14)',
        },
      },
      font: {
        family: {
          sans: '"Nunito Sans", "Segoe UI", system-ui, sans-serif',
        },
      },
    },
  },
});
