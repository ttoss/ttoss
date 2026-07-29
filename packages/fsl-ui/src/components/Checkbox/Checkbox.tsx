import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  Checkbox as RACCheckbox,
  type CheckboxProps as RACCheckboxProps,
  Text as RACText,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import {
  SELECTION_BOX_BASE,
  SELECTION_CONTROL,
} from '../../tokens/selectionControl';
import {
  buildFieldTextPartStyle,
  type FieldLabelPosition,
  FieldNecessityMarker,
  fieldSideColumn,
  useFieldLayout,
} from '../Field/anatomy';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`,
//   border: `outline.control` (default) + `selected` (when checked/indeterminate),
//   sizing: `hit`, spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback is a **runtime State** (`invalid`), driven by React
// Aria's `isInvalid` and surfaced by the `invalid` token column. It is not
// an authorial Evaluation. See `taxonomy.ts` design note on
// `ENTITY_EVALUATION` for the full rationale.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Checkbox root (Selection entity, toggle.binary). */
export const checkboxMeta = {
  displayName: 'Checkbox',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

type InputColors = typeof vars.colors.input.primary;

// Static box chrome — flag-independent, hoisted so the render callback only
// computes the state-dependent leaves. Size, glyph scale and the halved
// radius come from the shared selection-control source (`SELECTION_CONTROL`),
// so the mark cannot drift from `Radio`, `Switch` and `GridList`'s.
const BOX_STYLE_STATIC = {
  ...SELECTION_BOX_BASE,
  borderRadius: SELECTION_CONTROL.checkboxRadius,
} satisfies React.CSSProperties;

/** Box (selectionControl) style — the visual checkbox square. */
const buildBoxStyle = ({
  c,
  isSelected,
  isIndeterminate,
  isInvalid,
  isDisabled,
  isHovered,
  isPressed,
  isFocusVisible,
}: {
  c: InputColors;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  const checkedLike = isSelected || isIndeterminate;
  return {
    ...BOX_STYLE_STATIC,
    borderWidth: checkedLike
      ? vars.border.outline.selected.width
      : vars.border.outline.control.width,
    backgroundColor: resolveInteractiveStyle(c?.background, {
      isDisabled,
      isInvalid,
      isSelected,
      isIndeterminate,
      isHovered,
      isPressed,
    }),
    borderColor: resolveInteractiveStyle(c?.border, {
      isDisabled,
      isInvalid,
      isSelected,
      isIndeterminate,
      isFocusVisible,
    }),
    outline: focusRingOutline(isFocusVisible),
  };
};

/**
 * The row the box and its copy sit in. Supporting copy turns it into a
 * two-column grid: the box holds its column, the copy stacks in the next one,
 * and `start` alignment keeps the box on the label's first line instead of
 * floating to the middle of a two-line description.
 */
const buildCheckboxRowStyle = ({
  c,
  isDisabled,
  hasSupport,
  labelPosition,
}: {
  c: InputColors;
  isDisabled?: boolean;
  hasSupport: boolean;
  labelPosition: FieldLabelPosition;
}): React.CSSProperties => {
  const text = c?.text;

  return {
    // A Checkbox ignores `labelPosition` for its *label* — that label is the row,
    // and a side label exists to pull a label out of the stack above a control,
    // which this never had. It does not ignore the **placement**: inside a
    // side-label Form the row still has to land somewhere, and it belongs in the
    // control column, because the box IS the control. Left in the label column it
    // read as a caption for whatever shared its grid row — measured in the
    // Studio's settings form, where it sat beside the Save button.
    ...fieldSideColumn(labelPosition, 'control'),
    boxSizing: 'border-box',
    display: hasSupport ? 'grid' : 'inline-flex',
    gridTemplateColumns: hasSupport ? 'auto 1fr' : undefined,
    alignItems: hasSupport ? 'start' : 'center',
    gap: vars.spacing.gap.inline.sm,
    minHeight: vars.sizing.hit,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    ...(vars.text.label.md as React.CSSProperties),
    color: isDisabled ? text?.disabled : text?.default,
  } as React.CSSProperties;
};

/** Indicator glyph color — a theme may omit the dimension; degrade to undefined. */
const resolveIndicatorColor = ({
  text,
  isIndeterminate,
}: {
  text: InputColors['text'];
  isIndeterminate?: boolean;
}): string | undefined => {
  return isIndeterminate
    ? (text?.indeterminate ?? text?.checked ?? text?.default)
    : (text?.checked ?? text?.default);
};

/** Label color — invalid dominates disabled dominates default. */
const resolveLabelColor = ({
  text,
  isInvalid,
  isDisabled,
}: {
  text: InputColors['text'];
  isInvalid?: boolean;
  isDisabled?: boolean;
}): string | undefined => {
  if (isInvalid) return text?.invalid;
  if (isDisabled) return text?.disabled;
  return text?.default;
};

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps extends Omit<
  RACCheckboxProps,
  'style' | 'children'
> {
  /**
   * Label content displayed next to the checkbox indicator.
   * Rendered inside a `data-part="label"` span.
   */
  children?: React.ReactNode;
  /**
   * Supporting hint under the label — a constraint, or what checking this
   * actually commits the user to.
   */
  description?: React.ReactNode;
  /**
   * Validation message, shown only while the checkbox is invalid. Supply the
   * copy: a checkbox's rule is domain-specific ("confirm you have read the
   * terms"), which is not something the platform can phrase (ADR-001).
   */
  errorMessage?: React.ReactNode;
}

/**
 * The label plus the copy it names, stacked beside the box.
 *
 * Internal, and separate for a reason the linter surfaced: folded into the
 * root's render callback it pushed that function past its line and complexity
 * budgets, which is the honest signal that the row had grown a second job.
 */
const CheckboxSupportingCopy = ({
  c,
  labelId,
  supportId,
  description,
  errorMessage,
  isInvalid,
  isRequired,
  labelColor,
  children,
}: {
  c: InputColors;
  labelId: string;
  supportId: string;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode;
  isInvalid?: boolean;
  isRequired?: boolean;
  labelColor?: string;
  children?: React.ReactNode;
}) => {
  const stack: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing.gap.stack.xs,
  };

  return (
    <span style={stack}>
      <span
        id={labelId}
        data-scope="checkbox"
        data-part="label"
        style={{ color: labelColor }}
      >
        {children}
        <FieldNecessityMarker isRequired={isRequired} />
      </span>
      {/*
        A column, because both parts render inline `<span>`s and ran together on
        one line otherwise — "…after accepting.Confirm you…" in the Studio's
        invite dialog, caught by looking at it.
      */}
      <span id={supportId} style={stack}>
        {description !== undefined && (
          <RACText
            slot="description"
            data-scope="checkbox"
            data-part="description"
            style={buildFieldTextPartStyle({ colors: c, step: 'sm' })}
          >
            {description}
          </RACText>
        )}
        {/*
          Gated on the render-prop `isInvalid` — the same flag that tints the
          label — rather than on React Aria's `FieldError`. Measured:
          `FieldError` returns null unless its context reports invalid, and on a
          lone Checkbox that context stays quiet even when the input carries
          `aria-invalid="true"` and the form refuses to submit. The flag is the
          state we can see, so it is the state we render from.
        */}
        {isInvalid === true && errorMessage !== undefined && (
          <span
            data-scope="checkbox"
            data-part="validationMessage"
            style={buildFieldTextPartStyle({
              colors: c,
              step: 'sm',
              tone: 'negative',
            })}
          >
            {errorMessage}
          </span>
        )}
      </span>
    </span>
  );
};

/**
 * A semantic selection checkbox built on React Aria.
 *
 * Entity = Selection → reads `vars.colors.input.primary.*`. Validation
 * feedback is rendered via the `invalid` State (driven by React Aria's
 * `isInvalid` prop or form-library validation), not via an Evaluation
 * variant.
 *
 * @example
 * ```tsx
 * <Checkbox>Accept terms</Checkbox>
 * <Checkbox isInvalid>Accept terms (must be checked)</Checkbox>
 * <Checkbox isIndeterminate>Partially selected</Checkbox>
 * ```
 */
export const Checkbox = ({
  children,
  description,
  errorMessage,
  ...props
}: CheckboxProps) => {
  const c = vars.colors.input.primary;
  const { labelPosition } = useFieldLayout();
  // Supporting copy turns the row into a two-column grid, and it also has to
  // stop contributing to the control's accessible NAME. Measured: with a
  // description inside the label, the name became "Accept termsYou agree to the
  // terms." and a name query for the label alone stopped matching — React Aria
  // computes the name from the label's content, and the label is the row. So
  // the name is pinned to the label span and the supporting parts are linked as
  // a description instead.
  const ids = React.useId();
  const hasSupport = description !== undefined || errorMessage !== undefined;
  const labelId = `${ids}-label`;
  const describedBy = hasSupport ? `${ids}-support` : undefined;

  return (
    <RACCheckbox
      {...props}
      aria-labelledby={hasSupport ? labelId : props['aria-labelledby']}
      aria-describedby={describedBy ?? props['aria-describedby']}
      data-scope="checkbox"
      data-part="root"
      style={({ isDisabled }) => {
        return buildCheckboxRowStyle({
          c,
          isDisabled,
          hasSupport,
          labelPosition,
        });
      }}
    >
      {({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
        isIndeterminate,
        isInvalid,
        isRequired,
      }) => {
        const text = c?.text;
        const showIndicator = isSelected || isIndeterminate;

        return (
          <>
            {/* selectionControl — the visual checkbox box */}
            <span
              data-scope="checkbox"
              data-part="selectionControl"
              aria-hidden
              style={buildBoxStyle({
                c,
                isSelected,
                isIndeterminate,
                isInvalid,
                isDisabled,
                isHovered,
                isPressed,
                isFocusVisible,
              })}
            >
              {/* indicator — checkmark or dash */}
              {showIndicator && (
                <span
                  data-scope="checkbox"
                  data-part="indicator"
                  aria-hidden
                  style={{
                    ...ICON_SLOT_STYLE,
                    color: resolveIndicatorColor({ text, isIndeterminate }),
                    userSelect: 'none',
                  }}
                >
                  {/* `text` (1em) resolves against the box's own glyph scale
                      (`SELECTION_BOX_BASE.fontSize`), never against a fluid
                      ramp step: measured, `size="sm"` rendered 20×20 inside
                      this 18×18 box on any wide surface. */}
                  <Icon
                    intent={
                      isIndeterminate
                        ? 'selection.indeterminate'
                        : 'selection.checked'
                    }
                    size="text"
                  />
                </span>
              )}
            </span>

            {hasSupport ? (
              <CheckboxSupportingCopy
                c={c}
                labelId={labelId}
                supportId={describedBy as string}
                description={description}
                errorMessage={errorMessage}
                isInvalid={isInvalid}
                isRequired={isRequired}
                labelColor={resolveLabelColor({ text, isInvalid, isDisabled })}
              >
                {children}
              </CheckboxSupportingCopy>
            ) : (
              children != null && (
                <span
                  data-scope="checkbox"
                  data-part="label"
                  style={{
                    color: resolveLabelColor({ text, isInvalid, isDisabled }),
                  }}
                >
                  {children}
                  <FieldNecessityMarker isRequired={isRequired} />
                </span>
              )
            )}
          </>
        );
      }}
    </RACCheckbox>
  );
};
Checkbox.displayName = checkboxMeta.displayName;
