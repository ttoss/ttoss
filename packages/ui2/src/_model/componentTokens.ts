/**
 * COMPONENT_TOKENS — canonical index of semantic layout CSS custom properties for @ttoss/ui2.
 *
 * **The problem it solves (B-05):**
 * Layout token names in `styles.css` are raw strings (e.g. `var(--tt-sizing-hit-base)`).
 * TypeScript never sees them. A typo (`--tt-sizing-hit-baes`) silently produces
 * zero height. No autocomplete. No reference document. Every new component author
 * must search existing CSS to discover which tokens exist.
 *
 * **What this const provides:**
 * - TypeScript autocomplete for every layout token name used in ui2.
 * - A single, auditable location for the complete set of layout tokens.
 * - Type-safe references in `defineComponent()` layout specs.
 * - Cross-reference with the cross-system validator (B-10), which already verifies
 *   that every `--tt-*` name in `styles.css` maps to a real token.
 *
 * **What this const is NOT:**
 * - A runtime lookup table — values are token names, not resolved CSS values.
 * - A guardrail for CSS authoring — the CSS still uses string literals.
 *   This const is the guide, not the enforcer.
 * - A complete catalog of @ttoss/theme2 — only tokens ui2 actually uses.
 *
 * **Usage in CSS (authoring assist):**
 * ```css
 * /* Instead of typing from memory: *\/
 * min-height: var(--tt-sizing-hit-base);
 * /* Use COMPONENT_TOKENS as the reference to confirm the name before authoring: *\/
 * /* COMPONENT_TOKENS.sizing.hit.base → '--tt-sizing-hit-base' *\/
 * ```
 *
 * **Usage in defineComponent() layout specs (type-safe):**
 * ```typescript
 * import { COMPONENT_TOKENS as T } from './_model/componentTokens';
 *
 * const buttonDef = defineComponent({
 *   // ... semantic options ...
 *   layout: {
 *     minHeight: T.sizing.hit.base,
 *     paddingInline: T.spacing.inset.control.md,
 *     fontFamily: T.text.label.md.fontFamily,
 *   },
 * });
 * ```
 *
 * **Token organization:**
 * Tokens are grouped by semantic category matching the @ttoss/theme2 namespace
 * hierarchy. The nested structure is intentional — it mirrors the path from
 * `semantic.*` to `--tt-*` CSS var name, making the relationship explicit and
 * browsable via autocomplete.
 *
 * @see @ttoss/theme2/Types.ts — full token grammar and contracts
 * @see styles.css — authoritative consumer of these tokens in ui2
 * @see tests/unit/tests/cross-system.test.ts — validator that every name here
 *   resolves to a real token (B-10 guardrail)
 */

// ---------------------------------------------------------------------------
// Token name type — a nominal alias for string to communicate intent
// ---------------------------------------------------------------------------

/**
 * A CSS custom property name for a semantic layout token.
 *
 * Always starts with `--tt-` and never starts with `--_` (which are scoped
 * component vars, not global token references).
 *
 * @example '--tt-sizing-hit-base'
 * @example '--tt-spacing-inset-control-md'
 * @example '--tt-text-label-md-fontFamily'
 */
export type ComponentToken = `--tt-${string}`;

// ---------------------------------------------------------------------------
// COMPONENT_TOKENS
// ---------------------------------------------------------------------------

/**
 * Semantic layout CSS custom property names used by @ttoss/ui2.
 *
 * All values are `--tt-*` CSS var names that are:
 * 1. Used in `src/styles.css`
 * 2. Verified by `cross-system.test.ts` to have backing token definitions
 *
 * **Completeness guarantee:** The cross-system test (B-10) already verifies
 * every `var(--tt-*)` in `styles.css`. This const maps those verified names
 * into an ergonomic, autocomplete-friendly structure.
 */
