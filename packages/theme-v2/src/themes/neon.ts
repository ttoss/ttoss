import { createTheme, createThemeBundle } from '../createTheme';
import type { ThemeBundle } from '../Types';

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
          100: '#B9F6CA',
          300: '#69F0AE',
          500: '#00E676',
          700: '#00C853',
          900: '#009624',
        },
        neutral: {
          0: '#E0E0E0',
          50: '#2A2A3D',
          100: '#232338',
          200: '#1E1E30',
          300: '#3A3A52',
          500: '#6B6B85',
          700: '#A0A0B8',
          900: '#D0D0E0',
          1000: '#050508',
        },
        red: {
          100: '#2D1B1B',
          300: '#7A3030',
          500: '#FF4D4D',
          700: '#FF6B6B',
          900: '#FF8A8A',
        },
        green: {
          100: '#1B2D1B',
          300: '#306030',
          500: '#00E676',
          700: '#69F0AE',
          900: '#B9F6CA',
        },
        yellow: {
          100: '#2D2A1B',
          300: '#7A7030',
          500: '#FFD600',
          700: '#FFE57F',
          900: '#FFF9C4',
        },
      },
      radii: {
        none: '0px',
        sm: '4px',
        md: '6px',
        lg: '10px',
        xl: '16px',
        full: '9999px',
      },
      elevation: {
        level: {
          0: 'none',
          1: '0 1px 4px rgba(0,230,118,0.04)',
          2: '0 3px 8px rgba(0,230,118,0.06)',
          3: '0 6px 16px rgba(0,230,118,0.08)',
          4: '0 12px 28px rgba(0,230,118,0.1)',
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
            background: { default: '{core.colors.neutral.100}' },
            border: { default: '{core.colors.neutral.300}' },
            text: { default: '{core.colors.neutral.900}' },
          },
          secondary: {
            background: { default: '{core.colors.neutral.50}' },
            border: { default: '{core.colors.neutral.300}' },
            text: { default: '{core.colors.neutral.700}' },
          },
          muted: {
            background: { default: '{core.colors.neutral.200}' },
            border: { default: '{core.colors.neutral.300}' },
            text: { default: '{core.colors.neutral.700}' },
          },
        },
        action: {
          /**
           * Dark-first theme: use dark text on bright accent backgrounds for WCAG AA.
           */
          primary: {
            background: {
              default: '{core.colors.brand.500}',
              hover: '{core.colors.brand.300}',
              active: '{core.colors.brand.100}',
              disabled: '{core.colors.neutral.300}',
            },
            border: {
              default: '{core.colors.brand.500}',
              focused: '{core.colors.brand.300}',
              disabled: '{core.colors.neutral.300}',
            },
            text: {
              default: '{core.colors.neutral.1000}',
              disabled: '{core.colors.neutral.500}',
            },
          },
          secondary: {
            background: {
              default: '{core.colors.neutral.200}',
              hover: '{core.colors.neutral.300}',
              active: '{core.colors.neutral.500}',
              disabled: '{core.colors.neutral.200}',
            },
            border: {
              default: '{core.colors.neutral.300}',
              focused: '{core.colors.brand.500}',
              disabled: '{core.colors.neutral.300}',
            },
            text: {
              default: '{core.colors.neutral.900}',
              disabled: '{core.colors.neutral.500}',
            },
          },
          negative: {
            background: {
              default: '{core.colors.red.500}',
              hover: '{core.colors.red.700}',
              active: '{core.colors.red.900}',
              disabled: '{core.colors.neutral.300}',
            },
            border: {
              default: '{core.colors.red.500}',
              focused: '{core.colors.red.700}',
              disabled: '{core.colors.neutral.300}',
            },
            text: {
              default: '{core.colors.neutral.1000}',
              disabled: '{core.colors.neutral.500}',
            },
          },
          muted: {
            background: {
              default: '{core.colors.neutral.200}',
              hover: '{core.colors.neutral.300}',
              active: '{core.colors.neutral.500}',
              disabled: '{core.colors.neutral.200}',
            },
            border: {
              default: '{core.colors.neutral.300}',
              focused: '{core.colors.brand.500}',
              disabled: '{core.colors.neutral.300}',
            },
            text: {
              default: '{core.colors.neutral.900}',
              disabled: '{core.colors.neutral.500}',
            },
          },
        },
        input: {
          primary: {
            background: {
              default: '{core.colors.neutral.200}',
              hover: '{core.colors.neutral.300}',
              disabled: '{core.colors.neutral.100}',
            },
            border: {
              default: '{core.colors.neutral.300}',
              hover: '{core.colors.neutral.500}',
              focused: '{core.colors.brand.500}',
              disabled: '{core.colors.neutral.200}',
            },
            text: {
              default: '{core.colors.neutral.900}',
              disabled: '{core.colors.neutral.500}',
            },
          },
        },
        feedback: {
          positive: {
            background: { default: '{core.colors.neutral.100}' },
            border: { default: '{core.colors.brand.500}' },
            text: { default: '{core.colors.brand.500}' },
          },
        },
        navigation: {
          primary: {
            background: { default: '{core.colors.neutral.200}' },
            border: { default: '{core.colors.neutral.300}' },
            text: {
              default: '{core.colors.neutral.700}',
              current: '{core.colors.brand.500}',
            },
          },
        },
      },
    },
  },
});

/**
 * Neon theme bundle — dark base, single-mode (no light alternate).
 */
export const neonBundle: ThemeBundle = createThemeBundle({
  baseMode: 'dark',
  base: neon,
});
