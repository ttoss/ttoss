import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

/**
 * Geometry of a **chip** — the compact, non-interactive filled pill that
 * carries one short label.
 *
 * `Badge` (Structure) is now its sole reader. `StatusLight` (Feedback) read it
 * too until F-053: measured against the same silhouette, distinguished only by
 * which colour family it read, which is the reference's cue that the two are
 * different objects — `StatusLight` took the reference's own dot-plus-label
 * form instead, and `Badge` kept the filled pill. The box still lives in the
 * cross-cutting token layer beside `ICON_SLOT_STYLE` and `choosableRow` rather
 * than inside `Badge`'s own family file: it names a physical object a
 * component renders, independent of how many components currently render it,
 * the same reasoning `TRACK_RAIL`/`SELECTION_CONTROL` apply.
 *
 * ## Why this is shared rather than copied
 *
 * The package has already paid for the alternative twice. `Button`,
 * `ActionButton` and `ToggleButton` drifted apart geometry-by-geometry until
 * ADR-013 pulled their silhouette into one source, and the glyph offset of
 * F-022 re-entered component by component for the same reason. Two chips that
 * sit side by side in one UI — a status Badge next to a role Tag — must not be
 * able to disagree about their own roundness.
 *
 * ## The values, and where they came from
 *
 * Inherited verbatim from `Badge`'s P3 slice-3 retune, which measured the
 * reference's badge at ~22–24px: half the control block inset and the tight
 * `label.sm` line height keep the chip a dense annotation rather than a
 * control. It deliberately reads **no** ergonomic floor — a chip is not a hit
 * target, so `sizing.hit` would make it as tall as a field for nothing.
 *
 * The border width comes from `outline.surface`: a chip is a surface that
 * carries content, not a control the user operates.
 */
export const CHIP_BOX: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingBlock: `calc(${vars.spacing.inset.control.sm} / 2)`,
  paddingInline: vars.spacing.inset.control.md,
  borderRadius: vars.radii.control,
  borderWidth: vars.border.outline.surface.width,
  borderStyle: vars.border.outline.surface.style,
  ...(vars.text.label.sm as React.CSSProperties),
};