export const COMPONENT_TOKENS = {
  /**
   * Hit-target sizing — the height dimension for interactive controls.
   *
   * @see theme-v2 semantic.sizing.hit
   *
   * Sizing philosophy:
   * - `min`       → smallest acceptable touch target (28–44px, coarse/fine adaptive)
   * - `base`      → default interactive control height (40–48px)
   * - `prominent` → larger, high-emphasis controls (48–56px)
   *
   * CSS usage: `min-height: var(--tt-sizing-hit-min)` — always use min-height,
   * not height, to allow the control to expand for multiline content.
   */
  sizing: {
    hit: {
      /** Minimum touch target — smallest interactive control. Use for compact UIs. */
      min: '--tt-sizing-hit-min' as ComponentToken,
      /** Default control height — use for most interactive elements (Button, Input). */
      base: '--tt-sizing-hit-base' as ComponentToken,
      /** Large/prominent control — high-emphasis CTAs, hero actions. */
      prominent: '--tt-sizing-hit-prominent' as ComponentToken,
    },
  },

  /**
   * Spacing — gap and inset tokens for control layout.
   *
   * @see theme-v2 semantic.spacing
   *
   * Two semantic families:
   *
   * `inset.control` — padding inside a control (padding-block, padding-inline).
   *   Maps to sm/md/lg sizes aligned with the hit-target ramp.
   *   Rule: `button[data-size='sm']` uses `inset.control.sm` padding.
   *
   * `gap.inline` — space between adjacent inline elements (gap, margin).
   *   `sm` is the canonical gap between an icon and label inside a control.
   */
  spacing: {
    inset: {
      control: {
        /** Compact inset — small controls, tight layouts. */
        sm: '--tt-spacing-inset-control-sm' as ComponentToken,
        /** Default inset — standard controls (Button md, Input md). */
        md: '--tt-spacing-inset-control-md' as ComponentToken,
        /** Spacious inset — large/prominent controls. */
        lg: '--tt-spacing-inset-control-lg' as ComponentToken,
      },
    },
    gap: {
      inline: {
        /** Small inline gap — icon-to-label, icon-to-indicator spacing inside controls. */
        sm: '--tt-spacing-gap-inline-sm' as ComponentToken,
      },
    },
  },

  /**
   * Border radius — control and surface rounding.
   *
   * @see theme-v2 semantic.radii
   *
   * Rule: interactive controls (Button, Input, Select) always use `control`.
   * Surface containers (Card, Dialog, Panel) use `surface`. Pills use `round`.
   */
  radii: {
    /** Standard control border radius — for all interactive input-like elements. */
    control: '--tt-radii-control' as ComponentToken,
    /** Surface container border radius — for cards, panels, overlays. */
    surface: '--tt-radii-surface' as ComponentToken,
    /** Pill / fully-rounded — for tags, badges, and circular elements. */
    round: '--tt-radii-round' as ComponentToken,
  },

  /**
   * Border — outline width and style for control borders.
   *
   * @see theme-v2 semantic.border.outline, semantic.border.selected
   *
   * Rule: NEVER reference core border values directly. Always use these semantic
   * tokens, which are the binding interface between ui2 and the theme contract.
   *
   * `outline.control.*` — standard 1px border for interactive controls.
   * `selected.width`    — 2px border for selected/checked state indicators.
   *                       Checkbox checked state MUST use this, not outline.control.
   */
  border: {
    outline: {
      control: {
        /** Border width for standard interactive controls (1px). */
        width: '--tt-border-outline-control-width' as ComponentToken,
        /** Border style for standard interactive controls (solid). */
        style: '--tt-border-outline-control-style' as ComponentToken,
      },
    },
    selected: {
      /**
       * Border width for selected/checked state (2px).
       * Must be strictly > outline.control.width.
       * Use for Checkbox checked state indicator, Radio selected dot, etc.
       */
      width: '--tt-border-selected-width' as ComponentToken,
    },
  },

  /**
   * Focus ring — keyboard/programmatic focus indicator geometry and color.
   *
   * @see theme-v2 semantic.focus
   *
   * Rule: Implement focus rings via CSS `outline`, not `border`, to avoid
   * layout shift and produce clearer, offset-capable focus indicators.
   *
   * `[data-scope]:focus-visible { outline: var(--tt-focus-ring-width) var(--tt-focus-ring-style) var(--tt-focus-ring-color); }`
   *
   * The `color` token provides a single, theme-consistent focus color
   * valid for any component. Per-context focused border colors additionally
   * use the component's `border.focused` semantic token.
   */
  focus: {
    ring: {
      /** Focus ring width — must be ≥ border.outline.control.width. */
      width: '--tt-focus-ring-width' as ComponentToken,
      /** Focus ring style — typically `solid`; theme-overridable. */
      style: '--tt-focus-ring-style' as ComponentToken,
      /** Focus ring color — cross-cutting accessibility contract. */
      color: '--tt-focus-ring-color' as ComponentToken,
    },
  },

  /**
   * Opacity — intent-free opacity scale for semantic contracts.
   *
   * @see theme-v2 semantic.opacity
   *
   * `disabled` — use for media/icon dimming inside disabled components.
   * NOT for color — use dedicated disabled-state color tokens instead.
   *
   * @see B-11 — `opacity.disabled` is under-used in current ui2 implementation.
   */
  opacity: {
    /** Opacity for disabled media (icons, images). Resolves to 0.5. */
    disabled: '--tt-opacity-disabled' as ComponentToken,
  },

  /**
   * Motion — transition tokens for consistent visual state changes.
   *
   * @see theme-v2 semantic.motion
   *
   * Rule: Use `feedback` timing for immediate UI responses (color changes,
   * hover effects). The `expand` timing is for layout changes (accordion, drawer).
   * Do not use core motion values directly from components.
   */
  motion: {
    feedback: {
      /** Transition duration for immediate UI feedback (hover, active, focus). */
      duration: '--tt-motion-feedback-duration' as ComponentToken,
      /** Transition easing for immediate UI feedback. */
      easing: '--tt-motion-feedback-easing' as ComponentToken,
    },
  },

  /**
   * Text — typographic scale tokens for component labels and content.
   *
   * @see theme-v2 semantic.text
   *
   * The `label` set covers UI text at three density levels (sm, md, lg).
   * Each level provides a complete set of font properties that must be
   * applied together — mixing properties from different levels is a contract
   * violation and produces inconsistent visual density.
   *
   * Rule: A component with `data-size='sm'` uses ALL `label.sm.*` properties.
   * A default-size component uses ALL `label.md.*` properties.
   *
   * @example
   * font-family: var(--tt-text-label-md-fontFamily);
   * font-size: var(--tt-text-label-md-fontSize);
   * font-weight: var(--tt-text-label-md-fontWeight);
   * line-height: var(--tt-text-label-md-lineHeight);
   * letter-spacing: var(--tt-text-label-md-letterSpacing);
   * font-optical-sizing: var(--tt-text-label-md-fontOpticalSizing);
   */
  text: {
    label: {
      /** Small label text — compact UI (tags, secondary labels, helper text). */
      sm: {
        fontFamily: '--tt-text-label-sm-fontFamily' as ComponentToken,
        fontSize: '--tt-text-label-sm-fontSize' as ComponentToken,
        fontWeight: '--tt-text-label-sm-fontWeight' as ComponentToken,
        lineHeight: '--tt-text-label-sm-lineHeight' as ComponentToken,
        letterSpacing: '--tt-text-label-sm-letterSpacing' as ComponentToken,
        fontOpticalSizing:
          '--tt-text-label-sm-fontOpticalSizing' as ComponentToken,
      },
      /** Medium label text — default interactive control text (Button md, Input md). */
      md: {
        fontFamily: '--tt-text-label-md-fontFamily' as ComponentToken,
        fontSize: '--tt-text-label-md-fontSize' as ComponentToken,
        fontWeight: '--tt-text-label-md-fontWeight' as ComponentToken,
        lineHeight: '--tt-text-label-md-lineHeight' as ComponentToken,
        letterSpacing: '--tt-text-label-md-letterSpacing' as ComponentToken,
        fontOpticalSizing:
          '--tt-text-label-md-fontOpticalSizing' as ComponentToken,
      },
      /** Large label text — prominent controls, hero CTAs (Button lg). */
      lg: {
        fontFamily: '--tt-text-label-lg-fontFamily' as ComponentToken,
        fontSize: '--tt-text-label-lg-fontSize' as ComponentToken,
        fontWeight: '--tt-text-label-lg-fontWeight' as ComponentToken,
        lineHeight: '--tt-text-label-lg-lineHeight' as ComponentToken,
        letterSpacing: '--tt-text-label-lg-letterSpacing' as ComponentToken,
        fontOpticalSizing:
          '--tt-text-label-lg-fontOpticalSizing' as ComponentToken,
      },
    },
  },
} as const;

