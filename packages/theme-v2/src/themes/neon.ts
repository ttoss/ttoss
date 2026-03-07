import { createTheme } from '../createTheme';

/**
 * **Neon** — High-contrast palette with vibrant accents.
 *
 * Near-black surfaces with a vivid neon-green accent for maximum contrast.
 * Designed for dark-first interfaces and data-heavy dashboards.
 */
export const neon = createTheme({
  overrides: {
    core: {
      colors: {
        brand: {
          main: '#0D0D0D',
          complimentary: '#E0E0E0',
          accent: '#00E676',
          darkNeutral: '#1A1A2E',
          lightNeutral: '#121212',
        },
        neutral: {
          white: '#E0E0E0',
          gray50: '#2A2A3D',
          gray100: '#232338',
          gray200: '#1E1E30',
          gray300: '#3A3A52',
          gray500: '#6B6B85',
          gray700: '#A0A0B8',
          gray900: '#D0D0E0',
          black: '#050508',
        },
        red: {
          100: '#2D1B1B',
          200: '#4A2020',
          300: '#7A3030',
          400: '#B04040',
          500: '#FF4D4D',
          600: '#FF6B6B',
          700: '#FF8A8A',
        },
      },
      radii: {
        none: '0px',
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '10px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 1px 4px rgba(0,230,118,0.04)',
          2: '0 3px 8px rgba(0,230,118,0.06)',
          3: '0 6px 16px rgba(0,230,118,0.08)',
          4: '0 12px 28px rgba(0,230,118,0.1)',
          5: '0 24px 48px rgba(0,230,118,0.14)',
        },
      },
      font: {
        family: {
          sans: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
          mono: '"Fira Code", "JetBrains Mono", monospace',
        },
      },
    },
    semantic: {
      colors: {
        content: {
          primary: {
            background: { default: '{core.colors.neutral.gray100}' },
            border: { default: '{core.colors.neutral.gray300}' },
            text: { default: '{core.colors.neutral.gray900}' },
          },
          secondary: {
            background: { default: '{core.colors.neutral.gray50}' },
            border: { default: '{core.colors.neutral.gray300}' },
            text: { default: '{core.colors.neutral.gray700}' },
          },
          muted: {
            background: { default: '{core.colors.neutral.gray200}' },
            border: { default: '{core.colors.neutral.gray300}' },
            text: { default: '{core.colors.neutral.gray500}' },
          },
        },
        input: {
          primary: {
            background: { default: '{core.colors.neutral.gray200}' },
            border: {
              default: '{core.colors.neutral.gray300}',
              focused: '{core.colors.brand.accent}',
            },
            text: { default: '{core.colors.neutral.gray900}' },
          },
        },
        navigation: {
          primary: {
            background: { default: '{core.colors.brand.darkNeutral}' },
            border: { default: '{core.colors.neutral.gray300}' },
            text: {
              default: '{core.colors.neutral.gray700}',
              current: '{core.colors.brand.accent}',
            },
          },
        },
      },
    },
  },
});
