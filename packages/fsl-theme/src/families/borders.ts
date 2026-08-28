/* ==========================================================================
 * Borders — Line width/style primitives + Semantic line contracts.
 *
 * `SemanticBorderOutline` is exported because the `focus` family composes
 * it with an additional `color` field for the focus ring contract.
 *
 * @see borders.md
 * ========================================================================== */

import type { CoreBorderRef, RawValue } from './primitives';

/**
 * Core line widths — intent-free primitives.
 * `selected` and `focused` must resolve to a width strictly greater than `default`.
 * Never reference these directly from components — use semantic border tokens.
 */
interface CoreBorderWidths {
  none: RawValue;
  default: RawValue;
  selected: RawValue;
  focused: RawValue;
}

/**
 * Core line offsets — the gap between a box's edge and a line drawn outside it.
 *
 * One member, because the focus ring is the only line the system draws outside
 * the box. Named for its canonical use site like the width scale beside it:
 * the name carries the relationship a purely ordinal key would lose. The
 * offset's promotion into the token contract is defended where the ring's
 * composition is specified (borders.md, focus-ring composition — § Focus
 * Implementation).
 *
 * Kept **independent of `width.focused`** even though the base theme sets both
 * to the same value. The reference system does the same — `focus-indicator-gap`
 * and the indicator thickness are two tokens that happen to agree — because a
 * theme retunes them for different reasons: thickness for prominence, gap for
 * how much the ring breathes off the control.
 */
interface CoreBorderOffsets {
  focused: RawValue;
}

/**
 * Core line styles — intent-free primitives.
 * Default to `solid`; use `dashed` or `dotted` only when the pattern truly requires it.
 */
interface CoreBorderStyles {
  solid: RawValue;
  dashed: RawValue;
  dotted: RawValue;
  none: RawValue;
}

/** Intent-free line primitives — width, style, and outside-the-box offset. */
export interface CoreBorder {
  width: CoreBorderWidths;
  style: CoreBorderStyles;
  offset: CoreBorderOffsets;
}

/**
 * Shared shape for every semantic line contract: width + style references only.
 * Color is never part of this contract — pair with semantic color tokens.
 * @see SemanticColors — for border color tokens per UX context.
 */
export interface SemanticBorderOutline {
  width: CoreBorderRef;
  style: CoreBorderRef;
}

/**
 * Semantic line contracts — the stable API consumed by components.
 *
 * Four canonical contracts (borders.md §Canonical semantic set):
 * @see borders.md
 * - `divider`           — structural separator between content groups
 * - `outline.surface`   — boundary of containing surfaces (cards, panels, dialogs)
 * - `outline.control`   — boundary of interactive controls (buttons, inputs, toggles)
 * - `outline.selected`  — stronger-thickness indicator for selected/current state
 *
 * Rules:
 * - Components consume these tokens only — never `core.border.*` directly.
 * - `outline.selected` must resolve to a width strictly greater than `outline.{surface,control}`.
 * - Color meaning stays in the color system; these tokens define geometry only.
 * - Do not add component-specific tokens (`border.input`, `border.card`, etc.).
 *
 * @adr ADR-011 — `outline.selected` lives inside `outline.*` (shape grouping); `focus.ring` stays separate (accessibility contract + color field).
 */
export interface SemanticBorder {
  /**
   * Structural separator between content groups (low emphasis).
   * Use when splitting list rows, sections, toolbar regions, or grouped fields
   * — anywhere the line *separates* without enclosing.
   * Pair with a low-emphasis color (`informational.muted.border.default`); do
   * not use to enclose a surface or control — those are `outline.surface` /
   * `outline.control`.
   */
  divider: SemanticBorderOutline;
  outline: {
    /**
     * Boundary of a containing surface (card, panel, dialog, menu, grouped region).
     * Use when the element *contains* other content and needs a visible edge.
     * Pair with `informational.{role}.border.{state}` colors and (optionally)
     * `semantic.elevation.surface.*`; do not use for interactive controls — those
     * are `outline.control`.
     */
    surface: SemanticBorderOutline;
    /**
     * Boundary of an interactive control (button, input, toggle, chip, segmented item).
     * Use when the element is interactive and needs a visible edge at rest.
     * Pair with `{ux}.{role}.border.{state}` colors per FSL UX context; do not
     * use for containing surfaces — those are `outline.surface`.
     */
    control: SemanticBorderOutline;
    /**
     * Stronger-thickness boundary expressing selected / current state.
     * Use when selection or current-item status is communicated by line weight
     * (active tab, selected row, chosen card).
     * Resolves to a width strictly greater than `outline.{surface,control}`. Do
     * not use for keyboard focus — that is `semantic.focus.ring`.
     */
    selected: SemanticBorderOutline;
  };
}
