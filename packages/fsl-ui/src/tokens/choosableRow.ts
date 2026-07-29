import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { FOCUS_RING_INSET } from './focusRing';

/**
 * Geometry of a **choosable row** — one line in a list the user picks from.
 *
 * Five components render one: a `Select` option, a `ComboBox` option, a
 * `MenuItem`, a `ListBoxItem`, a `GridListItem`. They span three entities
 * (Selection, Overlay, Collection), which is why this lives beside
 * `ICON_SLOT_STYLE` in the cross-cutting token layer rather than in any one
 * family's anatomy: the row is the same physical thing wherever it appears, and
 * the entity decides its *colours*, not its box.
 *
 * ## Why this exists
 *
 * It was measured, not assumed, and the family was already split down the
 * middle. In Chromium at 1280 and 390:
 *
 * | row              | height | block inset | floor |
 * | ---------------- | ------ | ----------- | ----- |
 * | `MenuItem`       | 32px   | `sm`        | `hit` |
 * | `GridListItem`   | 32px   | `sm`        | `hit` |
 * | `SelectItem`     | **44** | `md`        | none  |
 * | `ComboBoxItem`   | **44** | `md`        | none  |
 * | `ListBoxItem`    | **44** | `md`        | none  |
 *
 * Three members were right and three were 12px taller, and the two that were
 * right were right by hand. 32px is also exactly what the reference system
 * specifies: its medium menu row derives to `component-height-100` — 11px
 * `menu-item-top-to-selected-icon-medium` + a 10px `checkmark-icon-size-100` +
 * 11px = **32px desktop**, and 13 + 14 + 13 = **40px mobile**, the same ramp a
 * field's height comes from. So an option row is the field row's content box:
 * the field adds a 1px border on each edge, the row draws none, and both resolve
 * from the same inset and the same type. Since fsl-theme ADR-022 the control
 * inset is a fixed-px contract, so the pair reads 32/34 wherever the fluid
 * type is at its 16px top (~900px and up; below that both meet the `hit`
 * floor — the inset ramp itself is gone: F-035, closed). The rule is still
 * the tokens; the pixels are what the base theme's values produce.
 *
 * The floor matters for the same reason it matters on a field: `hit` is the
 * ergonomic minimum, so a row whose content is shorter than a line of text is
 * still large enough to hit. Three rows had no floor at all.
 *
 * ## The ring is inset, and that is arithmetic
 *
 * Every one of these rows lives inside a clipped or scrolling surface, so the
 * ring must stay inside the row's own box — see `FOCUS_RING_INSET` for the
 * measurement that settles the value. Four different offsets were in use across
 * the five rows (`2px` via the constant, `2px` twice as a hand-written literal,
 * `-1px`, `-2px`), and only the negated ring width cannot clip.
 */
export const CHOOSABLE_ROW = {
  /** Ergonomic floor — the row is at least a hit target tall. */
  minHeight: vars.sizing.hit,
  /** Block inset: the field row's, so an option matches the field it belongs to. */
  insetBlock: vars.spacing.inset.control.sm,
  /** Inline inset. */
  insetInline: vars.spacing.inset.control.md,
  /** Corner radius — the row is a control, not a surface. */
  radius: vars.radii.control,
  /** Composite text style (spread into the style object). */
  text: vars.text.label.md as React.CSSProperties,
  /** The ring stays inside the row, because the row is inside a clipped box. */
  focusOffset: FOCUS_RING_INSET,
} as const;

/**
 * The box of a choosable row. Colours stay with the caller: they come from the
 * entity, and a Menu row, a Select option and a GridList row legitimately paint
 * different resting states from different subtrees.
 *
 * @example
 * ```tsx
 * style={({ isFocusVisible, ...flags }) => ({
 *   ...buildChoosableRowStyle(),
 *   backgroundColor: resolveInteractiveStyle(colors?.background, flags),
 *   outline: focusRingOutline(isFocusVisible),
 * })}
 * ```
 */
export const buildChoosableRowStyle = (): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    minHeight: CHOOSABLE_ROW.minHeight,
    paddingBlock: CHOOSABLE_ROW.insetBlock,
    paddingInline: CHOOSABLE_ROW.insetInline,
    borderRadius: CHOOSABLE_ROW.radius,
    outlineOffset: CHOOSABLE_ROW.focusOffset,
    ...CHOOSABLE_ROW.text,
  };
};