/**
 * Type of just the values within COMPONENT_TOKENS — every string in this union
 * is a real `--tt-*` CSS custom property name whose existence is validated
 * by the cross-system test (B-10).
 */
export type ComponentTokenValue = ComponentToken;

// ---------------------------------------------------------------------------
// Component declaration types — used by defineComponent() layout specs
// ---------------------------------------------------------------------------

/**
 * A single CSS value that can appear in a layout declaration.
 *
 * - `ComponentToken` — a `--tt-*` CSS custom property name. The CSS generator wraps
 *   it in `var(...)` automatically.
 * - `string` — a literal CSS value (e.g. `'block'`, `'pointer'`, `'none'`,
 *   `'100%'`, `'background-color, border-color, color'`).
 * - `number` — a raw numeric value (e.g. `0`, `2` for `outline-offset: 2px`).
 */
export type ComponentValue = ComponentToken | string | number;

/**
 * Union of camelCase CSS property names that are valid in layout declarations.
 *
 * This is an intentionally focused subset — not the full `React.CSSProperties`.
 * Only properties used for component _layout_ (sizing, spacing, typography,
 * border geometry, motion, cursor/interaction) are allowed. This prevents
 * color properties from leaking into layout declarations (colors are handled
 * by the data-variant system).
 */
export type ComponentCssProperty =
  | 'display'
  | 'alignItems'
  | 'justifyContent'
  | 'minHeight'
  | 'paddingBlock'
  | 'paddingInline'
  | 'borderRadius'
  | 'borderWidth'
  | 'borderStyle'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'fontOpticalSizing'
  | 'transitionProperty'
  | 'transitionDuration'
  | 'transitionTimingFunction'
  | 'cursor'
  | 'userSelect'
  | 'textDecoration'
  | 'appearance'
  | 'whiteSpace'
  | 'flexShrink'
  | 'gap'
  | 'width'
  | 'flexDirection'
  | 'outline'
  | 'outlineOffset'
  | 'marginBottom'
  | 'marginTop';

/**
 * A component declaration — a partial record of camelCase CSS properties to values.
 *
 * Used in `defineComponent()` to declare the component's layout CSS declaratively.
 * The CSS generator converts this to a CSS rule block.
 */
export type ComponentDeclaration = Partial<
  Record<ComponentCssProperty, ComponentValue>
>;

/**
 * Layout specification for a component — base styles + optional size overrides.
 *
 * @typeParam TSize - the size variant union (e.g. `'sm' | 'md' | 'lg'`)
 */
export interface ComponentSpec<TSize extends string = string> {
  /** Base layout properties applied to all instances. */
  base: ComponentDeclaration;
  /** Per-size overrides — only the properties that differ from base. */
  sizes?: Partial<Record<TSize, ComponentDeclaration>>;
}
