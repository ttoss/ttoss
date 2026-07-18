/* ==========================================================================
 * Spacing — Core spacing scale + Semantic spacing contracts.
 * @see spacing.md
 * ========================================================================== */

import type { CoreSpacingRef, RawValue } from './primitives';

interface CoreSpacingEngine {
  /** Responsive base unit — container-first clamp formula */
  unit: RawValue;
  /** Optional container-aware variant */
  unitCq?: RawValue;
}

export interface CoreSpacingSteps {
  /** Responsive engine primitives — internal, not for direct component use */
  engine: CoreSpacingEngine;
  0: RawValue;
  1: RawValue;
  2: RawValue;
  3: RawValue;
  4: RawValue;
  6: RawValue;
  8: RawValue;
  12: RawValue;
  16: RawValue;
}

interface InsetSteps {
  /** Compact step — tight controls / dense surfaces. */
  sm: CoreSpacingRef;
  /** Default step — standard controls and surfaces. Pick this when no other step applies. */
  md: CoreSpacingRef;
  /** Roomy step — prominent controls / spacious surfaces. */
  lg: CoreSpacingRef;
}

/**
 * Control inset remap for one non-default density (ADR-019). Each step is a
 * `core.spacing.*` ref, exactly like `semantic.spacing.inset.control.*` — the
 * emitter overrides that semantic token under `[data-tt-density]`.
 */
interface DensityControlInset {
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
}

/**
 * Density projection remaps (ADR-019, scoped to `inset.control` by ADR-020).
 *
 * Density (`compact | comfortable | spacious`, default `comfortable`) is a
 * theme projection axis set via `data-tt-density`, exactly like colour mode.
 * `comfortable` is the base (the shipped `semantic.spacing.inset.control.*`),
 * so only the two non-default densities carry overrides here. Density tunes
 * **only** control inset — never `hit`, which ADR-020 fixed as a single
 * ergonomic floor (and whose touch override must always win). The coarse
 * pointer floor is therefore unaffected by density.
 */
export interface CoreDensity {
  /** Tighter geometry for information-dense desktop surfaces. */
  compact: { inset: { control: DensityControlInset } };
  /** Looser geometry for relaxed / touch-leaning surfaces. */
  spacious: { inset: { control: DensityControlInset } };
}

interface GapStackSteps {
  /** Tight vertical rhythm — micro-clusters within a single field. */
  xs: CoreSpacingRef;
  /** Medium vertical rhythm — sibling lines inside a form group. */
  sm: CoreSpacingRef;
  /** Default vertical rhythm — pick this when no other step applies. */
  md: CoreSpacingRef;
  /** Roomy vertical rhythm — separating distinct content clusters within a surface. */
  lg: CoreSpacingRef;
  /** Section-level rhythm — separating major sections of a page. */
  xl: CoreSpacingRef;
}

interface GapInlineSteps {
  /** Visual-only tight grouping (icon + label inside a single target). Never between focusable targets — use `separation.interactive.min`. */
  xs: CoreSpacingRef;
  /** Tight inline grouping between related inline siblings. */
  sm: CoreSpacingRef;
  /** Default inline grouping — pick this when no other step applies. */
  md: CoreSpacingRef;
  /** Spacious inline grouping. */
  lg: CoreSpacingRef;
  /** Wide inline grouping — the loosest step before a group break. */
  xl: CoreSpacingRef;
}

export interface SemanticSpacing {
  /**
   * Internal padding *inside* an element (CSS `padding`).
   * Use when the spacing lives between an element's edge and its own content;
   * never for the distance between siblings — that is `gap.*`.
   */
  inset: {
    /**
     * Padding inside an interactive control (button, input, chip, toggle).
     * Use on elements with a hit target and a single inner content cluster.
     * Pair with `inset.surface` on the containing surface; do not use for
     * containing surfaces — those are `inset.surface`.
     */
    control: InsetSteps;
    /**
     * Padding inside a containing surface (card, panel, dialog, menu, section).
     * Use on elements that *contain* other content blocks and need a margin
     * between their edge and the inner cluster.
     * Must be ≥ `inset.control` at the same step (validation rule); do not use
     * for the inner controls themselves — those are `inset.control`.
     */
    surface: InsetSteps;
  };
  /**
   * Distance *between* siblings (CSS `gap` on Flex/Grid containers).
   * Use when laying out a sequence of sibling elements; never for internal
   * padding (that is `inset.*`) and never for page/section structural padding
   * (that is `gutter.*`).
   */
  gap: {
    /**
     * Vertical rhythm between stacked siblings (column layouts, lists, form fields).
     * Use when items flow along the block axis and rhythm carries hierarchy.
     * Pair with `gap.inline` for horizontal groupings; do not use for items
     * arranged along the inline axis — those are `gap.inline`.
     */
    stack: GapStackSteps;
    /**
     * Horizontal grouping between inline siblings (icon + label, toolbar items, chip rows).
     * Use when items flow along the inline axis as a visual group.
     * `gap.inline.xs` is *visual-only* — never use it between independently
     * focusable interactive targets (use `separation.interactive.min` instead).
     */
    inline: GapInlineSteps;
  };
  /**
   * Structural outer padding for page-level and section-level layout regions.
   * `page` and `section` may use a `clamp()` expression with embedded `{token.path}` refs
   * (e.g. `clamp({core.spacing.4}, {core.spacing.6}, {core.spacing.12})`).
   * Typed as `RawValue` to allow both simple refs and responsive clamp expressions.
   */
  gutter: {
    /**
     * Outer padding bounding the page's content column.
     * Use as inline padding on the top-level page container.
     * Bounded `clamp()` contract by spec; do not use for inner sections — that
     * is `gutter.section`.
     */
    page: RawValue;
    /**
     * Outer padding separating a section's content from its parent's gutter.
     * Use on inner section wrappers nested inside a `gutter.page` container.
     * Bounded `clamp()` contract by spec; resolves tighter than `gutter.page`.
     */
    section: RawValue;
  };
  /**
   * Ergonomic separation between independently actionable targets in dense clusters.
   * May use a `clamp()` expression with an embedded `{token.path}` ref
   * (e.g. `clamp(8px, {core.spacing.2}, 12px)`).
   */
  separation: {
    interactive: {
      /**
       * Minimum gap between adjacent interactive targets (toolbar buttons,
       * paginator arrows, segmented controls, dense menu items).
       * Use only between elements the user can click/tap/focus independently.
       * Do not use for visual-only groupings — that is `gap.inline.xs`.
       */
      min: RawValue;
    };
  };
}
