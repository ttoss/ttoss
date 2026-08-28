import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

/**
 * Geometry of a **status light** — a small coloured dot plus a text label on
 * the page's own background, with no fill of its own.
 *
 * `StatusLight` is the only Feedback-entity member built from this shape.
 * `ProgressBar`/`Meter` (the entity's other two members) are rails
 * (`src/tokens/rail.ts`), and `Badge` (Structure) is the filled pill
 * (`CHIP_BOX`) — neither is a plausible second consumer of a dot, so this
 * lives beside them in the cross-cutting layer for consistency of pattern
 * rather than because two components share it (F-053).
 *
 * ## Where the numbers come from
 *
 * Read from `@adobe/spectrum-tokens@14.15.0`'s desktop set, the same
 * instrument F-050–F-052 used: `status-light-dot-size-medium` (**10px**) and
 * `status-light-text-to-visual-100` (**6px**, the dot-to-label gap). Both are
 * expressed in `rem` in the same unit `TRACK_RAIL.thickness` uses (6px is
 * `0.375rem` there too — a coincidence of the reference's own scale, not a
 * shared token; a gap and a rail thickness are different measurements that
 * happen to agree).
 *
 * The reference's third number, `status-light-top-to-dot-medium` (11px), is a
 * padding the reference's own layout tool needs to vertically centre a fixed
 * dot against a text baseline without flexbox. `STATUS_LIGHT_ROOT` uses
 * `align-items: center` on an inline-flex row instead, which centres the dot
 * against the label's line box directly — verified in Chromium, both modes,
 * against our own label type (`vars.text.label.sm`, one step larger than the
 * reference's per F-021): the dot sits visually centred on the label's line
 * with no separate offset needed.
 *
 * ## The dot's colour and radius are the entity's own tokens
 *
 * `radii.round` (`core.radii.full`) is already the Feedback row's second
 * radius (CONTRACT.md §1 — `surface`, `round` for rails), so a circular dot
 * reads the entity's existing vocabulary rather than a new one.
 * `feedback.{evaluation}.background.default` is the same address the old
 * filled pill read for its fill — the valence colour moves onto a smaller
 * shape, it does not become a different token.
 */
export const STATUS_LIGHT_DOT = {
  /** `status-light-dot-size-medium` — 10px. */
  size: '0.625rem',
  /** `status-light-text-to-visual-100` — 6px, the dot-to-label gap. */
  gap: '0.375rem',
} as const;

/**
 * The row that holds the dot and the label: inline, centred on the cross
 * axis, no fill, no border, no padding — the reference's "no fill" object,
 * distinct from `CHIP_BOX`'s filled pill.
 */
export const STATUS_LIGHT_ROOT: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: STATUS_LIGHT_DOT.gap,
};

/**
 * The dot itself. `backgroundColor` is the one axis a consumer sets — the
 * evaluation's `feedback.{evaluation}.background.default`.
 */
export const STATUS_LIGHT_DOT_STYLE: React.CSSProperties = {
  display: 'inline-block',
  flexShrink: 0,
  width: STATUS_LIGHT_DOT.size,
  height: STATUS_LIGHT_DOT.size,
  borderRadius: vars.radii.round,
};

/**
 * The label. Reads `label.sm` (the same type `CHIP_BOX` used) and the page's
 * own default ink (`informational.primary.text.default` — the address
 * `Surface`/`Code` already use for text that sits directly on the page), not
 * the feedback valence: the reference publishes no `status-light-text`
 * colour token, and the valence is the dot's job alone.
 */
export const STATUS_LIGHT_LABEL: React.CSSProperties = {
  ...(vars.text.label.sm as React.CSSProperties),
  color: vars.colors.informational.primary.text?.default,
};
