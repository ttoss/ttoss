import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  SwitchButton as RACSwitchButton,
  SwitchField as RACSwitchField,
  type SwitchFieldProps as RACSwitchFieldProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { FOCUS_RING_OFFSET } from '../../tokens/focusRing';
import {
  buildSelectionMarkStyle,
  buildSelectionOptionRowStyle,
  resolveSelectionLabelInk,
  SELECTION_CONTROL,
} from '../../tokens/selectionControl';
import {
  FieldDescriptionPart,
  FieldNecessityMarker,
  fieldSideColumn,
  FieldValidationMessagePart,
  useFieldLayout,
} from '../Field/anatomy';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `round` (track + thumb = pill shape),
//   border: `outline.control`, sizing: `hit`,
//   spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// The root is React Aria's `SwitchField` + `SwitchButton`, not its `Switch` —
// which RAC 1.19 marks `@deprecated: Use SwitchField + SwitchButton instead`.
// The split is what restores validation: plain `SwitchProps` omits
// `isRequired`/`isInvalid`/`validate` outright, while `SwitchField` owns them
// and supplies `TextContext` + `FieldErrorContext` (read in the RAC source,
// not the types alone), so the shared envelope parts work here unchanged.
// That closes F-033's Switch half: a switch that must be ON — an
// acknowledgement, a legal gate — can now say why it refused.
//
// The structure also dodges the trap A2 measured on `Checkbox`: there the
// root IS a `<label>`, so copy placed inside it is absorbed into the
// accessible name. Here RAC gives us a `<div>` root with the `<label>`
// (`SwitchButton`) as one child and the copy as siblings — the envelope's
// own shape.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Switch root (Selection entity, toggle.binary). */
export const switchMeta = {
  displayName: 'Switch',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

// Track and thumb geometry (layout constants — not semantic tokens; named per
// CONTRIBUTING §4). The values are the reference's **large** step, the same
// step the shared selection scale is derived from: `switch-control-width-large`
// 30px × height 18px — the height IS `SELECTION_CONTROL.size`, so the track
// aligns with the checkbox and radio beside it. The previous track was
// `2.5rem × 1.5rem` (40×24), larger than S2's extra-large (34×20).
const TRACK_W = '1.875rem';
const TRACK_H = SELECTION_CONTROL.size;
// The handle grows when ON — the reference's signature detail
// (`switch-handle-size-large` 10px → `-selected-` 12px), which reads as the
// switch taking hold. Offsets are derived from the track's content box
// (18 − 2×1px border = 16): (16 − thumb) / 2.
const THUMB_SIZE = '0.625rem';
const THUMB_SIZE_SELECTED = '0.75rem';
const THUMB_OFFSET = '0.1875rem';
const THUMB_OFFSET_SELECTED = '0.125rem';

type InputColors = typeof vars.colors.input.primary;

const TRACK_STYLE_STATIC = {
  boxSizing: 'border-box',
  position: 'relative',
  flexShrink: 0,
  display: 'inline-block',
  width: TRACK_W,
  height: TRACK_H,
  borderRadius: vars.radii.round,
  borderWidth: vars.border.outline.control.width,
  borderStyle: vars.border.outline.control.style,
  transitionProperty: 'background-color, border-color',
  transitionDuration: vars.motion.feedback.duration,
  transitionTimingFunction: vars.motion.feedback.easing,
  outlineOffset: FOCUS_RING_OFFSET,
} satisfies React.CSSProperties;

/**
 * Thumb color:
 *   ON  → text.checked (typically neutral.0 = white on brand track)
 *   OFF → border.default (typically neutral.300 = visible on light track)
 */
const resolveThumbColor = ({
  c,
  isSelected,
}: {
  c: InputColors;
  isSelected?: boolean;
}): string | undefined => {
  const text = c?.text;
  return isSelected ? (text?.checked ?? text?.default) : c?.border?.default;
};

/**
 * Props for the Switch component.
 */
export interface SwitchProps extends Omit<
  RACSwitchFieldProps,
  'style' | 'children' | 'className'
> {
  /**
   * Label content displayed next to the switch track.
   * Rendered inside a `data-part="label"` span.
   */
  children?: React.ReactNode;
  /**
   * Supporting hint under the label — what turning this on actually commits
   * the user to.
   */
  description?: React.ReactNode;
  /**
   * Validation message, shown only while the switch is invalid. Supply the
   * copy: a switch's rule is domain-specific ("confirm before enabling"),
   * which is not something the platform can phrase (ADR-001).
   */
  errorMessage?: React.ReactNode;
}

/**
 * The supporting copy under the row, aligned with the label's text — the same
 * reading column a `Checkbox`'s copy uses, indented past the track by the
 * row's own constants rather than by a measured number.
 *
 * The parts are the shared envelope ones, and that is the point of adopting
 * `SwitchField`: it supplies the `TextContext` and `FieldErrorContext` they
 * consume, so the description is linked via `aria-describedby` and the message
 * renders only while invalid — with the platform's own localized constraint
 * copy when no `errorMessage` is supplied, which is copy ADR-001 forbids us
 * to ship ourselves. `Checkbox` cannot do this (its error context stays quiet
 * on a lone checkbox, measured in A2); here the context is live, so the parts
 * are used as designed instead of re-implemented.
 */
const SwitchSupportingCopy = ({
  c,
  description,
  errorMessage,
}: {
  c: InputColors;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
}) => {
  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
        paddingInlineStart: `calc(${TRACK_W} + ${vars.spacing.gap.inline.sm})`,
      }}
    >
      {description !== undefined && (
        <FieldDescriptionPart scope="switch" colors={c}>
          {description}
        </FieldDescriptionPart>
      )}
      <FieldValidationMessagePart scope="switch" colors={c}>
        {errorMessage}
      </FieldValidationMessagePart>
    </span>
  );
};

