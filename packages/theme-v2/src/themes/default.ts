import type { ThemeTokensV2 } from '../ThemeTokensTemplate';

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
    colors: {
      brand: {
        main: '#292C2a',
        complimentary: '#f4f3f3',
        accent: '#0469E3',
        darkNeutral: '#325C82',
        lightNeutral: '#F8F8F8',
      },

      neutral: {
        white: '#ffffff',
        gray50: '#f8fafc',
        gray100: '#f1f5f9',
        gray200: '#e2e8f0',
        gray300: '#cbd5e1',
        gray500: '#64748b',
        gray700: '#334155',
        gray900: '#0f172a',
        black: '#000000',
      },

      red: {
        100: '#ffebeb',
        200: '#fdbfbf',
        300: '#f99595',
        400: '#f56c6c',
        500: '#ef4444',
        600: '#e42828',
        700: '#c62121',
      },
    },

    // -- Elevation ----------------------------------------------------------
    elevation: {
      level: {
        0: 'none',
        1: '0 1px 2px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.03)',
        2: '0 3px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
        3: '0 6px 12px rgba(0,0,0,0.07), 0 3px 6px rgba(0,0,0,0.05)',
        4: '0 12px 24px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.06)',
        5: '0 24px 48px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.08)',
      },
    },

    // -- Font Primitives ----------------------------------------------------
    font: {
      family: {
        sans: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
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
        widthFull: '100vw',
      },
    },

    // -- Radii --------------------------------------------------------------
    radii: {
      none: '0px',
      xs: '2px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },

    // -- Borders ------------------------------------------------------------
    borders: {
      width: {
        0: '0',
        hairline: '1px',
        sm: '2px',
        md: '4px',
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
        xs: '50ms',
        sm: '100ms',
        md: '200ms',
        lg: '300ms',
        xl: '500ms',
      },
      easing: {
        standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
        linear: 'cubic-bezier(0.0, 0.0, 1.0, 1.0)',
      },
    },

    // -- Z-Index ------------------------------------------------------------
    zIndex: {
      base: 0,
      dropdown: 10,
      sticky: 20,
      overlay: 30,
      modal: 40,
      toast: 50,
      tooltip: 60,
    },

    // -- Breakpoints --------------------------------------------------------
    breakpoints: {
      xs: '320px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
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
    colors: {
      action: {
        primary: {
          background: { default: '{core.colors.brand.accent}' },
          border: { default: '{core.colors.brand.accent}' },
          text: { default: '{core.colors.neutral.white}' },
        },
        secondary: {
          background: { default: '{core.colors.neutral.gray100}' },
          border: { default: '{core.colors.neutral.gray300}' },
          text: { default: '{core.colors.brand.darkNeutral}' },
        },
        negative: {
          background: { default: '{core.colors.red.500}' },
          border: { default: '{core.colors.red.600}' },
          text: { default: '{core.colors.neutral.white}' },
        },
        positive: {
          background: { default: '{core.colors.brand.accent}' },
          border: { default: '{core.colors.brand.accent}' },
          text: { default: '{core.colors.neutral.white}' },
        },
      },

      input: {
        primary: {
          background: { default: '{core.colors.neutral.white}' },
          border: {
            default: '{core.colors.neutral.gray300}',
            focused: '{core.colors.brand.accent}',
          },
          text: { default: '{core.colors.neutral.gray900}' },
        },
        negative: {
          background: { default: '{core.colors.red.100}' },
          border: { default: '{core.colors.red.500}' },
          text: { default: '{core.colors.red.700}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.gray100}' },
          border: { default: '{core.colors.neutral.gray200}' },
          text: { default: '{core.colors.neutral.gray500}' },
        },
      },

      content: {
        primary: {
          background: { default: '{core.colors.neutral.white}' },
          border: { default: '{core.colors.neutral.gray200}' },
          text: { default: '{core.colors.neutral.gray900}' },
        },
        secondary: {
          background: { default: '{core.colors.neutral.gray50}' },
          border: { default: '{core.colors.neutral.gray200}' },
          text: { default: '{core.colors.neutral.gray700}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.gray100}' },
          border: { default: '{core.colors.neutral.gray200}' },
          text: { default: '{core.colors.neutral.gray500}' },
        },
      },

      feedback: {
        negative: {
          background: { default: '{core.colors.red.100}' },
          border: { default: '{core.colors.red.500}' },
          text: { default: '{core.colors.red.700}' },
        },
        positive: {
          background: { default: '{core.colors.brand.lightNeutral}' },
          border: { default: '{core.colors.brand.accent}' },
          text: { default: '{core.colors.brand.darkNeutral}' },
        },
        caution: {
          background: { default: '{core.colors.neutral.gray100}' },
          border: { default: '{core.colors.neutral.gray500}' },
          text: { default: '{core.colors.neutral.gray900}' },
        },
      },

      navigation: {
        primary: {
          background: { default: '{core.colors.brand.main}' },
          border: { default: '{core.colors.brand.main}' },
          text: {
            default: '{core.colors.brand.complimentary}',
            current: '{core.colors.brand.accent}',
          },
        },
      },
    },

    // -- Elevation ----------------------------------------------------------
    // Grammar: elevation.{context}
    elevation: {
      flat: '{core.elevation.level.0}',
      resting: '{core.elevation.level.2}',
      raised: '{core.elevation.level.3}',
      overlay: '{core.elevation.level.3}',
      modal: '{core.elevation.level.4}',
      top: '{core.elevation.level.5}',
      dragged: '{core.elevation.level.5}',
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
        page: '{core.space.6}',
        section: '{core.space.4}',
      },

      separation: {
        interactive: {
          min: '{core.space.2}',
        },
      },
    },

    // -- Sizing -------------------------------------------------------------
    // Grammar: {family}.{stepOrProperty}
    sizing: {
      hit: {
        min: '44px',
        default: '48px',
        prominent: '56px',
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
      surface: '{core.radii.md}',
      control: '{core.radii.sm}',
      pill: '{core.radii.full}',
      avatar: '{core.radii.full}',
      toast: '{core.radii.md}',
    },

    // -- Borders ------------------------------------------------------------
    border: {
      divider: {
        width: '{core.borders.width.hairline}',
        style: '{core.borders.style.solid}',
      },
      outline: {
        width: '{core.borders.width.sm}',
        style: '{core.borders.style.solid}',
      },
      focus: {
        width: '{core.borders.width.md}',
        style: '{core.borders.style.solid}',
      },
      input: {
        width: '{core.borders.width.hairline}',
        style: '{core.borders.style.solid}',
      },
    },

    // -- Opacity ------------------------------------------------------------
    opacity: {
      overlay: {
        backdrop: { opacity: '{core.opacity.50}' },
        spinner: { opacity: '{core.opacity.75}' },
      },
      feedback: {
        disabled: {
          text: { opacity: '{core.opacity.50}' },
        },
      },
    },

    // -- Motion -------------------------------------------------------------
    motion: {
      feedback: {
        fast: {
          duration: '{core.motion.duration.xs}',
          easing: '{core.motion.easing.standard}',
        },
      },
      navigation: {
        standard: {
          duration: '{core.motion.duration.md}',
          easing: '{core.motion.easing.standard}',
        },
      },
      decorative: {
        slow: {
          duration: '{core.motion.duration.lg}',
          easing: '{core.motion.easing.decelerate}',
        },
      },
    },

    // -- Z-Index ------------------------------------------------------------
    zIndex: {
      navigation: '{core.zIndex.sticky}',
      dropdownMenu: '{core.zIndex.dropdown}',
      modalOverlay: '{core.zIndex.modal}',
      modal: '{core.zIndex.modal}',
      toast: '{core.zIndex.toast}',
    },
  },
} satisfies ThemeTokensV2;
