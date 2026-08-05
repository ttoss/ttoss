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

/**
 * The non-fluid step scale — the counterpart of the engine-driven steps, for
 * semantic tokens whose *resolved outcome* is the guarantee rather than the
 * rhythm (`inset.control.*`, ADR-022/ADR-023). Plain values: core is the layer
 * that holds raw values (model.md §1), which is why a fixed step belongs here
 * and never as a literal in the semantic layer.
 *
 * Keys mirror the fluid steps' multipliers. The base theme sets them to the
 * engine's desktop bound so the fixed and fluid scales agree on wide surfaces;
 * that agreement is a theme choice, not a contract.
 */
interface CoreFixedSpacingSteps {
  /** One engine step at the desktop bound. */
  1: RawValue;
  /** Two steps. */
  2: RawValue;
  /** Four steps. */
  4: RawValue;
}

export interface CoreSpacingSteps {
  /** Responsive engine primitives — internal, not for direct component use */
  engine: CoreSpacingEngine;
  /** Non-fluid steps — for outcome-bearing semantic tokens (ADR-023). */
  fixed: CoreFixedSpacingSteps;
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
  /**
   * The **anchored/row-framing** step — the tightest surface inset, for a
   * container whose padding is a gutter beside its own children rather than a
   * margin around arbitrary content: an anchored popover, menu, tooltip, or a
   * list container framing rows that carry their own `inset.control`.
   *
   * **Fixed, for ADR-022's reason one context over.** The steps below ride the
   * fluid engine, which is right for a page-level surface — its padding scales
   * with the page. This step's whole visual outcome is its *relationship to
   * fixed-height children*, so a fluid value makes that relationship
   * container-fluid: measured before this existed, a menu's gutter moved
   * 16px → 24px from 390 to 1920 while every row stayed exactly 32.0px
   * (F-045). References `core.spacing.fixed.*`, like `inset.control` and for
   * the same reason.
   *
   * Do not reach for it on a page-level surface — that is `sm` and up. The
   * discriminant is whether the padding frames *content* (scale it) or
   * *controls* (hold it).
   */
  xs: CoreSpacingRef;
  /** Compact step — tight controls / dense surfaces. */
  sm: CoreSpacingRef;
  /** Default step — standard controls and surfaces. Pick this when no other step applies. */
  md: CoreSpacingRef;
  /** Roomy step — prominent controls / spacious surfaces. */
  lg: CoreSpacingRef;
}

/**
 * The control inset is **outcome-bearing and therefore fixed** (ADR-022):
 * a control's box is its inset + type with `hit` as the floor, so an inset
 * riding the fluid engine makes the box container-fluid — the thing
 * ADR-019/020 rule against, and ADR-020's "the residual never binds" premise
 * was measured false above ~900px (F-035).
 *
 * References `core.spacing.fixed.*`, the non-fluid step scale — ADR-022 rules
 * the outcome fixed, and ADR-023 corrects the mechanism: the fixed values are
 * core's to hold, so this stays a `CoreSpacingRef` like every other semantic
 * spacing token. Validation enforces the resolved fixed shape (spacing
 * Error #17).
 */
interface ControlInsetSteps {
  /** Compact step — the field family's block inset. */
  sm: CoreSpacingRef;
  /** Default step — the field family's inline inset. */
  md: RawValue;
  /** Roomy step — a command trigger's inline inset. */
  lg: RawValue;
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
    control: ControlInsetSteps;
    /**
     * Padding inside a containing surface (card, panel, dialog, menu, section).
     * Use on elements that *contain* other content blocks and need a margin
     * between their edge and the inner cluster.
     * Must be ≥ `inset.control` at the same step (validation rule); do not use
     * for the inner controls themselves — those are `inset.control`.
     */
    surface: InsetSteps;
    /**
     * Block padding of the **command** silhouette — the one axis where a
     * commitment is deliberately more generous than a generic control, so it
     * resolves to a taller box. Measured in the base theme: 40px against a
     * field's 34px at 1920×1080. Since ADR-022 fixed `inset.control.*`, both
     * boxes are stable on the fine-pointer range and the 6px difference *is*
     * the contract; this value keeps its 1px clamp band (8px at the phone end,
     * where the coarse `hit` floor takes over anyway).
     * See `radii.action` for why no component is named here.
     *
     * A **bounded range**, not a step: the design decision here is the range
     * itself, and the engine's unit steps straddle it (one step is too tight,
     * two overshoot). Same contract shape as `separation.interactive.min`.
     * Only the block axis is owned here — a command's inline padding stays
     * `inset.control.lg`, which needs no command-specific value.
     */
    action: {
      /** Block (vertical) padding of a command trigger. */
      block: RawValue;
    };
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
