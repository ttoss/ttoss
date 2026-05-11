/* ==========================================================================
 * Breakpoints — Viewport threshold scale.
 *
 * Core-only family — no semantic layer (breakpoints are not brand-expressive).
 *
 * Rules:
 * - Mobile-first: base styles apply below `sm`; scale up with `min-width`. No `xs` step.
 * - Values must use `rem` units to respect user font-size preferences.
 * - Ordering invariant (strictly ascending): `sm < md < lg < xl < 2xl`.
 * - Adjacent steps must differ by ≥ 8rem to avoid over-granularity.
 * - Keep the scale small (≤ 5 steps). Add steps only when layout truly requires it.
 * - Device-category names (`mobile`, `tablet`, `desktop`) are forbidden — use scale names.
 * - CSS custom properties emitted from these tokens are for JS/tooling inspection only;
 *   they cannot be used in `@media` queries (CSS spec restriction on custom properties).
 *
 * @see breakpoints.md — Foundation Default Set, Rules, Validation.
 * ========================================================================== */

import type { RawValue } from './primitives';

export interface CoreBreakpoints {
  sm: RawValue;
  md: RawValue;
  lg: RawValue;
  xl: RawValue;
  '2xl': RawValue;
}