/**
 * A semantic on/off toggle built on React Aria's `SwitchField` +
 * `SwitchButton` (the non-deprecated pair since RAC 1.19).
 *
 * Entity = Selection → reads `vars.colors.input.primary.*`, radii: `round`
 * (pill track + circular thumb), border: `outline.control`,
 * sizing: `hit`, motion: `feedback`.
 *
 * Validation is the `invalid` State, never an Evaluation: a switch that must
 * be ON to proceed (`isRequired` inside a `Form`, or a `validate` callback)
 * blocks the submit and reports why through `errorMessage`.
 *
 * @example
 * ```tsx
 * <Switch>Enable notifications</Switch>
 * <Switch defaultSelected>Dark mode</Switch>
 * <Switch isRequired errorMessage="Confirm before continuing.">
 *   I understand this deletes the workspace
 * </Switch>
 * ```
 */
export const Switch = ({
  children,
  description,
  errorMessage,
  ...props
}: SwitchProps) => {
  const { labelPosition } = useFieldLayout();
  const c = vars.colors.input.primary;
  const hasSupport = description !== undefined || errorMessage !== undefined;

  return (
    <RACSwitchField
      {...props}
      data-scope="switch"
      data-part="root"
      style={{
        // Same as `Checkbox`: the label is the row, so `labelPosition` moves
        // nothing — but the row still needs a column inside a side-label Form,
        // and it is the control's, because the track IS the control.
        ...fieldSideColumn(labelPosition, 'control'),
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
      }}
    >
      {({ isInvalid }) => {
        return (
          <>
            {/* button — the clickable row: track, thumb and label. Internal
                part (RAC's own name for it); the published identity stays on
                the root. */}
            <RACSwitchButton
              data-scope="switch"
              data-part="button"
              style={({ isDisabled }) => {
                return buildSelectionOptionRowStyle({ isDisabled });
              }}
            >
              {({
                isHovered,
                isPressed,
                isDisabled,
                isFocusVisible,
                isSelected,
                isRequired,
              }) => {
                // Thumb geometry — the handle grows when ON (the reference's
                // own gesture), so the offset shrinks with it: both states
                // centre on the track's content box.
                const thumbSize = isSelected ? THUMB_SIZE_SELECTED : THUMB_SIZE;
                const thumbOffset = isSelected
                  ? THUMB_OFFSET_SELECTED
                  : THUMB_OFFSET;
                // Logical property: under `dir="rtl"` the thumb correctly
                // slides left instead of right.
                const thumbInsetInlineStart = isSelected
                  ? `calc(100% - ${thumbSize} - ${thumbOffset})`
                  : thumbOffset;

                return (
                  <>
                    {/* control — the sliding track */}
                    <span
                      data-scope="switch"
                      data-part="control"
                      aria-hidden
                      style={buildSelectionMarkStyle({
                        base: TRACK_STYLE_STATIC,
                        colors: c,
                        flags: {
                          isDisabled,
                          isSelected,
                          isInvalid,
                          isHovered,
                          isPressed,
                          isFocusVisible,
                        },
                      })}
                    >
                      {/* indicator — the sliding thumb */}
                      <span
                        data-scope="switch"
                        data-part="indicator"
                        aria-hidden
                        style={{
                          position: 'absolute',
                          insetBlockStart: thumbOffset,
                          insetInlineStart: thumbInsetInlineStart,
                          width: thumbSize,
                          height: thumbSize,
                          borderRadius: vars.radii.round,
                          backgroundColor: resolveThumbColor({ c, isSelected }),
                          transitionProperty:
                            'inset-inline-start, inset-block-start, width, height, background-color',
                          transitionDuration: vars.motion.feedback.duration,
                          transitionTimingFunction: vars.motion.feedback.easing,
                        }}
                      />
                    </span>

                    {/* label */}
                    {children != null && (
                      <span
                        data-scope="switch"
                        data-part="label"
                        style={{
                          color: resolveSelectionLabelInk({
                            text: c?.text,
                            isInvalid,
                            isDisabled,
                          }),
                        }}
                      >
                        {children}
                        <FieldNecessityMarker isRequired={isRequired} />
                      </span>
                    )}
                  </>
                );
              }}
            </RACSwitchButton>

            {/* Rendered when copy was supplied — or while invalid, so a
                required switch with no `errorMessage` still reports the
                platform's own constraint copy through the always-mounted
                message part. Gated rather than always mounted because an
                empty wrapper would still claim the root's flex gap and grow
                a bare switch by it. */}
            {(hasSupport || isInvalid) && (
              <SwitchSupportingCopy
                c={c}
                description={description}
                errorMessage={errorMessage}
              />
            )}
          </>
        );
      }}
    </RACSwitchField>
  );
};
Switch.displayName = switchMeta.displayName;
