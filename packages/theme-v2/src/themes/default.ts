import type { SemanticModeOverride, ThemeTokensV2 } from '../Types';

/**
 * **Default** — Neutral baseline theme.
 *
 * System fonts, gray palette, and balanced proportions. Serves as the
 * canonical base that all other themes extend via `createTheme`.
 */
export const defaultTheme: ThemeTokensV2 = {
  // ==========================================================================
  // CORE TOKENS — raw primitives and responsive engines
  // ==========================================================================
  core: {
    // -- Colors -------------------------------------------------------------
    // Core colors are intent-free primitives. Scale positions only.
    colors: {
      brand: {
        100: '#DBEAFE',
        300: '#60A5FA',
        500: '#0469E3',
        700: '#034DA6',
        900: '#022E63',
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
      // Dark-optimized recipes — higher opacity shadows for dark surfaces
      dark: {
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

      opticalSizing: {
        auto: 'auto',
        none: 'none',
      },

      numeric: {
        proportional: 'proportional-nums',
        tabular: 'tabular-nums',
      },
    },

    // -- Typography Size Ramps (Responsive Engine) --------------------------
    type: {
      ramp: {
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
    space: {
      unit: 'clamp(4px, 0.5cqi + 2px, 8px)',

      0: '0px',
      1: 'calc(1 * var(--tt-space-unit))',
      2: 'calc(2 * var(--tt-space-unit))',
      3: 'calc(3 * var(--tt-space-unit))',
      4: 'calc(4 * var(--tt-space-unit))',
      6: 'calc(6 * var(--tt-space-unit))',
      8: 'calc(8 * var(--tt-space-unit))',
      12: 'calc(12 * var(--tt-space-unit))',
      16: 'calc(16 * var(--tt-space-unit))',
    },

    // -- Sizing (Responsive Engine) -----------------------------------------
    size: {
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
        heightFull: '100dvh',
      },

      hit: {
        fine: { min: '28px', default: '40px', prominent: '48px' },
        coarse: { min: '44px', default: '48px', prominent: '56px' },
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
    breakpoint: {
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
      action: {
        primary: {
          background: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.700}',
            active: '{core.colors.brand.900}',
            disabled: '{core.colors.neutral.200}',
          },
          border: {
            default: '{core.colors.brand.500}',
            focused: '{core.colors.brand.700}',
            disabled: '{core.colors.neutral.200}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        secondary: {
          background: {
            default: '{core.colors.neutral.100}',
            hover: '{core.colors.neutral.200}',
            active: '{core.colors.neutral.300}',
            disabled: '{core.colors.neutral.100}',
          },
          border: {
            default: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
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
            disabled: '{core.colors.neutral.200}',
          },
          border: {
            default: '{core.colors.red.500}',
            focused: '{core.colors.red.700}',
            disabled: '{core.colors.neutral.200}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.500}',
          },
        },
      },

      input: {
        primary: {
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
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
        negative: {
          background: { default: '{core.colors.red.100}' },
          border: {
            default: '{core.colors.red.500}',
            focused: '{core.colors.red.700}',
          },
          text: { default: '{core.colors.red.700}' },
        },
        positive: {
          background: { default: '{core.colors.green.100}' },
          border: { default: '{core.colors.green.500}' },
          text: { default: '{core.colors.green.700}' },
        },
        caution: {
          background: { default: '{core.colors.yellow.100}' },
          border: { default: '{core.colors.yellow.500}' },
          text: { default: '{core.colors.yellow.900}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.100}' },
          border: { default: '{core.colors.neutral.200}' },
          text: { default: '{core.colors.neutral.700}' },
        },
      },

      content: {
        primary: {
          background: { default: '{core.colors.neutral.0}' },
          border: { default: '{core.colors.neutral.200}' },
          text: { default: '{core.colors.neutral.900}' },
        },
        secondary: {
          background: { default: '{core.colors.neutral.50}' },
          border: { default: '{core.colors.neutral.200}' },
          text: { default: '{core.colors.neutral.700}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.100}' },
          border: { default: '{core.colors.neutral.200}' },
          text: { default: '{core.colors.neutral.500}' },
        },
      },

      feedback: {
        primary: {
          background: { default: '{core.colors.neutral.50}' },
          border: { default: '{core.colors.neutral.300}' },
          text: { default: '{core.colors.neutral.900}' },
        },
        positive: {
          background: { default: '{core.colors.green.100}' },
          border: { default: '{core.colors.green.500}' },
          text: { default: '{core.colors.green.900}' },
        },
        caution: {
          background: { default: '{core.colors.yellow.100}' },
          border: { default: '{core.colors.yellow.500}' },
          text: { default: '{core.colors.yellow.900}' },
        },
        negative: {
          background: { default: '{core.colors.red.100}' },
          border: { default: '{core.colors.red.500}' },
          text: { default: '{core.colors.red.900}' },
        },
      },

      navigation: {
        primary: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.neutral.700}' },
          text: {
            default: '{core.colors.neutral.0}',
            current: '{core.colors.brand.300}',
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
        modal: '{core.elevation.level.4}',
      },
    },

    // -- Typography ---------------------------------------------------------
    // Grammar: text.{family}.{step}
    text: {
      display: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.display.5}',
          fontWeight: '{core.font.weight.bold}',
          lineHeight: '{core.font.leading.tight}',
          letterSpacing: '{core.font.tracking.tight}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.display.4}',
          fontWeight: '{core.font.weight.bold}',
          lineHeight: '{core.font.leading.tight}',
          letterSpacing: '{core.font.tracking.tight}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.display.3}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.tight}',
          letterSpacing: '{core.font.tracking.tight}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
      },

      headline: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.display.3}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.display.2}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.display.1}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
      },

      title: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.6}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.5}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.4}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
      },

      body: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.4}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.3}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.2}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
      },

      label: {
        lg: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.3}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.2}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.type.ramp.text.1}',
          fontWeight: '{core.font.weight.medium}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.wide}',
          fontOpticalSizing: '{core.font.opticalSizing.auto}',
        },
      },

      code: {
        md: {
          fontFamily: '{core.font.family.mono}',
          fontSize: '{core.type.ramp.text.2}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.normal}',
          letterSpacing: '{core.font.tracking.normal}',
          fontVariantNumeric: '{core.font.numeric.tabular}',
        },
        sm: {
          fontFamily: '{core.font.family.mono}',
          fontSize: '{core.type.ramp.text.1}',
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
          sm: '{core.space.2}',
          md: '{core.space.3}',
          lg: '{core.space.4}',
        },
        surface: {
          sm: '{core.space.3}',
          md: '{core.space.4}',
          lg: '{core.space.6}',
        },
      },

      gap: {
        stack: {
          xs: '{core.space.2}',
          sm: '{core.space.3}',
          md: '{core.space.4}',
          lg: '{core.space.6}',
          xl: '{core.space.8}',
        },
        inline: {
          xs: '{core.space.1}',
          sm: '{semantic.spacing.gap.stack.xs}',
          md: '{semantic.spacing.gap.stack.sm}',
          lg: '{semantic.spacing.gap.stack.md}',
        },
      },

      gutter: {
        page: 'clamp({core.space.4}, {core.space.6}, {core.space.12})',
        section: 'clamp({core.space.3}, {core.space.4}, {core.space.12})',
      },

      separation: {
        interactive: {
          min: 'clamp(8px, {core.space.2}, 12px)',
        },
      },
    },

    // -- Sizing -------------------------------------------------------------
    // Grammar: {family}.{stepOrProperty}
    sizing: {
      hit: {
        min: '{core.size.hit.fine.min}',
        default: '{core.size.hit.fine.default}',
        prominent: '{core.size.hit.fine.prominent}',
      },
      icon: {
        sm: '{core.size.ramp.ui.2}',
        md: '{core.size.ramp.ui.3}',
        lg: '{core.size.ramp.ui.4}',
      },
      identity: {
        sm: '{core.size.ramp.ui.5}',
        md: '{core.size.ramp.ui.6}',
        lg: '{core.size.ramp.ui.7}',
        xl: '{core.size.ramp.ui.8}',
      },
      measure: {
        reading: 'clamp(45ch, 60ch, 75ch)',
      },
      surface: {
        maxWidth: '{core.size.ramp.layout.5}',
      },
      viewport: {
        height: {
          full: '{core.size.viewport.heightFull}',
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
      },
    },

    // -- Opacity ------------------------------------------------------------
    opacity: {
      scrim: '{core.opacity.50}',
      loading: '{core.opacity.50}',
      disabledMedia: '{core.opacity.50}',
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
        modal: '{core.zIndex.level.3}',
        transient: '{core.zIndex.level.4}',
      },
    },
  },
} satisfies ThemeTokensV2;

