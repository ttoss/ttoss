/* ==========================================================================
 * Radii — Corner curvature primitives + Semantic radius contracts.
 * @see radii.md
 * ========================================================================== */

import type { CoreRadiiRef, RawValue } from './primitives';

/**
 * Core radius scale — intent-free corner curvature primitives.
 * Ordered: none < sm < md < lg < xl << full.
 *
 * **Never reference core radii directly from components.**
 * Components consume only semantic radii (`radii.control`, `radii.surface`, `radii.round`).
 */
export interface CoreRadii {
  none: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
  /**
   * Fully-rounded intent (`9999px`).
   * Expresses shape intent — perfect circles still depend on element dimensions.
   */
  full: RawValue;
}

/**
 * Semantic radius contracts — stable shape API consumed by components.
 *
 * Pick by structural role:
 * - `action`   → command triggers (button, toggle button) — the CTA silhouette
 * - `control`  → interactive element (input, select, chip)
 * - `surface`  → containing surface (card, panel, dialog, menu)
 * - `round`    → explicitly fully-rounded shape intent (pill, capsule, avatar)
 *
 * @see radii.md — Decision Matrix and Rules of Engagement.
 */
export interface SemanticRadii {
  /**
   * Radius for command triggers (Button, ToggleButton). Split from `control`
   * so a theme can give CTAs their own silhouette (e.g. pill) while fields
   * and choice controls keep the standard control radius — the distinction
   * reference-grade systems draw between "press me" and "fill me in".
   */
  action: CoreRadiiRef;
  /** Radius for interactive controls and touchable UI elements. */
  control: CoreRadiiRef;
  /** Radius for surfaces that contain or group content. */
  surface: CoreRadiiRef;
  /** Full-round shape intent for pills, capsules, and circular affordances. */
  round: CoreRadiiRef;
}
