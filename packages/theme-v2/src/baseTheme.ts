import type { ModeOverride, ThemeTokens } from './Types';

/**
 * **Foundation** — Neutral baseline theme.
 *
 * System fonts, gray palette, and balanced proportions. Serves as the
 * canonical base that all other themes extend via `createTheme`.
 */
export const baseTheme: ThemeTokens = {
  // ==========================================================================
  // CORE TOKENS — raw primitives and responsive engines
  // ==========================================================================
  core: {
    // -- Colors -------------------------------------------------------------
    // Core colors are intent-free primitives. Scale positions only.
    colors: {
      brand: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#60a5fa',
        500: '#0469e3',
        700: '#034da6',
        900: '#022e63',
      },

      neutral: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        500: '#64748b',
        700: '#334155',
        900: '#0f172a',
        1000: '#000000',
      },

      red: {
        100: '#fee2e2',
        300: '#fca5a5',
        500: '#ef4444',
        700: '#b91c1c',
        900: '#7f1d1d',
      },

      orange: {
        100: '#ffedd5',
        300: '#fdba74',
        500: '#f97316',
        700: '#c2410c',
        900: '#7c2d12',
      },

      green: {
        100: '#dcfce7',
        300: '#86efac',
        500: '#22c55e',
        700: '#15803d',
        900: '#14532d',
      },

      yellow: {
        100: '#fef9c3',
        300: '#fde047',
        500: '#eab308',
        700: '#a16207',
        900: '#713f12',
      },

      teal: {
        100: '#ccfbf1',
        300: '#5eead4',
        500: '#14b8a6',
        700: '#0f766e',
        900: '#134e4a',
      },

      purple: {
        100: '#f3e8ff',
        300: '#d8b4fe',
        500: '#a855f7',
        700: '#7e22ce',
        900: '#581c87',
      },

      pink: {
        100: '#fce7f3',
        300: '#f9a8d4',
        500: '#ec4899',
        700: '#be185d',
        900: '#831843',
      },
    },

    // -- Elevation ----------------------------------------------------------
    elevation: {
      level: {
        0: 'none',
        1: '0 1px 2px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.04)',
        2: '0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
        3: '0 8px 16px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.08)',
        4: '0 16px 32px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.10)',
      },
      // High-opacity recipes — stronger depth contrast for dark or heavily-colored surfaces
      emphatic: {
        0: 'none',
        1: '0 1px 2px rgba(0,0,0,0.20), 0 1px 1px rgba(0,0,0,0.14)',
        2: '0 4px 8px rgba(0,0,0,0.24), 0 2px 4px rgba(0,0,0,0.18)',
        3: '0 8px 16px rgba(0,0,0,0.28), 0 4px 8px rgba(0,0,0,0.22)',
        4: '0 16px 32px rgba(0,0,0,0.34), 0 8px 16px rgba(0,0,0,0.28)',
      },
    },

    // -- Font Primitives ----------------------------------------------------
    font: {
      family: {
        sans: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },

      weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },

      leading: {
        tight: 1.15,
        snug: 1.25,
        normal: 1.5,
        relaxed: 1.7,
      },

      tracking: {
        tight: '-0.02em',
        normal: '0em',
        wide: '0.04em',
      },

      optical: {
        auto: 'auto',
        none: 'none',
      },

      numeric: {
        proportional: 'proportional-nums',
        tabular: 'tabular-nums',
      },

      // -- Font Size Scale (Responsive Engine) --------------------------------
      scale: {
        text: {
          1: 'clamp(12px, calc(0.6cqi + 10px), 14px)',
          2: 'clamp(14px, calc(0.7cqi + 11px), 16px)',
          3: 'clamp(16px, calc(0.8cqi + 12px), 18px)',
          4: 'clamp(18px, calc(0.9cqi + 13px), 20px)',
          5: 'clamp(20px, calc(1.0cqi + 14px), 24px)',
          6: 'clamp(24px, calc(1.2cqi + 16px), 28px)',
        },

        display: {
          1: 'clamp(20px, calc(1.2cqi + 16px), 28px)',
          2: 'clamp(24px, calc(1.4cqi + 18px), 32px)',
          3: 'clamp(28px, calc(1.6cqi + 20px), 40px)',
          4: 'clamp(32px, calc(1.8cqi + 22px), 48px)',
          5: 'clamp(40px, calc(2.2cqi + 26px), 64px)',
          6: 'clamp(48px, calc(2.6cqi + 30px), 80px)',
        },
      },
    },

    // -- Spacing (Responsive Engine) ----------------------------------------
    spacing: {
      engine: {
        unit: 'clamp(4px, 0.5cqi + 2px, 8px)',
      },

      0: '0px',
      1: 'calc(1 * var(--tt-core-spacing-engine-unit))',
      2: 'calc(2 * var(--tt-core-spacing-engine-unit))',
      3: 'calc(3 * var(--tt-core-spacing-engine-unit))',
      4: 'calc(4 * var(--tt-core-spacing-engine-unit))',
      6: 'calc(6 * var(--tt-core-spacing-engine-unit))',
      8: 'calc(8 * var(--tt-core-spacing-engine-unit))',
      12: 'calc(12 * var(--tt-core-spacing-engine-unit))',
      16: 'calc(16 * var(--tt-core-spacing-engine-unit))',
    },

    // -- Sizing (Responsive Engine) -----------------------------------------
    sizing: {
      ramp: {
        ui: {
          1: 'clamp(12px, 0.6cqi + 10px, 16px)',
          2: 'clamp(14px, 0.8cqi + 11px, 20px)',
          3: 'clamp(16px, 1.0cqi + 12px, 24px)',
          4: 'clamp(20px, 1.2cqi + 14px, 32px)',
          5: 'clamp(24px, 1.5cqi + 16px, 40px)',
          6: 'clamp(32px, 1.8cqi + 20px, 56px)',
          7: 'clamp(40px, 2.2cqi + 24px, 72px)',
          8: 'clamp(48px, 2.6cqi + 28px, 96px)',
        },
        layout: {
          1: 'clamp(320px, 40cqi, 480px)',
          2: 'clamp(384px, 50cqi, 640px)',
          3: 'clamp(480px, 60cqi, 800px)',
          4: 'clamp(560px, 70cqi, 960px)',
          5: 'clamp(640px, 80cqi, 1120px)',
          6: 'clamp(768px, 90cqi, 1280px)',
        },
      },

      relative: { em: '1em', rem: '1rem' },

      behavior: {
        auto: 'auto',
        full: '100%',
        fit: 'fit-content',
        min: 'min-content',
        max: 'max-content',
      },

      viewport: {
        height: {
          full: '100dvh',
        },
        width: {
          full: '100dvw',
        },
      },

      hit: {
        fine: { min: '28px', base: '40px', prominent: '48px' },
        coarse: { min: '44px', base: '48px', prominent: '56px' },
      },
    },

    // -- Radii --------------------------------------------------------------
    radii: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      full: '9999px',
    },

    // -- Borders ------------------------------------------------------------
    border: {
      width: {
        none: '0px',
        default: '1px',
        selected: '2px',
        focused: '2px',
      },
      style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
        none: 'none',
      },
    },

    // -- Opacity ------------------------------------------------------------
    opacity: {
      100: 1.0,
      75: 0.75,
      50: 0.5,
      25: 0.25,
      0: 0.0,
    },

    // -- Motion -------------------------------------------------------------
    motion: {
      duration: {
        none: '0ms',
        xs: '50ms',
        sm: '100ms',
        md: '200ms',
        lg: '300ms',
        xl: '500ms',
      },
      easing: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        enter: 'cubic-bezier(0, 0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0, 1, 1)',
        linear: 'linear',
      },
    },

    // -- Z-Index ------------------------------------------------------------
    zIndex: {
      level: {
        0: 0,
        1: 100,
        2: 200,
        3: 300,
        4: 400,
      },
    },

    // -- Breakpoints --------------------------------------------------------
    breakpoints: {
      sm: '30rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
    },
  },

  // ==========================================================================
  // SEMANTIC TOKENS — stable aliases consumed by components
  //
  // Semantic tokens reference core tokens only.
  // No raw values are allowed in this layer.
  // ==========================================================================
  semantic: {
    // -- Colors -------------------------------------------------------------
    // Grammar: {ux}.{role}.{dimension}.{state?}
    // Components consume semantic colors only. Core colors are never referenced directly.
    colors: {
      // Grammar: {ux}.{role}.{dimension}.{state?}
      // States are only defined when they produce a VALUE DIFFERENT from the
      // default state in that dimension. Hover/active/focused/selected/current
      // that resolve to the same color as default are intentionally omitted —
      // a token that looks identical to default is semantically invisible.
      //
      // Checked pairs enforced by the distinguishability test:
      //   hover, active, focused, selected, current → must differ from default
      // Other states (disabled, droptarget, pressed, expanded, checked,
      //   indeterminate, visited) may match default when semantically justified.
      action: {
        primary: {
          // brand.500 background, brand.500 border, neutral.0 text
          background: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.700}',
            active: '{core.colors.brand.900}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.700}',
            droptarget: '{core.colors.brand.100}',
            pressed: '{core.colors.brand.900}',
            expanded: '{core.colors.brand.700}',
            // focused: omitted — action focus ring is shown via border, not background
          },
          border: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.700}',
            active: '{core.colors.brand.900}',
            focused: '{core.colors.brand.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.700}',
            pressed: '{core.colors.brand.900}',
            expanded: '{core.colors.brand.700}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            // On droptarget background (brand.100 = light blue), dark text is required
            droptarget: '{core.colors.neutral.900}',
            // hover/active/focused/selected/pressed/expanded: all neutral.0 — omitted
          },
        },
        secondary: {
          // neutral.100 background, neutral.300 border, neutral.900 text
          background: {
            default: '{core.colors.neutral.100}',
            hover: '{core.colors.neutral.200}',
            active: '{core.colors.neutral.300}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.300}',
            droptarget: '{core.colors.neutral.50}',
            pressed: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.200}',
          },
          border: {
            default: '{core.colors.neutral.300}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.500}',
            pressed: '{core.colors.neutral.500}',
            expanded: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            // hover/active/focused/selected: all neutral.900 — omitted
          },
        },
        negative: {
          // red.500 background, red.500 border, neutral.0 text
          background: {
            default: '{core.colors.red.500}',
            hover: '{core.colors.red.700}',
            active: '{core.colors.red.900}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.red.700}',
            droptarget: '{core.colors.red.100}',
            pressed: '{core.colors.red.900}',
            expanded: '{core.colors.red.700}',
          },
          border: {
            default: '{core.colors.red.500}',
            hover: '{core.colors.red.700}',
            active: '{core.colors.red.900}',
            focused: '{core.colors.red.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.red.700}',
            pressed: '{core.colors.red.900}',
            expanded: '{core.colors.red.700}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            droptarget: '{core.colors.neutral.900}',
          },
        },
        muted: {
          // neutral.0 background, neutral.200 border, neutral.700 text
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.50}',
            pressed: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.500}',
            pressed: '{core.colors.neutral.300}',
            expanded: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.900}',
            active: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            selected: '{core.colors.neutral.900}',
            pressed: '{core.colors.neutral.900}',
            expanded: '{core.colors.neutral.900}',
          },
        },
      },

      input: {
        primary: {
          // neutral.0 background, neutral.300 border, neutral.900 text
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.50}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.brand.50}',
            droptarget: '{core.colors.neutral.50}',
            checked: '{core.colors.brand.500}',
            indeterminate: '{core.colors.brand.300}',
            pressed: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
            // focused: omitted — focus shown via border ring, background unchanged
          },
          border: {
            default: '{core.colors.neutral.300}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.brand.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.500}',
            checked: '{core.colors.brand.500}',
            indeterminate: '{core.colors.brand.300}',
            pressed: '{core.colors.neutral.500}',
            expanded: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
            // brand.300 (indeterminate bg) is light — use dark text for contrast
            indeterminate: '{core.colors.neutral.900}',
            // hover/active/focused/selected: all neutral.900 — omitted
          },
        },
        negative: {
          background: {
            default: '{core.colors.red.100}',
            disabled: '{core.colors.neutral.100}',
            // red.700 (not red.500) so neutral.0 text meets 4.5:1 AA contrast
            checked: '{core.colors.red.700}',
            indeterminate: '{core.colors.red.300}',
          },
          border: {
            default: '{core.colors.red.500}',
            active: '{core.colors.red.700}',
            focused: '{core.colors.red.700}',
            disabled: '{core.colors.neutral.200}',
            indeterminate: '{core.colors.red.300}',
            pressed: '{core.colors.red.700}',
            expanded: '{core.colors.red.700}',
          },
          text: {
            default: '{core.colors.red.700}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
          },
        },
        positive: {
          background: {
            default: '{core.colors.green.100}',
            disabled: '{core.colors.neutral.100}',
            // green.700 (not green.500) so neutral.0 text meets 4.5:1 AA contrast
            checked: '{core.colors.green.700}',
            indeterminate: '{core.colors.green.300}',
          },
          border: {
            default: '{core.colors.green.500}',
            active: '{core.colors.green.700}',
            focused: '{core.colors.green.700}',
            disabled: '{core.colors.neutral.200}',
            indeterminate: '{core.colors.green.300}',
            pressed: '{core.colors.green.700}',
            expanded: '{core.colors.green.700}',
          },
          text: {
            default: '{core.colors.green.700}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
          },
        },
        caution: {
          background: {
            default: '{core.colors.yellow.100}',
            disabled: '{core.colors.neutral.100}',
            checked: '{core.colors.yellow.500}',
            indeterminate: '{core.colors.yellow.300}',
          },
          border: {
            default: '{core.colors.yellow.500}',
            active: '{core.colors.yellow.700}',
            focused: '{core.colors.yellow.700}',
            disabled: '{core.colors.neutral.200}',
            indeterminate: '{core.colors.yellow.300}',
            pressed: '{core.colors.yellow.700}',
            expanded: '{core.colors.yellow.700}',
          },
          text: {
            default: '{core.colors.yellow.900}',
            disabled: '{core.colors.neutral.500}',
            // yellow.500 is light — dark text required for 4.5:1 AA
            checked: '{core.colors.neutral.900}',
          },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.100}',
            active: '{core.colors.neutral.200}',
            selected: '{core.colors.neutral.200}',
            checked: '{core.colors.neutral.500}',
            indeterminate: '{core.colors.neutral.300}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.500}',
            indeterminate: '{core.colors.neutral.300}',
            pressed: '{core.colors.neutral.500}',
            expanded: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
          },
        },
      },

      content: {
        primary: {
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.brand.50}',
            droptarget: '{core.colors.brand.50}',
            visited: '{core.colors.neutral.50}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.brand.300}',
            droptarget: '{core.colors.brand.300}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            visited: '{core.colors.neutral.700}',
          },
        },
        secondary: {
          background: {
            default: '{core.colors.neutral.50}',
            hover: '{core.colors.neutral.100}',
            active: '{core.colors.neutral.200}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.brand.50}',
            droptarget: '{core.colors.neutral.100}',
            visited: '{core.colors.neutral.100}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.brand.300}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            // neutral.700 (not neutral.500) to meet 4.5:1 AA on neutral.100 background
            visited: '{core.colors.neutral.700}',
          },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.100}',
            hover: '{core.colors.neutral.200}',
            active: '{core.colors.neutral.300}',
            selected: '{core.colors.neutral.200}',
            droptarget: '{core.colors.neutral.200}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            selected: '{core.colors.neutral.500}',
          },
          text: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.300}',
            selected: '{core.colors.neutral.700}',
            droptarget: '{core.colors.neutral.700}',
          },
        },
        positive: {
          background: {
            default: '{core.colors.green.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.green.300}',
          },
          border: {
            default: '{core.colors.green.500}',
            active: '{core.colors.green.700}',
            focused: '{core.colors.green.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.green.700}',
          },
          text: {
            default: '{core.colors.green.900}',
            disabled: '{core.colors.neutral.500}',
            visited: '{core.colors.green.700}',
          },
        },
        caution: {
          background: {
            default: '{core.colors.yellow.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.yellow.300}',
          },
          border: {
            default: '{core.colors.yellow.500}',
            active: '{core.colors.yellow.700}',
            focused: '{core.colors.yellow.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.yellow.700}',
          },
          text: {
            default: '{core.colors.yellow.900}',
            disabled: '{core.colors.neutral.500}',
            visited: '{core.colors.yellow.700}',
          },
        },
        negative: {
          background: {
            default: '{core.colors.red.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.red.300}',
          },
          border: {
            default: '{core.colors.red.500}',
            active: '{core.colors.red.700}',
            focused: '{core.colors.red.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.red.700}',
          },
          text: {
            default: '{core.colors.red.900}',
            disabled: '{core.colors.neutral.500}',
            visited: '{core.colors.red.700}',
          },
        },
      },

      feedback: {
        // Feedback is informational — surfaces show state, not interactions.
        // Only default and disabled are defined; hover/active/focused/selected
        // are absent because feedback components are not interactive triggers.
        primary: {
          background: { default: '{core.colors.neutral.50}' },
          border: {
            default: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        muted: {
          background: { default: '{core.colors.neutral.100}' },
          border: {
            default: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        positive: {
          background: { default: '{core.colors.green.100}' },
          border: {
            default: '{core.colors.green.500}',
            focused: '{core.colors.green.700}',
          },
          text: {
            default: '{core.colors.green.900}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        caution: {
          background: { default: '{core.colors.yellow.100}' },
          border: {
            default: '{core.colors.yellow.500}',
            focused: '{core.colors.yellow.700}',
          },
          text: {
            default: '{core.colors.yellow.900}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        negative: {
          background: { default: '{core.colors.red.100}' },
          border: {
            default: '{core.colors.red.500}',
            focused: '{core.colors.red.700}',
          },
          text: {
            default: '{core.colors.red.900}',
            disabled: '{core.colors.neutral.500}',
          },
        },
      },

      navigation: {
        primary: {
          // Dark nav: neutral.900 bg, neutral.700 border, neutral.0 text
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.700}',
            selected: '{core.colors.brand.700}',
            droptarget: '{core.colors.neutral.700}',
            current: '{core.colors.brand.700}',
            visited: '{core.colors.neutral.900}',
            expanded: '{core.colors.neutral.700}',
            // focused: omitted — same as neutral.900 default; ring shown via border
          },
          border: {
            default: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.300}',
            selected: '{core.colors.brand.300}',
            current: '{core.colors.brand.300}',
            // hover active same as default in border → hover omitted
          },
          text: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.500}',
            droptarget: '{core.colors.neutral.100}',
            // neutral.100 (not brand.300) — brand.300 on brand.700 bg fails 4.5:1; neutral.100 gives ~7.4:1
            current: '{core.colors.neutral.100}',
            visited: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.100}',
            // active/focused/selected: all neutral.0 = default — omitted
          },
        },
      },
    },

    // -- Elevation ----------------------------------------------------------
    // Grammar: elevation.surface.{stratum}
    elevation: {
      surface: {
        flat: '{core.elevation.level.0}',
        raised: '{core.elevation.level.2}',
        overlay: '{core.elevation.level.3}',
        blocking: '{core.elevation.level.4}',
      },
    },

    // -- Typography ---------------------------------------------------------
    // Grammar: text.{family}.{step}
    text: {
      display: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.display.5}',
          fontWeight: '{core.font.weight.bold}',
          lineHeight: '{core.font.leading.tight}',
          letterSpacing: '{core.font.tracking.tight}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.display.4}',
          fontWeight: '{core.font.weight.bold}',
          lineHeight: '{core.font.leading.tight}',
          letterSpacing: '{core.font.tracking.tight}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.display.3}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.tight}',
          letterSpacing: '{core.font.tracking.tight}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
      },

      headline: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.display.3}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.display.2}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.display.1}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
      },

      title: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.6}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.5}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.4}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
      },

      body: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.4}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.3}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.2}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
      },

      label: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.3}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.2}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.1}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.wide}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
      },

      code: {
        md: {
          fontFamily: '{core.font.family.mono}',
          fontSize: '{core.font.scale.text.2}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontVariantNumeric: '{core.font.numeric.tabular}',
        },
        sm: {
          fontFamily: '{core.font.family.mono}',
          fontSize: '{core.font.scale.text.1}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontVariantNumeric: '{core.font.numeric.tabular}',
        },
      },
    },

    // -- Spacing ------------------------------------------------------------
    // Grammar: {pattern}.{context}.{step?}
    spacing: {
      inset: {
        control: {
          sm: '{core.spacing.2}',
          md: '{core.spacing.3}',
          lg: '{core.spacing.4}',
        },
        surface: {
          sm: '{core.spacing.3}',
          md: '{core.spacing.4}',
          lg: '{core.spacing.6}',
        },
      },

      gap: {
        stack: {
          xs: '{core.spacing.2}',
          sm: '{core.spacing.3}',
          md: '{core.spacing.4}',
          lg: '{core.spacing.6}',
          xl: '{core.spacing.8}',
        },
        inline: {
          xs: '{core.spacing.1}',
          sm: '{core.spacing.2}',
          md: '{core.spacing.3}',
          lg: '{core.spacing.4}',
          xl: '{core.spacing.6}',
        },
      },

      gutter: {
        page: 'clamp({core.spacing.4}, {core.spacing.6}, {core.spacing.12})',
        section: 'clamp({core.spacing.3}, {core.spacing.4}, {core.spacing.12})',
      },

      separation: {
        interactive: {
          min: 'clamp(8px, {core.spacing.2}, 12px)',
        },
      },
    },

    // -- Sizing -------------------------------------------------------------
    // Grammar: {family}.{stepOrProperty}
    sizing: {
      hit: {
        min: '{core.sizing.hit.fine.min}',
        base: '{core.sizing.hit.fine.base}',
        prominent: '{core.sizing.hit.fine.prominent}',
      },
      icon: {
        sm: '{core.sizing.ramp.ui.2}',
        md: '{core.sizing.ramp.ui.3}',
        lg: '{core.sizing.ramp.ui.4}',
      },
      identity: {
        sm: '{core.sizing.ramp.ui.5}',
        md: '{core.sizing.ramp.ui.6}',
        lg: '{core.sizing.ramp.ui.7}',
        xl: '{core.sizing.ramp.ui.8}',
      },
      measure: {
        reading: 'clamp(45ch, 60ch, 75ch)',
      },
      surface: {
        maxWidth: '{core.sizing.ramp.layout.5}',
      },
      viewport: {
        height: {
          full: '{core.sizing.viewport.height.full}',
        },
        width: {
          full: '{core.sizing.viewport.width.full}',
        },
      },
    },

    // -- Radii --------------------------------------------------------------
    radii: {
      control: '{core.radii.md}',
      surface: '{core.radii.lg}',
      round: '{core.radii.full}',
    },

    // -- Borders ------------------------------------------------------------
    border: {
      divider: {
        width: '{core.border.width.default}',
        style: '{core.border.style.solid}',
      },
      outline: {
        surface: {
          width: '{core.border.width.default}',
          style: '{core.border.style.solid}',
        },
        control: {
          width: '{core.border.width.default}',
          style: '{core.border.style.solid}',
        },
      },
      selected: {
        width: '{core.border.width.selected}',
        style: '{core.border.style.solid}',
      },
    },

    // -- Focus --------------------------------------------------------------
    focus: {
      ring: {
        width: '{core.border.width.focused}',
        style: '{core.border.style.solid}',
        color: '{core.colors.brand.700}',
      },
    },

    // -- Opacity ------------------------------------------------------------
    opacity: {
      scrim: '{core.opacity.50}',
      loading: '{core.opacity.50}',
      disabled: '{core.opacity.50}',
    },

    // -- Motion -------------------------------------------------------------
    motion: {
      feedback: {
        duration: '{core.motion.duration.sm}',
        easing: '{core.motion.easing.standard}',
      },
      transition: {
        enter: {
          duration: '{core.motion.duration.md}',
          easing: '{core.motion.easing.enter}',
        },
        exit: {
          duration: '{core.motion.duration.sm}',
          easing: '{core.motion.easing.exit}',
        },
      },
      emphasis: {
        duration: '{core.motion.duration.lg}',
        easing: '{core.motion.easing.standard}',
      },
      decorative: {
        duration: '{core.motion.duration.xl}',
        easing: '{core.motion.easing.linear}',
      },
    },

    // -- Z-Index ------------------------------------------------------------
    zIndex: {
      layer: {
        base: '{core.zIndex.level.0}',
        sticky: '{core.zIndex.level.1}',
        overlay: '{core.zIndex.level.2}',
        blocking: '{core.zIndex.level.3}',
        transient: '{core.zIndex.level.4}',
      },
    },
  },
} satisfies ThemeTokens;

