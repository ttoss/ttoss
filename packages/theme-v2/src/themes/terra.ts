import { createTheme } from '../createTheme';

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
          main: '#5D4037',
          complimentary: '#FFF3E0',
          accent: '#FF8F00',
          darkNeutral: '#3E2723',
          lightNeutral: '#FAF3E0',
        },
        neutral: {
          white: '#FFFCF5',
          gray50: '#FAF3E0',
          gray100: '#F0E8D5',
          gray200: '#D9CEB5',
          gray300: '#B8A88A',
          gray500: '#7D6F5A',
          gray700: '#4A3F30',
          gray900: '#2A2318',
          black: '#1A1510',
        },
        red: {
          100: '#FBE9E7',
          200: '#FFCCBC',
          300: '#FF8A65',
          400: '#FF7043',
          500: '#F4511E',
          600: '#E64A19',
          700: '#BF360C',
        },
      },
      radii: {
        none: '0px',
        xs: '3px',
        sm: '5px',
        md: '8px',
        lg: '14px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 1px 3px rgba(93,64,55,0.08)',
          2: '0 3px 8px rgba(93,64,55,0.1)',
          3: '0 6px 14px rgba(93,64,55,0.12)',
          4: '0 12px 26px rgba(93,64,55,0.14)',
          5: '0 24px 48px rgba(93,64,55,0.16)',
        },
      },
      font: {
        family: {
          sans: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
          serif: '"Lora", Georgia, "Times New Roman", serif',
        },
      },
    },
  },
});
