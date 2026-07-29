import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { FOCUS_RING_INSET, focusRingOutline } from './focusRing';
import { resolveInteractiveStyle } from './resolveInteractiveStyle';

/**
 * Geometry of an **embedded trigger** — an Action that lives *inside* a field's
 * box: a `SearchField`'s clear button, a `NumberField`'s two steppers, a
 * `ComboBox`'s chevron.
 *
 * Like `CHOOSABLE_ROW`, it sits in the cross-cutting token layer rather than in
 * a family's anatomy, and for the same reason: the thing is physically identical
 * wherever it appears, spans more than one component, and the host decides its
 * *colours* and not its box.
 *
 * ## It is a real primitive, not a convenience
 *
 * The reference system names it as its own component — `in-field-button`, with
 * its own layout token set (`in-field-button-edge-to-fill`,
 * `in-field-button-width-stacked-*`, `in-field-stepper-to-end-*`). So "a button
 * inside a field" is a distinct silhouette upstream too, alongside the command
 * and utility postures this package already has in `ActionTrigger/anatomy.tsx`.
 *
 * ## Why it exists here: three components, three different boxes
 *
 * Measured in Chromium at 1280px before this module existed:
 *
 * | trigger                        | box       | glyph size prop | inline padding |
 * | ------------------------------ | --------- | --------------- | -------------- |
 * | `NumberField` stepper (×2)     | 32×32     | `sm`            | 6px            |
 * | `ComboBox` chevron             | **25.33** | `text`          | 6px            |
 * | `SearchField` clear button     | **20×20** | `sm`            | 0              |
 *
 * Two independent causes, which is why the spread is three numbers and not two.
 * **The glyph:** `ComboBox` asked for `size="text"`, which is font-relative, and
 * a `<button>` that declares no type of its own inherits the UA's `13.3333px`
 * rather than the 16px of the field around it — so its glyph resolved 13.33px
 * and the box came out `13.33 + 6 + 6`. **The padding:** `SearchField` had none,
 * so its box was exactly its 20px glyph.
 *
 * `NumberField` was the one that was already right, so this module states its
 * geometry rather than inventing a fourth number: a square of the field's
 * interior, holding a `sizing.icon.sm` glyph with `inset.control.sm` around it
 * (20 + 6 + 6 = 32 at 1280px). That also matches the reference's aesthetic —
 * `in-field-button-edge-to-fill-medium` is `6px`, the same inset, against a
 * `component-height-100` field.
 *
 * ## The box is 32 and not 20, and that is an accessibility floor
 *
 * The reference's token is named `edge-to-*fill*`, and reading it as the *target*
 * would put the clear button at 20×20 — which fails WCAG 2.5.8 Target Size
 * (Minimum), AA, at 24×24 CSS px. `SearchField` was shipping that, and
 * `ComboBox`'s 25.33 cleared it by 1.33px. 2.5.8's spacing exception cannot
 * rescue the steppers either, because they are adjacent to each other. So the
 * **interactive** box takes the field's interior (`hit`, the theme's own
 * ergonomic floor) while the 6px reads as the glyph's breathing room rather than
 * as a smaller target. Fill and target are two different questions and the
 * reference's naming is evidence for the split, not against it.
 *
 * Measured, and it settles the point: every embedded trigger in the family is
 * `tabindex="-1"` — React Aria excludes all three from the tab order. They are
 * **pointer-only** controls, and pointer target size is precisely what 2.5.8
 * governs, so the floor is the operative constraint and not a cautious reading.
 *
 * The numbers above are measured at 1280px and, since fsl-theme ADR-022 fixed
 * the control inset, no longer ride an inset ramp (F-035, closed) — the only
 * residual variation is the fluid type meeting the `hit` floor at the narrow
 * end. The rule is the tokens.
 */
