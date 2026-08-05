/* eslint-disable max-lines */
import type { ModeOverride, ThemeBrief, ThemeTokens } from './Types';

/**
 * **Foundation** — Neutral baseline theme.
 *
 * System fonts, gray palette, and balanced proportions. Serves as the
 * canonical base that all other themes extend via `createTheme`.
 *
 * ## Theme brief
 *
 * Every value in this file is chosen so that the resolved bundle satisfies
 * this brief. Changes that contradict the brief belong in a different theme,
 * not in `baseTheme`.
 *
 * ```yaml
 * name: base
 * purpose: default built-in foundation for modern product UI
 * primaryPosture: productive
 * secondaryPosture: calm
 * densityProfile: balanced
 * readingMode: mixed
 * pointerProfile: hybrid
 * interactionRisk: medium
 * surfaceModel: lightly-layered
 * brandEnergy: quiet
 * accessibilityTarget: AA+
 * colorModeStrategy: dark-supported
 * platformBias: web
 * ```
 *
 * Intended feel: practical, calm, modern, trustworthy, easy to extend.
 * Avoided feel: flashy, ornamental, cramped, fragile, overly branded.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/theme-authoring.md#recommended-base-theme-brief
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
        // Vivid blue — P3 Slice 2, tuned against Adobe Spectrum 2's accent
        // family: one saturated, slightly indigo-leaning blue does all the
        // talking while every neutral stays silent. 500 is the filled-accent
        // surface (4.8:1 with neutral.0 text — AA Normal); 700 doubles as the
        // light-mode focus ring; 300 carries accent text/focus on dark.
        50: '#f5f9ff',
        100: '#e5f0fe',
        200: '#cbe2fe',
        300: '#8eb9fc',
        400: '#5d89ff',
        500: '#3b63fb',
        600: '#274dea',
        700: '#1d3ecf',
        800: '#1532ad',
        900: '#10288c',
      },

      neutral: {
        // Hue-free ramp (R=G=B at every step) — P3 Slice 2, tuned against
        // Adobe Spectrum 2's gray structure: surface steps sit close together
        // (0–300) so layers whisper, then a deliberate legibility gap before
        // the content steps (400+) so text speaks. The zinc ramp this
        // replaces carried a cool cast that read as a navy tint on dark
        // surfaces; pure grays keep every layered surface color-silent.
        0: '#ffffff',
        50: '#f8f8f8',
        100: '#f0f0f0',
        200: '#e1e1e1',
        300: '#d0d0d0',
        400: '#9d9d9d',
        500: '#6f6f6f',
        600: '#525252',
        700: '#3d3d3d',
        // 800 fills the 700→900 gap so dark surfaces can stratify in fine
        // steps (canvas 900 → raised 800 → overlay 700) — depth in dark comes
        // from surfaces lightening as they rise, not from near-invisible
        // shadows. @see elevation.md — "Surface + Shadow".
        800: '#262626',
        900: '#161616',
        1000: '#0a0a0a',
      },

      red: {
        100: '#fee2e2',
        300: '#fca5a5',
        500: '#ef4444',
        // 600 exists so filled negative surfaces can pair with neutral.0 text
        // at WCAG AA Normal (4.83:1) — red.500 on white is only 3.76:1.
        600: '#dc2626',
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
    // Three-layer recipes (P3 Slice 2, Spectrum-derived): a wide low-opacity
    // ambient layer + a soft transition layer + a tight "key" line that keeps
    // the surface edge defined where the ambient blur fades. Softer and more
    // physical than the two-layer stacks they replace.
    elevation: {
      level: {
        0: 'none',
        1: '0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.10)',
        2: '0 2px 8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.08)',
        3: '0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04), 0 0 2px rgba(0,0,0,0.12)',
        4: '0 12px 24px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.06), 0 0 4px rgba(0,0,0,0.12)',
      },
      // High-opacity recipes — stronger depth contrast for dark or
      // heavily-colored surfaces (~3× the base opacities, the same ratio
      // Spectrum applies to its dark drop shadows).
      emphatic: {
        0: 'none',
        1: '0 1px 4px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.30)',
        2: '0 2px 8px rgba(0,0,0,0.24), 0 1px 4px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.24)',
        3: '0 4px 12px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.12), 0 0 2px rgba(0,0,0,0.36)',
        4: '0 12px 24px rgba(0,0,0,0.36), 0 6px 12px rgba(0,0,0,0.18), 0 0 4px rgba(0,0,0,0.36)',
      },
    },

    // -- Font Primitives ----------------------------------------------------
    font: {
      family: {
        sans: '"Inter Variable", Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
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
        lining: 'lining-nums',
        oldstyle: 'oldstyle-nums',
        slashedZero: 'slashed-zero',
        ordinal: 'ordinal',
        normal: 'normal',
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
    // Tuned for medium-high density (mouse-first). The engine caps at 6px
    // — above that, button paddings compound with hit floors and produce
    // visually heavy controls (>48px desktop) that fight modern UI rhythm
    // (Material 40px, GitHub 32–40px, Bootstrap 38px). Touch density is
    // restored automatically via `@media (any-pointer: coarse)` overrides.
    //
    // CSS-coupled tokens (registered in model.md §8 → "CSS-coupled core
    // tokens"):
    //   • `engine.unit` — fluid primitive (`clamp()` + `cqi`); viewport
    //     fallback emitted by `toCssVars`.
    //   • steps 1..16 — cascade-preserving aliases that reference
    //     `--tt-core-spacing-engine-unit` directly so the engine stays a
    //     single point of override. Replacing `var()` with a token ref
    //     would inline `clamp(...cqi...)` into every step and inflate the
    //     `@supports (width: 1cqi)` block. Non-CSS consumers receive the
    //     unresolved expression — see model.md §8.
    spacing: {
      engine: {
        unit: 'clamp(4px, 0.25cqi + 3px, 6px)',
      },

      // The NON-FLUID counterpart of the steps below — plain values, because
      // core is the layer whose job is raw values (model.md §1). It exists so
      // that a semantic token whose *resolved outcome* is the guarantee
      // (`inset.control.*`, ADR-022) has a core step to reference instead of
      // inlining a literal into the semantic layer, which would break "semantic
      // references core only" (§2) and would not satisfy §8's necessity test —
      // a bare constant is always expressible as a `TokenRef` once core holds
      // it. Keys mirror the fluid steps' multipliers and the base theme sets
      // them to the engine's own desktop bound (6px), so a control resolves
      // identically at ≥1200px to the fluid scale it left. A theme may retune
      // them freely; what validation guarantees is the ordering and the fixed
      // shape, never these numbers.
      fixed: {
        1: '6px',
        2: '12px',
        4: '24px',
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
        // `hit` is a single ergonomic FLOOR (min interactive target), never the
        // visual size — the control's height comes from its inset + type, with
        // `hit` guaranteeing the minimum (sizing.md, ADR-020). It is the theme's
        // one lever for the interactive minimum; because it is `rem`-anchored
        // (not `cqi`), a control's height never grows with container width.
        //
        // Fine: clamp(floor, preferred, max) — floor is the fixed ergonomic
        // minimum; preferred scales with rem so user font-size preferences
        // (accessibility) are respected. Tuned desktop-first (mouse) at 32px,
        // matching GitHub/Linear (~32px) and Stripe (~36px); the 24px WCAG 2.2
        // minimum is well exceeded.
        fine: 'clamp(32px, 2rem, 36px)',
        // Coarse: always fixed px — touch ergonomics require a predictable,
        // reliable target. 48px sits above the 44px Apple HIG floor.
        coarse: '48px',
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
      // Agrees with `width.focused` here by choice, not by contract — the two
      // are independent tokens a theme retunes for different reasons.
      offset: {
        focused: '2px',
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
          // neutral.1000 (black) background — authoritative, neutral primary action.
          // Contrast: neutral.0 text on neutral.1000 → ~19.8:1 ✓ ; neutral.900 hover → ~18:1 ✓
          background: {
            default: '{core.colors.neutral.1000}',
            hover: '{core.colors.neutral.900}',
            active: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.200}',
            droptarget: '{core.colors.neutral.100}',
            pressed: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.900}',
            // focused: omitted — action focus ring is shown via border, not background
          },
          border: {
            default: '{core.colors.neutral.1000}',
            hover: '{core.colors.neutral.900}',
            active: '{core.colors.neutral.700}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            pressed: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.900}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            // On droptarget background (neutral.100 = light), dark text is required
            droptarget: '{core.colors.neutral.900}',
            // hover/active/focused/pressed/expanded: all neutral.0 — omitted
          },
        },
        secondary: {
          // neutral.100 background, neutral.300 border, neutral.900 text
          background: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.400}',
            disabled: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.50}',
            // `pressed` is the *persistent* engaged state of a toggle (the
            // only consumer of this state — ToggleButton). A quiet toolbar
            // toggle must read unambiguously ON, so it inverts to a strong
            // neutral fill instead of the mid-grey that reads as another
            // hover. neutral.0 text on neutral.700 → 10.9:1 ✓. Keeping it
            // distinct from `active` (neutral.400) also restores press
            // feedback on an already-engaged toggle.
            pressed: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.200}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.400}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            pressed: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.500}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            // The engaged fill is dark — its label inverts with it.
            pressed: '{core.colors.neutral.0}',
            // Declared in base so the leaf exists for the dark alternate to
            // remap — `vars` mirrors the base shape, so a mode may only remap
            // states, never add them (model.md § Modes; the structural guard
            // in global.test.ts holds this). Here the fill darkens a step on
            // the press and the ink firms with it; in dark the fill inverts
            // to light and this leaf takes the dark ink that keeps the label
            // legible for as long as an anchored overlay holds the press
            // (F-043's 1.45:1).
            active: '{core.colors.neutral.1000}',
            // hover/focused: neutral.900 — omitted
          },
        },
        accent: {
          // brand.500 background — vivid blue that draws attention in the UI.
          // Contrast: neutral.0 text on brand.500 (#3b63fb) → ~4.8:1 ✓ AA
          // All interactive states darken further → neutral.0 text remains valid.
          background: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.700}',
            active: '{core.colors.brand.900}',
            disabled: '{core.colors.neutral.200}',
            droptarget: '{core.colors.brand.50}',
            pressed: '{core.colors.brand.900}',
            expanded: '{core.colors.brand.700}',
          },
          border: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.700}',
            active: '{core.colors.brand.900}',
            focused: '{core.colors.brand.700}',
            disabled: '{core.colors.neutral.200}',
            pressed: '{core.colors.brand.900}',
            expanded: '{core.colors.brand.700}',
          },
          text: {
            // brand.500 is dark enough — neutral.0 meets ≥ 4.5:1 AA on all states
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            droptarget: '{core.colors.neutral.900}',
            // hover/active/pressed/expanded: all neutral.0 — omitted
          },
        },
        negative: {
          // red.600 background, red.600 border, neutral.0 text
          // (red.600 — not 500 — so neutral.0 text meets AA Normal: 4.83:1)
          background: {
            default: '{core.colors.red.600}',
            hover: '{core.colors.red.700}',
            active: '{core.colors.red.900}',
            disabled: '{core.colors.neutral.200}',
            droptarget: '{core.colors.red.100}',
            pressed: '{core.colors.red.900}',
            expanded: '{core.colors.red.700}',
          },
          border: {
            default: '{core.colors.red.600}',
            hover: '{core.colors.red.700}',
            active: '{core.colors.red.900}',
            focused: '{core.colors.red.700}',
            disabled: '{core.colors.neutral.200}',
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
          // The quietest rung of the Action emphasis ladder: the fill *is* the
          // surface it sits on and the border matches it, so the control has no
          // visible edge at rest and materialises on hover. This is the
          // system's idiom for "no fill" — an opaque surface-coloured value,
          // never `transparent`, so every pairing stays contrast-auditable
          // (ADR-015). Giving it a visible border instead made it read as the
          // classic outlined *secondary* of other systems and inverted the
          // perceived order of the ladder.
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.50}',
            pressed: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
          },
          border: {
            // Every state mirrors its background: the edge never appears, the
            // fill carries the whole affordance. `focused` is the exception —
            // it is the one state that must be visible on any surface.
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.100}',
            pressed: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.900}',
            active: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
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
            selected: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.50}',
            checked: '{core.colors.neutral.1000}',
            indeterminate: '{core.colors.neutral.1000}',
            pressed: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
            // invalid: field stays readable — the red signal lives on the border
            invalid: '{core.colors.neutral.0}',
            // focused: omitted — focus shown via border ring, background unchanged
          },
          border: {
            default: '{core.colors.neutral.300}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.neutral.1000}',
            checked: '{core.colors.neutral.1000}',
            indeterminate: '{core.colors.neutral.1000}',
            pressed: '{core.colors.neutral.500}',
            expanded: '{core.colors.neutral.500}',
            // red.600 on neutral.0: 4.83:1 — clears the 3:1 non-text floor
            invalid: '{core.colors.red.600}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
            // invalid: value stays readable in the control; valence text lives
            // on the validationMessage via input.negative.text.*
            invalid: '{core.colors.neutral.900}',
            // indeterminate bg is neutral.1000 — light text for contrast
            indeterminate: '{core.colors.neutral.0}',
            // hover/active/focused/selected: all neutral.900 — omitted
          },
        },
        // Lower-emphasis input field (inline editors, filter pills, optional fields).
        // Mirrors primary controls but uses a lighter chrome — default border is
        // neutral.200 (vs primary's neutral.300) so it recedes until interacted with.
        secondary: {
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.50}',
            checked: '{core.colors.neutral.1000}',
            indeterminate: '{core.colors.neutral.1000}',
            pressed: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.neutral.1000}',
            checked: '{core.colors.neutral.1000}',
            indeterminate: '{core.colors.neutral.1000}',
            pressed: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.500}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
            indeterminate: '{core.colors.neutral.0}',
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
            // The mark resolves indeterminate → checked → default, and
            // `checked`'s neutral.0 belongs to the *filled* red.700 box — on
            // the light red.300 indeterminate fill it lands at 1.9:1. The
            // valence's own dark step keeps the hue and clears AA (F-043).
            indeterminate: '{core.colors.red.900}',
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
            // Same shape as negative: checked's neutral.0 is the filled box's
            // ink; the light green.300 indeterminate fill needs the dark step.
            indeterminate: '{core.colors.green.900}',
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
            expanded: '{core.colors.neutral.500}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.0}',
            // checked's neutral.0 sits on the neutral.500 filled box; the
            // indeterminate fill is neutral.300, where it lands at 1.5:1.
            indeterminate: '{core.colors.neutral.900}',
          },
        },
      },

      informational: {
        primary: {
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.100}',
            visited: '{core.colors.neutral.50}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.400}',
            droptarget: '{core.colors.neutral.400}',
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
            selected: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.100}',
            visited: '{core.colors.neutral.100}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.400}',
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
        accent: {
          // brand.400 bg — louder than primary (brand.500). Outlined/tinted card accent.
          // Follows filled pattern for selected, rest stays light.
          background: {
            default: '{core.colors.brand.50}',
            hover: '{core.colors.brand.100}',
            active: '{core.colors.brand.200}',
            disabled: '{core.colors.neutral.100}',
            // selected uses brand.500 (not brand.400) so neutral.0 text meets
            // AA Normal (≥ 4.5:1). brand.400 on white fails the normal threshold.
            selected: '{core.colors.brand.500}',
          },
          border: {
            default: '{core.colors.brand.400}',
            hover: '{core.colors.brand.500}',
            active: '{core.colors.brand.600}',
            focused: '{core.colors.brand.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.600}',
          },
          text: {
            default: '{core.colors.brand.700}',
            hover: '{core.colors.brand.900}',
            active: '{core.colors.brand.900}',
            disabled: '{core.colors.neutral.500}',
            // selected uses filled bg (brand.500) — neutral.0 meets 4.5:1
            selected: '{core.colors.neutral.0}',
            visited: '{core.colors.brand.700}',
          },
        },
      },

      feedback: {
        // Feedback is informational — surfaces show state, not interactions.
        // Legal states: default | focused (close button or focusable wrapper) | disabled.
        // hover, active, selected, pressed, expanded are absent: FSL §7.
        //
        // Filled language (P3 Slice 3, Spectrum-derived): status surfaces are
        // deep saturated fills with neutral.0 text — confident, mode-stable
        // (the valences hold the same fill in dark; only `primary`/`muted`
        // remap). Every fill clears AA Normal with neutral.0: neutral.800
        // 15.1:1 · green.700 5.0:1 · yellow.700 4.9:1 · red.600 4.8:1.
        // `muted` stays a tinted neutral surface — the quiet chip and the
        // rail/track color for Feedback fills (ProgressBar, Meter).
        primary: {
          background: { default: '{core.colors.neutral.800}' },
          border: {
            default: '{core.colors.neutral.800}',
            focused: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.0}',
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
          background: { default: '{core.colors.green.700}' },
          border: {
            default: '{core.colors.green.700}',
            focused: '{core.colors.green.900}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        caution: {
          background: { default: '{core.colors.yellow.700}' },
          border: {
            default: '{core.colors.yellow.700}',
            focused: '{core.colors.yellow.900}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        negative: {
          background: { default: '{core.colors.red.600}' },
          border: {
            default: '{core.colors.red.600}',
            focused: '{core.colors.red.900}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
        // Informative valence (P3 Slice 3): status that is noteworthy but
        // carries no judgement — "in progress", "new", "info". The brand
        // fill is mode-stable (like action.accent); this is the canonical
        // fill for ProgressBar/Meter activity.
        accent: {
          background: { default: '{core.colors.brand.500}' },
          border: {
            default: '{core.colors.brand.500}',
            focused: '{core.colors.brand.700}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
          },
        },
      },

      navigation: {
        primary: {
          // Inline link on light surfaces: transparent bg, monochrome text +
          // underline (the underline carries the affordance — no hue needed).
          // Contrast: neutral.800 (#262626) on neutral.0 (#ffffff) → ~15:1 ✓
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.0}',
            current: '{core.colors.neutral.50}',
            visited: '{core.colors.neutral.0}',
            expanded: '{core.colors.neutral.50}',
          },
          border: {
            default: '{core.colors.neutral.0}',
            focused: '{core.colors.brand.500}',
            // selected/current carry the tab indicator line — monochrome
            selected: '{core.colors.neutral.1000}',
            current: '{core.colors.neutral.1000}',
          },
          text: {
            default: '{core.colors.neutral.800}',
            hover: '{core.colors.neutral.1000}',
            active: '{core.colors.neutral.1000}',
            disabled: '{core.colors.neutral.500}',
            current: '{core.colors.neutral.1000}',
            visited: '{core.colors.neutral.500}',
            expanded: '{core.colors.neutral.1000}',
          },
        },
        secondary: {
          // Light nav: neutral.50 background, neutral.200 border, neutral.700 text
          background: {
            default: '{core.colors.neutral.50}',
            hover: '{core.colors.neutral.100}',
            active: '{core.colors.neutral.200}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.100}',
            droptarget: '{core.colors.neutral.100}',
            current: '{core.colors.neutral.200}',
            visited: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.100}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.neutral.1000}',
            current: '{core.colors.neutral.1000}',
          },
          text: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            selected: '{core.colors.neutral.1000}',
            current: '{core.colors.neutral.1000}',
            visited: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.900}',
          },
        },
        accent: {
          // Brand accent nav: brand.50 background with brand border — louder than secondary.
          // Targeted use: highlighted/featured nav items.
          background: {
            default: '{core.colors.brand.50}',
            hover: '{core.colors.brand.100}',
            active: '{core.colors.brand.200}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.brand.700}',
            current: '{core.colors.brand.700}',
            expanded: '{core.colors.brand.100}',
          },
          border: {
            default: '{core.colors.brand.400}',
            hover: '{core.colors.brand.500}',
            active: '{core.colors.brand.600}',
            focused: '{core.colors.brand.700}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.brand.700}',
            current: '{core.colors.brand.700}',
          },
          text: {
            default: '{core.colors.brand.700}',
            hover: '{core.colors.brand.900}',
            disabled: '{core.colors.neutral.500}',
            // selected/current use brand.700 bg — neutral.0 meets ≥ 4.5:1
            selected: '{core.colors.neutral.0}',
            current: '{core.colors.neutral.0}',
            visited: '{core.colors.brand.500}',
            expanded: '{core.colors.brand.900}',
          },
        },
        muted: {
          // Subdued nav: transparent / neutral.100 background, none border, neutral.500 text.
          // Used for secondary nav items, breadcrumbs, or inactive sidebar links.
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.50}',
            active: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.100}',
            selected: '{core.colors.neutral.100}',
            current: '{core.colors.neutral.100}',
            expanded: '{core.colors.neutral.50}',
          },
          border: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.200}',
            selected: '{core.colors.neutral.500}',
            // brand.500 (not 400): the current-page indicator must clear the
            // 3:1 non-text floor against the neutral.100 current background.
            current: '{core.colors.brand.500}',
          },
          text: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.300}',
            selected: '{core.colors.neutral.900}',
            current: '{core.colors.brand.700}',
            visited: '{core.colors.neutral.500}',
            expanded: '{core.colors.neutral.700}',
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
      // Tonal surface colour per stratum (the "surface colour at that depth"
      // half of elevation.md's Surface + Shadow rule). In light, a raised
      // surface is the brightest neutral (white) and lift is carried by the
      // shadow; the dark alternate remaps these to progressively lighter
      // neutrals so depth survives where shadows go invisible on a near-black
      // canvas. A surface component reads `tonal` for its background and the
      // paired `surface` recipe for its shadow.
      tonal: {
        raised: '{core.colors.neutral.0}',
        overlay: '{core.colors.neutral.0}',
        blocking: '{core.colors.neutral.0}',
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
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.2}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
        sm: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.1}',
          fontWeight: '{core.font.weight.regular}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.wide}',
          fontOpticalSizing: '{core.font.optical.auto}',
        },
      },

      // Command-trigger text (P3 Slice 3): CTAs carry semibold while `label`
      // sits at regular — the weight-contrast rhythm of reference-grade
      // systems (controls quiet, commands assertive).
      action: {
        md: {
          fontFamily: '{core.font.family.sans}',
          fontSize: '{core.font.scale.text.2}',
          fontWeight: '{core.font.weight.semibold}',
          lineHeight: '{core.font.leading.snug}',
          letterSpacing: '{core.font.tracking.normal}',
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
    //
    // Values are tuned so that the containment order holds at the default
    // ("md" / preferred) step:
    //
    //   inset.control < gap.stack < gutter.section < gutter.page
    //
    // (inset.control is deliberately tight — see below — so it no longer sits
    // above the inline gaps; on a compact control the padding inside it is
    // allowed to be smaller than the gap between separate items.)
    //
    // The hit floor (`core.sizing.hit.fine` ≈ 32–36px) is what makes controls
    // touch-safe and gives them their height — so inset.control is tuned TIGHT
    // (ADR-020): block padding must stay under the floor so `hit` binds and the
    // control resolves to ~32–36px on the desktop, not the ~44–58px the old
    // generous inset produced. Steps stay `core.spacing.*` aliases (the fluid
    // range at these low steps is ±2px — imperceptible, and the height is
    // driven by the rem-anchored `hit` floor, not the inset).
    spacing: {
      inset: {
        // Control insets are OUTCOME-BEARING and therefore fixed (ADR-022,
        // owner ruling 2026-07-29): a control's box is its inset + type with
        // `hit` as the floor, so a fluid inset makes the box fluid — which is
        // exactly what ADR-019/020 rule against, and ADR-020's own premise
        // ("the ±2px residual never binds") was measured false above ~900px
        // (F-035: the field row read 32 / 32.5 / 34 across the range). The
        // values are the engine's own top step (`core.spacing.{1|2|4}` at the
        // desktop bound), so nothing changes visually at ≥1200px; the residual
        // narrow-end step is the fluid type meeting the `hit` floor, which is
        // the floor's job (ADR-020), not an inset ramp.
        // The fixed values live in core (`core.spacing.fixed.*`, the non-fluid
        // step scale) and are referenced here like every other semantic
        // spacing token: ADR-022 rules the *outcome* fixed, and a literal in
        // this layer was the wrong mechanism for it (ADR-023).
        control: {
          sm: '{core.spacing.fixed.1}',
          md: '{core.spacing.fixed.2}',
          lg: '{core.spacing.fixed.4}',
        },
        // inset.surface ≥ inset.control (validation invariant) and sits
        // above gap.stack at the default step so containers visibly enclose
        // their sequential children.
        surface: {
          // The anchored/row-framing step, and the one member of this group
          // that is FIXED: its outcome is the relationship to fixed-height
          // children, so a fluid value would make that relationship
          // container-fluid (ADR-022's argument one context over — see the
          // family type for the measurement). Same core step as
          // `inset.control.sm`, and deliberately so: a gutter beside a control
          // is the control's own step, which is what keeps a menu's
          // edge-to-text distance close to the reference's.
          xs: '{core.spacing.fixed.1}',
          sm: '{core.spacing.4}',
          md: '{core.spacing.6}',
          lg: '{core.spacing.8}',
        },
        // Command triggers breathe a little more on the block axis than a
        // generic control: at the desktop bound the button resolves to
        // 9 + 20 (label line) + 9 + 2 (border) = 40px — the reference
        // systems' comfortable CTA height — while a phone stays at 8px and
        // the coarse-pointer `hit` floor (48px) takes over there anyway.
        // Bounded rather than stepped: one engine step (≈5.6px) is too tight
        // and two (≈11px) overshoot 40px. RawValue rationale mirrors
        // `separation.interactive.min` — see model.md §8.
        action: {
          block: 'clamp(8px, {core.spacing.2}, 9px)',
        },
      },

      gap: {
        stack: {
          xs: '{core.spacing.2}',
          sm: '{core.spacing.4}',
          md: '{core.spacing.6}',
          lg: '{core.spacing.8}',
          xl: '{core.spacing.12}',
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
        page: 'clamp({core.spacing.6}, {core.spacing.12}, {core.spacing.16})',
        section: 'clamp({core.spacing.4}, {core.spacing.8}, {core.spacing.16})',
      },

      separation: {
        interactive: {
          min: 'clamp(8px, {core.spacing.3}, 16px)',
        },
      },
    },

    // -- Sizing -------------------------------------------------------------
    // Grammar: {family}.{stepOrProperty}
    sizing: {
      hit: '{core.sizing.hit.fine}',
      icon: {
        // Tracks the accompanying text (1em) so the glyph's ink lands inside
        // the cap-height band — the optical-alignment step, not a ramp step.
        text: '{core.sizing.relative.em}',
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
      // Pill CTAs (P3 Slice 3, Spectrum-derived): command triggers take the
      // full-round silhouette while fields/choice controls stay at `control`
      // — the "press me" vs "fill me in" distinction.
      action: '{core.radii.full}',
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
        selected: {
          width: '{core.border.width.selected}',
          style: '{core.border.style.solid}',
        },
      },
    },

    // -- Focus --------------------------------------------------------------
    focus: {
      ring: {
        width: '{core.border.width.focused}',
        style: '{core.border.style.solid}',
        offset: '{core.border.offset.focused}',
        // References the semantic accent focused border so mode overrides
        // remap focus color automatically (e.g. brand.300 in dark mode).
        color: '{semantic.colors.action.accent.border.focused}',
      },
    },

    consequence: {
      destructive: {
        // The standalone negative valence ink — the same source the
        // validation message reads, referenced semantically (like
        // focus.ring.color) so the dark alternate's remap of that token
        // carries this one with it. A theme may repoint the alias without
        // touching validation messages.
        ink: '{semantic.colors.informational.negative.text.default}',
      },
    },

    // -- Overlay ------------------------------------------------------------
    overlay: {
      // Full modal backdrop color. Alpha is sourced from semantic.opacity.scrim
      // so both tokens stay in sync across themes and modes.
      // RawValue rationale: rgba() composing a token ref cannot be expressed
      // as a single TokenRef — see model.md §8 RawValue inventory.
      scrim: 'rgba(0, 0, 0, {semantic.opacity.scrim})',
      // Boundary of an occluding surface. neutral.500 clears the ≥3:1
      // separator floor against every stratum an overlay can land on in this
      // mode — the pairing that proves it is `colors.test.ts` › "occluding
      // boundary", which also reports the ratios.
      outline: '{core.colors.neutral.500}',
    },

    // -- Rail -----------------------------------------------------------------
    rail: {
      // The unfilled part of a ProgressBar/Meter/Slider track (F-050/F-051).
      // neutral.200 — see `families/rail.ts` for the reference delta and why
      // this is the half F-050 left owing.
      track: '{core.colors.neutral.200}',
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
          // White button on dark surface — inverted authority for dark contexts.
          // Contrast: neutral.900 text on neutral.0 → ~19:1 ✓
          background: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.100}',
            active: '{core.colors.neutral.200}',
            pressed: '{core.colors.neutral.200}',
            expanded: '{core.colors.neutral.100}',
            disabled: '{core.colors.neutral.700}',
            droptarget: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: {
            default: '{core.colors.neutral.0}',
            hover: '{core.colors.neutral.100}',
            active: '{core.colors.neutral.200}',
            focused: '{core.colors.brand.300}',
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.500}',
            // droptarget bg is now neutral.700 (dark) — neutral.0 required for contrast
            droptarget: '{core.colors.neutral.0}',
          },
        },
        secondary: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.300}',
            disabled: '{core.colors.neutral.700}',
            droptarget: '{core.colors.neutral.700}', // neutral.50 is near-white on dark
            expanded: '{core.colors.neutral.500}', // neutral.200 is near-white on dark
            // The engaged toggle inverts the other way here: the base's dark
            // fill equals dark mode's resting surface, so ON must be the
            // light one. neutral.900 text on neutral.300 → 12:1 ✓.
            pressed: '{core.colors.neutral.300}',
          },
          border: {
            // Mirrors the background, exactly as light mode does. Carrying an
            // edge here (neutral.500 over a neutral.700 fill) made a secondary
            // action resolve to the *identical* triple as a text input in dark
            // — same fill, same edge, same ink — so a button and a field became
            // indistinguishable in one mode and clearly distinct in the other.
            // A mode may change tonal depth (ADR-018); it may not change the
            // vocabulary. `focused` and `expanded` keep their visible edge, the
            // same two exceptions light mode makes.
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.700}',
            pressed: '{core.colors.neutral.300}',
            // Lighter than the expanded fill (neutral.500) so the open trigger
            // still shows an edge — light mode's neutral.500-over-neutral.200.
            expanded: '{core.colors.neutral.300}',
          },
          text: {
            default: '{core.colors.neutral.50}',
            disabled: '{core.colors.neutral.500}',
            // The engaged fills invert to light (neutral.300 above), so the
            // ink inverts with them — `pressed` (the held toggle) always had
            // this; `active` (the momentary press, held for as long as an
            // anchored overlay stays open) was missed, leaving the resting
            // near-white ink on the light fill at 1.45:1 (F-043).
            active: '{core.colors.neutral.900}',
            pressed: '{core.colors.neutral.900}',
          },
        },
        muted: {
          // Dark mode's quiet rung sits ON the canvas (neutral.900), not one
          // stratum above it: at neutral.700 it resolved to the exact same
          // triple as `secondary` — two emphasis levels rendering the same
          // pixels. The fill still appears on hover, one tonal step at a time
          // (ADR-018: dark depth is carried by surface colour).
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.500}', // neutral.300 fails AA with neutral.0 text (1.6:1); neutral.500 gives 5.5:1
            disabled: '{core.colors.neutral.900}',
            droptarget: '{core.colors.neutral.700}', // neutral.50 is near-white on dark
            pressed: '{core.colors.neutral.700}', // neutral.300 fails AA; darker = "depressed" feel, white text gives 8.6:1
            expanded: '{core.colors.neutral.500}', // neutral.50 is near-white on dark
          },
          border: {
            // Mirrors the background — no edge at rest, same as light mode.
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.900}',
            pressed: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.500}',
          },
          text: {
            // Dimmer than `secondary`'s neutral.50: the quiet rung is quiet in
            // ink as well as in fill. neutral.300 on the neutral.900 canvas →
            // 13.6:1 ✓, and it brightens to neutral.0 once a fill appears.
            default: '{core.colors.neutral.300}',
            disabled: '{core.colors.neutral.500}',
            // neutral.900 text on neutral.700 dark bg → ~3:1 — fails WCAG AA
            hover: '{core.colors.neutral.0}',
            active: '{core.colors.neutral.0}',
            pressed: '{core.colors.neutral.0}',
            expanded: '{core.colors.neutral.0}',
          },
        },
        // negative: red.600 bg/border + neutral.0 text remain valid on dark
        // pages (vivid destructive colour). Only state-specific overrides.
        negative: {
          background: {
            disabled: '{core.colors.neutral.700}',
            droptarget: '{core.colors.neutral.700}', // red.100 is near-white on dark
          },
          border: {
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            // droptarget bg is now neutral.700 (dark) — neutral.0 required for contrast
            droptarget: '{core.colors.neutral.0}',
          },
        },
        // accent: brand.500 bg/border + neutral.0 text remain valid on dark
        // surface. Only remap states that use light-mode fills that fail on dark.
        accent: {
          background: {
            disabled: '{core.colors.neutral.700}', // neutral.200 is near-white on dark
            droptarget: '{core.colors.brand.900}', // brand.50 is near-white on dark
          },
          border: {
            focused: '{core.colors.brand.300}', // brand.700 is too dark on dark surface
            disabled: '{core.colors.neutral.700}',
          },
          text: {
            droptarget: '{core.colors.neutral.0}', // brand.900 bg needs light text
          },
        },
      },
      input: {
        primary: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.500}', // neutral.50 is near-white on dark
            disabled: '{core.colors.neutral.900}',
            selected: '{core.colors.neutral.800}', // monochrome selected tint on dark
            droptarget: '{core.colors.neutral.700}', // neutral.50 is near-white on dark
            pressed: '{core.colors.neutral.500}', // neutral.100 is near-white on dark
            expanded: '{core.colors.neutral.500}', // neutral.50 is near-white on dark
            invalid: '{core.colors.neutral.700}', // base neutral.0 would flash white on dark
            // inverted mono: base checked bg (neutral.1000) vanishes on dark
            checked: '{core.colors.neutral.0}',
            indeterminate: '{core.colors.neutral.0}',
          },
          border: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}', // base neutral.500 == dark default
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.700}',
            invalid: '{core.colors.red.300}', // red.600 is too dark against neutral.700
            selected: '{core.colors.neutral.300}', // base neutral.1000 vanishes on dark
            checked: '{core.colors.neutral.0}',
            indeterminate: '{core.colors.neutral.0}',
            // The engaged fill lifts to neutral.500 here, which the base edge
            // (also neutral.500) then matched exactly — a pressed or expanded
            // field lost its edge in this mode while keeping it in the base.
            // Same step hover/active already take above.
            pressed: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.300}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            invalid: '{core.colors.neutral.0}', // base neutral.900 would vanish on dark
            // inverted mono box (neutral.0 bg) needs dark glyphs in dark mode
            checked: '{core.colors.neutral.900}',
            indeterminate: '{core.colors.neutral.900}',
          },
        },
        // input.secondary: lower-emphasis field. It shares primary's dark fill
        // (both render on a dark page, and base's neutral.0 default fails
        // there), but it must NOT share primary's edge: in light mode
        // secondary recedes via a lighter border (neutral.200 vs primary's
        // neutral.300), and the dark override used to drop that distinction
        // entirely — leaving the two roles byte-identical at rest. Here the
        // border matches its own fill, so the field recedes until hovered.
        secondary: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.500}',
            disabled: '{core.colors.neutral.900}',
            selected: '{core.colors.neutral.800}',
            droptarget: '{core.colors.neutral.700}',
            pressed: '{core.colors.neutral.500}',
            expanded: '{core.colors.neutral.500}',
            // inverted mono: base checked bg (neutral.1000) vanishes on dark
            checked: '{core.colors.neutral.0}',
            indeterminate: '{core.colors.neutral.0}',
          },
          border: {
            // Mirrors its own fill: the edge appears on hover, not at rest.
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.300}',
            focused: '{core.colors.brand.500}',
            disabled: '{core.colors.neutral.700}',
            selected: '{core.colors.neutral.300}',
            checked: '{core.colors.neutral.0}',
            indeterminate: '{core.colors.neutral.0}',
            pressed: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.300}',
          },
          text: {
            default: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            checked: '{core.colors.neutral.900}', // inverted mono box (neutral.0 bg)
            indeterminate: '{core.colors.neutral.900}',
          },
        },
        negative: {
          background: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: {
            default: '{core.colors.red.500}',
            // The base cascade darkens the edge on interaction (red.500 →
            // red.700) because it sits on a light red fill. Here the fill is
            // the dark canvas, so darkening weakens the edge instead — it fell
            // under the border pairing floor while resting cleared it, i.e. an
            // invalid field went quieter the moment it was focused. Inverted to
            // the step this alternate already picked for the same problem at
            // `input.primary.border.invalid`.
            active: '{core.colors.red.300}',
            expanded: '{core.colors.red.300}',
            focused: '{core.colors.red.300}',
            pressed: '{core.colors.red.300}',
          },
          text: { default: '{core.colors.red.300}' },
        },
        positive: {
          background: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: { default: '{core.colors.green.500}' },
          text: { default: '{core.colors.green.300}' },
        },
        caution: {
          background: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: { default: '{core.colors.yellow.500}' },
          text: { default: '{core.colors.yellow.300}' },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.500}', // neutral.200 is near-white on dark
            selected: '{core.colors.neutral.500}', // neutral.200 is near-white on dark
          },
          border: {
            default: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.300}',
            selected: '{core.colors.neutral.300}',
            // Engaged states keep the resting fill and move only the edge, so
            // the base's darkening step lands on the dark fill and recedes.
            // Same inversion as the three states above.
            expanded: '{core.colors.neutral.300}',
            pressed: '{core.colors.neutral.300}',
          },
          text: { default: '{core.colors.neutral.300}' },
        },
      },
      informational: {
        primary: {
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}', // neutral.50 is near-white on dark
            active: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            selected: '{core.colors.neutral.700}', // monochrome selected tint on dark
            droptarget: '{core.colors.neutral.700}', // brand.50 is near-white on dark
            visited: '{core.colors.neutral.700}', // neutral.50 is near-white on dark
          },
          border: { default: '{core.colors.neutral.700}' },
          text: {
            default: '{core.colors.neutral.0}',
            // neutral.700 on neutral.900 dark bg → ~2:1 — fails WCAG AA
            visited: '{core.colors.neutral.300}',
          },
        },
        secondary: {
          background: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}', // neutral.100 is near-white on dark
            active: '{core.colors.neutral.500}', // neutral.200 is near-white on dark
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            selected: '{core.colors.neutral.500}', // monochrome selected tint on dark
            droptarget: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            visited: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: { default: '{core.colors.neutral.700}' },
          text: {
            default: '{core.colors.neutral.50}',
            // neutral.900 on neutral.700 dark bg → ~3:1 — fails WCAG AA
            active: '{core.colors.neutral.0}',
            // neutral.700 on neutral.700 → 1:1 — invisible
            visited: '{core.colors.neutral.300}',
          },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.300}', // neutral.200 is near-white on dark
            selected: '{core.colors.neutral.300}', // neutral.200 is near-white on dark
            droptarget: '{core.colors.neutral.300}', // neutral.200 is near-white on dark
          },
          border: { default: '{core.colors.neutral.700}' },
          text: { default: '{core.colors.neutral.300}' },
        },
        positive: {
          background: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            // The base's selected tint is the light green.300, which is also
            // where this role's *ink* remaps on dark — inherited, the pair
            // closes to 1:1 (F-043). The monochrome selected step the neutral
            // roles already use keeps the light valence ink legible on it.
            selected: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.green.500}',
            // The inherited green.700 edge sinks against the neutral.700
            // selected fill. Engaging lightens the edge on dark — the same
            // move this alternate makes on negative's active/focused and on
            // accent's hover — and .300 also keeps it distinct from the
            // resting .500.
            selected: '{core.colors.green.300}',
          },
          text: { default: '{core.colors.green.300}' },
        },
        caution: {
          background: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            // Same remap as positive — see the comment there.
            selected: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.yellow.500}',
            selected: '{core.colors.yellow.300}',
          },
          text: { default: '{core.colors.yellow.300}' },
        },
        negative: {
          background: {
            default: '{core.colors.neutral.900}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            // Same remap as positive — see the comment there.
            selected: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.red.500}',
            // Same inversion as `input.negative.border` — the base darkens the
            // edge on interaction against a light red fill; here it sits on the
            // dark canvas, so it lightens instead.
            active: '{core.colors.red.300}',
            focused: '{core.colors.red.300}',
            selected: '{core.colors.red.300}',
          },
          text: { default: '{core.colors.red.300}' },
        },
        // Full remap: base brand.50/100/200 backgrounds are near-white and fail on dark pages.
        accent: {
          background: {
            default: '{core.colors.brand.900}',
            hover: '{core.colors.brand.700}',
            active: '{core.colors.brand.700}',
            disabled: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.brand.300}',
            // Engaging lifts the fill a step (brand.900 → brand.700), so the
            // edge must lift with it or the cascade inverts: brand.400 moved
            // *down* the ramp while the fill moved up, and the pair closed to
            // under the border pairing floor. brand.200 keeps the edge one step
            // clear of the resting brand.300 it must also differ from.
            hover: '{core.colors.brand.200}',
            active: '{core.colors.brand.200}',
            // brand.100 for focused — must differ from default (brand.300) for state distinguishability
            focused: '{core.colors.brand.100}',
            disabled: '{core.colors.neutral.700}',
            selected: '{core.colors.brand.400}',
          },
          text: {
            // brand.700 on neutral.900 bg → ~1.3:1 — invisible; use brand.300
            default: '{core.colors.brand.300}',
            hover: '{core.colors.brand.100}',
            active: '{core.colors.brand.100}',
            visited: '{core.colors.brand.300}',
          },
        },
      },
      feedback: {
        // Valence fills (positive/caution/negative) are mode-stable — the
        // deep filled surfaces from the base read correctly on the dark
        // canvas (same mechanism as action.negative), so only the neutral
        // roles remap: primary lightens one stratum to stay a visible chip
        // on the neutral.900 canvas; muted follows the dark neutral surface.
        primary: {
          // neutral.500 (not 700): the filled neutral chip must stand off the
          // dark strata it sits on (canvas 900 / raised 800 / overlay 700) —
          // 700 camouflages against a raised card. neutral.0 text: 5.0:1 ✓.
          background: { default: '{core.colors.neutral.500}' },
          border: { default: '{core.colors.neutral.500}' },
          text: { default: '{core.colors.neutral.0}' },
        },
        muted: {
          background: { default: '{core.colors.neutral.700}' },
          border: { default: '{core.colors.neutral.500}' },
          text: { default: '{core.colors.neutral.300}' },
        },
      },
      navigation: {
        // Stacked-surface separation in dark mode.
        // The page background and informational.primary.background.default both
        // resolve to neutral.900 here. Per the prescribed pattern (see
        // colors.md → "Stacking informational surfaces"), separation is paid in
        // elevation + border + theme-side step displacement, never in colour.
        // navigation.primary applies (3): hover/active/current/expanded shift to
        // neutral.700 so a nav item reads as a distinct affordance against the
        // page surface even with no elevation of its own.
        primary: {
          // Inline link on dark surfaces: transparent bg, monochrome text +
          // underline. Contrast: neutral.200 on neutral.900 → ~12:1 ✓
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.900}',
            current: '{core.colors.neutral.700}',
            visited: '{core.colors.neutral.900}',
            expanded: '{core.colors.neutral.700}',
          },
          border: {
            default: '{core.colors.neutral.900}',
            focused: '{core.colors.brand.400}',
            // selected/current tab indicator line — monochrome (light on dark)
            selected: '{core.colors.neutral.0}',
            current: '{core.colors.neutral.0}',
          },
          text: {
            default: '{core.colors.neutral.200}',
            hover: '{core.colors.neutral.0}',
            active: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            current: '{core.colors.neutral.0}',
            visited: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.0}',
          },
        },
        secondary: {
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.700}',
            selected: '{core.colors.neutral.700}',
            current: '{core.colors.neutral.700}',
            visited: '{core.colors.neutral.900}',
            expanded: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
            droptarget: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.400}',
            selected: '{core.colors.neutral.300}',
            current: '{core.colors.neutral.300}',
          },
          text: {
            default: '{core.colors.neutral.300}',
            hover: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.500}',
            selected: '{core.colors.neutral.0}',
            current: '{core.colors.neutral.0}',
            visited: '{core.colors.neutral.300}',
            expanded: '{core.colors.neutral.50}',
          },
        },
        accent: {
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.700}',
            selected: '{core.colors.brand.700}',
            current: '{core.colors.brand.700}',
            expanded: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: {
            default: '{core.colors.brand.500}',
            hover: '{core.colors.brand.400}',
            active: '{core.colors.brand.300}',
            focused: '{core.colors.brand.400}',
            // `selected` and `current` are the only two states here that fill
            // with brand.700, so their edge is read against the marker rather
            // than the page and needs the same lift the fill took.
            selected: '{core.colors.brand.200}',
            current: '{core.colors.brand.200}',
          },
          text: {
            default: '{core.colors.brand.300}',
            hover: '{core.colors.brand.100}',
            disabled: '{core.colors.neutral.500}',
            selected: '{core.colors.neutral.0}',
            current: '{core.colors.neutral.0}',
            visited: '{core.colors.brand.500}',
            expanded: '{core.colors.brand.200}',
          },
        },
        muted: {
          background: {
            default: '{core.colors.neutral.900}',
            hover: '{core.colors.neutral.700}',
            active: '{core.colors.neutral.700}',
            selected: '{core.colors.neutral.700}',
            current: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.700}',
            disabled: '{core.colors.neutral.700}', // neutral.100 is near-white on dark
          },
          border: {
            default: '{core.colors.neutral.700}',
            hover: '{core.colors.neutral.500}',
            active: '{core.colors.neutral.500}',
            focused: '{core.colors.brand.400}',
            selected: '{core.colors.neutral.300}',
            // Was brand.500 — the step the base picked to clear the indicator
            // floor against a light page. Its two siblings here (`focused`, and
            // `text.current` below) were already lifted for the dark canvas and
            // this one was not, so the current-page marker sat under the floor
            // in this mode alone.
            current: '{core.colors.brand.400}',
          },
          text: {
            default: '{core.colors.neutral.500}',
            hover: '{core.colors.neutral.300}',
            active: '{core.colors.neutral.0}',
            disabled: '{core.colors.neutral.700}',
            selected: '{core.colors.neutral.0}',
            current: '{core.colors.brand.300}',
            visited: '{core.colors.neutral.700}',
            expanded: '{core.colors.neutral.300}',
          },
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
      // Dark depth is carried by surface lightening, not shadow: the canvas
      // sits at neutral.900, so each rising stratum steps toward a lighter
      // neutral (800 → 700). This is the mechanism the base shadows cannot
      // provide on a near-black background (elevation.md Rule 6).
      tonal: {
        raised: '{core.colors.neutral.800}',
        overlay: '{core.colors.neutral.700}',
        blocking: '{core.colors.neutral.700}',
      },
    },
    overlay: {
      // The boundary inverts with the canvas: light mode needs a dark hairline
      // to bound a light surface, dark mode a light one. neutral.300 is the
      // step that clears the ≥3:1 separator floor against every stratum in
      // this mode, including the tonal lifts an overlay lands on — the
      // "occluding boundary" pairing reports the ratios.
      outline: '{core.colors.neutral.300}',
    },
    rail: {
      // A rail darkens in dark while a border lightens (`families/rail.ts`) —
      // the opposite direction of `outline` just above. neutral.700 is the
      // same step F-050 already found closest to the reference here.
      track: '{core.colors.neutral.700}',
    },
  },
};

/**
 * Design brief for the base theme — the recommended default from
 * theme-authoring.md §"Recommended base theme brief". Attached to the base
 * bundle via `createTheme({ brief })`; carries the `FSL-DESIGN-001..003` gate.
 */
export const baseBrief: ThemeBrief = {
  name: 'base',
  purpose: 'default built-in foundation for modern product UI',
  primaryPosture: 'productive',
  secondaryPosture: 'calm',
  densityProfile: 'balanced',
  readingMode: 'mixed',
  pointerProfile: 'hybrid',
  interactionRisk: 'medium',
  surfaceModel: 'lightly-layered',
  brandEnergy: 'quiet',
  accessibilityTarget: 'AA+',
  colorModeStrategy: 'dark-supported',
  platformBias: 'web',
};
