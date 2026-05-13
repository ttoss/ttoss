/* ==========================================================================
 * Overlay — Cross-cutting overlay infrastructure (modal scrim/backdrop).
 *
 * Sibling of `focus`: neither belongs to a single UX context.
 *
 * `scrim` is a `RawValue` (rgba composing `semantic.opacity.scrim`) because no
 * single `TokenRef` can express a partial-opacity color. See model.md §8.
 * ========================================================================== */

import type { RawValue } from './primitives';

export interface SemanticOverlay {
  /** Modal backdrop color — full CSS color including alpha. */
  scrim: RawValue;
}
