import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
import { Icon } from '../Icon';

/**
 * The in-control validation glyph — the alert mark inside an invalid field's
 * box (forms item H; the remaining answer to F-032's WCAG 1.4.1 note, where
 * it is reinforcement rather than the fix: the message already carries the
 * valence in words and ink).
 *
 * The reference names it at the **field** level (`field-edge-to-alert-icon`,
 * whose medium step is 12px — exactly `inset.control.md` since ADR-022), so
 * it is a family adornment and not a per-component flourish: every member
 * renders it from here, gated on its own `isInvalid` render prop.
 *
 * `aria-hidden`, because the semantics already travel twice — `aria-invalid`
 * on the control and the validation message's text. Its ink is the reporting
 * valence (`input.negative.text`, the §3.2 split): like the message, the
 * glyph is a part that reports the outcome, not the control re-voiced.
 */
export const FieldInvalidGlyph = ({
  scope,
  isInvalid,
  multiline,
  edgeInset = true,
}: {
  /** The host component's published `data-scope`. */
  scope: string;
  /** The host's own render-prop flag — the glyph renders only while invalid. */
  isInvalid?: boolean;
  /** Pin to the top edge inside a multiline frame. */
  multiline?: boolean;
  /**
   * Whether the glyph carries its own edge margin (`inset.control.md` — the
   * reference's `field-edge-to-alert-icon`). A frame has no padding, so the
   * glyph brings the inset; a padded host with a `gap` (`Select`'s trigger)
   * already positions it and passes `false`.
   */
  edgeInset?: boolean;
}): React.ReactElement | null => {
  if (isInvalid !== true) return null;

  return (
    <span
      data-scope={scope}
      data-part="validationGlyph"
      aria-hidden
      style={{
        ...ICON_SLOT_STYLE,
        flex: 'none',
        marginInlineEnd: edgeInset ? vars.spacing.inset.control.md : undefined,
        color: vars.colors.input.negative.text?.default,
        pointerEvents: 'none',
        ...(multiline
          ? {
              alignSelf: 'start',
              marginBlockStart: vars.spacing.inset.control.sm,
            }
          : {}),
      }}
    >
      <Icon intent="status.alert" size="sm" />
    </span>
  );
};