export const EMBEDDED_TRIGGER = {
  /** Ergonomic floor on both axes — the trigger is at least a hit target. */
  minSize: vars.sizing.hit,
  /** Space around the glyph. The reference's `edge-to-fill` at the same step. */
  inset: vars.spacing.inset.control.sm,
  /** Glyph step. Declared in tokens so nothing resolves against a UA font-size. */
  glyph: vars.sizing.icon.sm,
  /** Corner radius — the generic control radius, as every in-field box uses. */
  radius: vars.radii.control,
  /**
   * The trigger declares the field row's type although it renders no text.
   * This is the load-bearing line: a `<button>` with no type of its own inherits
   * the UA's `13.3333px`, and anything font-relative inside it — an `Icon` asked
   * for `size="text"`, an `em` length — silently shrinks with it.
   */
  text: vars.text.label.md as React.CSSProperties,
  /**
   * Inside a field's clipped interior the ring must not reach past the field's
   * own border, so it is inset for the same arithmetic as a choosable row's.
   */
  focusOffset: FOCUS_RING_INSET,
} as const;

/** The colour subtree an embedded trigger paints from — its **host's**. */
type TriggerColors = typeof vars.colors.input.primary;

/**
 * The style of an embedded trigger, resolved through the canonical cascade.
 *
 * It paints no border: the field around it already draws one, and a second edge
 * 6px inside the first reads as a seam.
 *
 * ## The colours are the host's, and that is enforced rather than chosen
 *
 * A clear button or a stepper *behaves* like an Action, so `action.muted` — the
 * system's "no fill" rung — looks like the obvious read. It is not available
 * here: the "entity → ux-context alignment" contract test binds a source file's
 * colour reads to the entities that file **declares**, and these hosts declare
 * `Input` only. `NumberField` carries the finding in its own header, where it is
 * recorded as deferred under the evidence rule rather than as an oversight.
 *
 * Taking the host's subtree is not a workaround for that, though — it is the
 * same division `CHOOSABLE_ROW` already draws, where the shared module owns the
 * box and the host owns the palette. And it costs nothing visually: measured,
 * `input.primary.background` resolves `neutral.0` at rest and `neutral.50` on
 * hover, which is byte-identical to `action.muted.background`'s first two rungs.
 * The trigger is invisible against the field it sits in until the pointer
 * arrives, which is what both roles were designed to do.
 *
 * It also removes a hard-coded `background: 'transparent'` from every one of
 * these triggers — the F-024 shape, an untokenised "paint nothing" that no
 * contrast audit can see.
 */
export const buildEmbeddedTriggerStyle = ({
  colors,
  isHovered,
  isDisabled,
  isFocusVisible,
}: {
  colors: TriggerColors;
  isHovered?: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    minInlineSize: EMBEDDED_TRIGGER.minSize,
    minBlockSize: EMBEDDED_TRIGGER.minSize,
    padding: EMBEDDED_TRIGGER.inset,
    border: 0,
    borderRadius: EMBEDDED_TRIGGER.radius,
    cursor: isDisabled ? 'default' : 'pointer',
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    transitionProperty: 'background-color, color',
    backgroundColor: resolveInteractiveStyle(colors?.background, {
      isHovered,
      isDisabled,
    }),
    color:
      resolveInteractiveStyle(colors?.text, { isHovered, isDisabled }) ??
      colors?.text?.default,
    // Both halves. Lint caught the first draft applying only the offset, which
    // leaves the UA's own ring in place nudged by our inset — and the private
    // helpers this module replaced set neither property.
    //
    // Measured before claiming this fixes anything for keyboard users: it does
    // not, because **every embedded trigger in the family is `tabindex="-1"`**.
    // React Aria excludes all three — the steppers because the spinbutton input
    // owns the arrow keys, the chevron and the clear button because the input is
    // the tab stop (a search field clears on Escape). So the ring is reachable
    // only by programmatic focus, and that is why its absence went unnoticed.
    // It is declared for consistency and for the programmatic case, not as a
    // defect fix.
    //
    // The same measurement is what makes the `hit`-sized box the right call
    // rather than a cautious one: these are **pointer-only** controls, and
    // pointer target size is exactly what WCAG 2.5.8 governs.
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: EMBEDDED_TRIGGER.focusOffset,
    ...EMBEDDED_TRIGGER.text,
  } as React.CSSProperties;
};
