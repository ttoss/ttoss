import { createTheme } from '../createTheme';

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
          main: '#1A237E',
          complimentary: '#E8EAF6',
          accent: '#7C4DFF',
          darkNeutral: '#283593',
          lightNeutral: '#F3F4FF',
        },
        neutral: {
          white: '#FAFAFF',
          gray50: '#F0F0FA',
          gray100: '#E3E3F0',
          gray200: '#C9C9DE',
          gray300: '#9E9EBF',
          gray500: '#6A6A8E',
          gray700: '#3D3D5C',
          gray900: '#1A1A33',
          black: '#0D0D1A',
        },
        red: {
          100: '#FCE4EC',
          200: '#F8BBD0',
          300: '#F48FB1',
          400: '#F06292',
          500: '#E91E63',
          600: '#C2185B',
          700: '#AD1457',
        },
      },
      radii: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '20px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 2px 4px rgba(26,35,126,0.06)',
          2: '0 4px 8px rgba(26,35,126,0.08)',
          3: '0 8px 16px rgba(26,35,126,0.1)',
          4: '0 16px 32px rgba(26,35,126,0.12)',
          5: '0 32px 56px rgba(26,35,126,0.15)',
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