// ---------------------------------------------------------------------------
// Shared semantic dark alternate
//
// Remaps semantic token references to their dark-mode counterparts.
// Core tokens are immutable — only the references change.
// This alternate is shared by all light-first themes since the remapping
// logic is expressed as token paths, not raw values.
// ---------------------------------------------------------------------------

export const semanticDarkAlternate: SemanticModeOverride = {
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
          border: { default: '{core.colors.neutral.500}' },
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
      },
      feedback: {
        primary: {
          background: { default: '{core.colors.neutral.700}' },
          border: { default: '{core.colors.neutral.500}' },
          text: { default: '{core.colors.neutral.0}' },
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
      navigation: {
        primary: {
          background: { default: '{core.colors.neutral.900}' },
          border: { default: '{core.colors.neutral.700}' },
          text: {
            default: '{core.colors.neutral.0}',
            current: '{core.colors.brand.300}',
          },
        },
      },
    },
    elevation: {
      surface: {
        flat: '{core.elevation.dark.0}',
        raised: '{core.elevation.dark.2}',
        overlay: '{core.elevation.dark.3}',
        modal: '{core.elevation.dark.4}',
      },
    },
  },
};

/**
 * @deprecated Use `semanticDarkAlternate` instead.
 * Kept for backward-compat during migration.
 */
export { semanticDarkAlternate as defaultDark };
