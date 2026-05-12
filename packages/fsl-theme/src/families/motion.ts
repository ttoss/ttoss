/* ==========================================================================
 * Motion — Core duration/easing primitives + Semantic motion specs.
 * @see motion.md
 * ========================================================================== */

import type { CoreMotionRef, RawValue } from './primitives';

interface CoreMotionDurations {
  none: RawValue;
  xs: RawValue;
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
}

interface CoreMotionEasings {
  standard: RawValue;
  enter: RawValue;
  exit: RawValue;
  linear: RawValue;
}

/** Core motion primitives — duration steps and easing curves. Components consume only semantic motion tokens. */
export interface CoreMotion {
  duration: CoreMotionDurations;
  easing: CoreMotionEasings;
}

/** A duration + easing pair that fully specifies motion for one use-case. */
interface SemanticMotionSpec {
  duration: CoreMotionRef;
  easing: CoreMotionRef;
}

export interface SemanticMotion {
  /**
   * Immediate response to a discrete user input on a single element.
   * Use when animating hover, press, toggle, or small confirmation tweaks
   * (color/scale/opacity changes on the element itself).
   * Do not use for elements entering or leaving the layout — those are
   * `transition.enter` / `transition.exit`.
   */
  feedback: SemanticMotionSpec;
  transition: {
    /**
     * Element appearing into rest position (overlay, surface, revealed content).
     * Use when an element transitions *from* hidden/absent *to* visible.
     * Pair with `transition.exit` on the inverse phase; do not use for the
     * resting element's response to input — that is `feedback`.
     */
    enter: SemanticMotionSpec;
    /**
     * Element leaving rest position (overlay closing, content dismissing).
     * Use when an element transitions *from* visible *to* hidden/absent.
     * Symmetric counterpart of `transition.enter`; the exit phase is shorter
     * by default to keep dismissal feeling responsive.
     */
    exit: SemanticMotionSpec;
  };
  /**
   * Attention-drawing motion for a relevant in-place change.
   * Use when the user must notice that something changed (status update,
   * value reconciliation, error appearing on a field).
   * Stronger than `feedback`; do not use for routine state changes — that is
   * `feedback`. May collapse to minimal motion in static themes.
   */
  emphasis: SemanticMotionSpec;
  /**
   * Ambient, non-essential motion (loops, parallax, idle flourishes).
   * Use only when motion is never required for understanding the UI.
   * Always disabled by default in static or reduced-motion themes; do not use
   * for any motion the user must perceive to operate the interface.
   */
  decorative: SemanticMotionSpec;
}