// ---------------------------------------------------------------------------
// Shared semantic dark alternate
//
// Remaps semantic token references to their dark-mode counterparts.
// Core tokens are immutable — only the references change.
// This alternate is shared by all light-first themes since the remapping
// logic is expressed as token paths, not raw values.
// ---------------------------------------------------------------------------

export const darkAlternate: ModeOverride = {
  semantic: {
    colors: {
      action: {
        primary: {
          background: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.300}',
            active: '{core.colors.brand.100}',
            disabled: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.brand.500}',
            focused: '{core.colors.brand.300}',
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        secondary: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.300}',
            disabled: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.100}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            default: '{core.colors.neutral.50}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.300}',
            disabled: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            default: '{core.colors.neutral.50}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        negative: {
          background: {
            disabled: '{core.colors.neutral.700}',
          },
          border: {
            disabled: '{core.colors.neutral.700}',
          },
        },
      },
      input: {
        primary: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            disabled: '{core.colors.neutral.900}',
          },
          border: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        negative: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.red.500}' },
          text: { default: '{core.colors.red.300}' },
        },
        positive: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.green.500}' },
          text: { default: '{core.colors.green.300}' },
        },
        caution: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.yellow.500}' },
          text: { default: '{core.colors.yellow.300}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.700}' },
          border: {
            default: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.300}',
            selected: '{core.colors.neutral.300}',
          },
          text: { default: '{core.colors.neutral.300}' },
        },
      },
      content: {
        primary: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.neutral.700}' },
          text: { default: '{core.colors.neutral.0}' },
        },
        secondary: {
          background: { default: '{core.colors.neutral.700}' },
          border: { default: '{core.colors.neutral.700}' },
          text: { default: '{core.colors.neutral.50}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.500}' },
          border: { default: '{core.colors.neutral.700}' },
          text: { default: '{core.colors.neutral.300}' },
        },
        positive: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.green.500}' },
          text: { default: '{core.colors.green.300}' },
        },
        caution: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.yellow.500}' },
          text: { default: '{core.colors.yellow.300}' },
        },
        negative: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.red.500}' },
          text: { default: '{core.colors.red.300}' },
        },
      },
      feedback: {
        primary: {
          background: { default: '{core.colors.neutral.700}' },
          border: { default: '{core.colors.neutral.500}' },
          text: { default: '{core.colors.neutral.0}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.700}' },
          border: { default: '{core.colors.neutral.500}' },
          text: { default: '{core.colors.neutral.300}' },
        },
        positive: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.green.500}' },
          text: { default: '{core.colors.green.300}' },
        },
        caution: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.yellow.500}' },
          text: { default: '{core.colors.yellow.300}' },
        },
        negative: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.red.500}' },
          text: { default: '{core.colors.red.300}' },
        },
      },
    },
    elevation: {
      surface: {
        flat: '{core.elevation.emphatic.0}',
        raised: '{core.elevation.emphatic.2}',
        overlay: '{core.elevation.emphatic.3}',
        blocking: '{core.elevation.emphatic.4}',
      },
    },
  },
};
