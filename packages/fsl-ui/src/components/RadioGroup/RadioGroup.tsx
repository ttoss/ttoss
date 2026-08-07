import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Radio as RACRadio,
  RadioGroup as RACRadioGroup,
  type RadioGroupProps as RACRadioGroupProps,
  type RadioProps as RACRadioProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import {
  buildSelectionMarkStyle,
  buildSelectionOptionRowStyle,
  resolveSelectionLabelInk,
  SELECTION_BOX_BASE,
  SELECTION_GROUP_STYLE,
} from '../../tokens/selectionControl';
import {
  FieldDescriptionPart,
  FieldLabelPart,
  FieldValidationMessagePart,
} from '../Field/anatomy';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control` (root) / `round` (radio circle),
//   border: `outline.control` (default) + `selected` (when checked),
//   sizing: `hit`, spacing: `inset.control`, typography: `label.md`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback flows from React Aria's `isInvalid` prop on the group
// (or `validate`/`validationBehavior`) into the `invalid` token state via the
// `isInvalid` render-prop on each Radio child — and, since forms C2, into a
// `validationMessage` part, so an invalid group can say why.
//
// FRICTION LOG (F-009's shape, one family over). Like `Select` and
// `CheckboxGroup`, the group's `description` and `validationMessage` ship as
// INTERNAL data-parts carrying no `*Meta`: the Selection entity's structural
// roles are root/control/label/indicator/selectionControl/item, and neither of
// those two is among them (they belong to Input). Third component to reach the
// same answer without widening the vocabulary.
// ---------------------------------------------------------------------------

/** Formal semantic identity — RadioGroup root (Selection entity, single-choice). */
export const radioGroupMeta = {
  displayName: 'RadioGroup',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

/** Formal semantic identity — Radio item (Selection entity, selectionControl + label). */
export const radioMeta = {
  displayName: 'Radio',
  entity: 'Selection',
  structure: 'selectionControl',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

// ---------------------------------------------------------------------------
// RadioGroup — root orchestrator
// ---------------------------------------------------------------------------

/**
 * Props for the RadioGroup component.
 */
export interface RadioGroupProps extends Omit<
  RACRadioGroupProps,
  'style' | 'children'
> {
  /** Group label displayed above the radio options. */
  label?: React.ReactNode;
  /**
   * A `<ContextualHelp>` element rendered beside the label (the reference
   * system's prop shape) — for the explanation too long for `description`.
   */
  contextualHelp?: React.ReactNode;
  /** Supplementary helper text linked to the group via `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Validation message shown when the group is invalid (`isInvalid` /
   * `validate`). Supply caller-localized copy (i18n rule / §6); omit it and the
   * platform's own constraint message is shown instead.
   */
  errorMessage?: React.ReactNode;
  /** Radio option children — must be `Radio` components. */
  children?: React.ReactNode;
}

/**
 * A semantic radio group built on React Aria.
 *
 * Orchestrates a set of mutually exclusive `Radio` options. Validation
 * feedback flows from `isInvalid` (or React Aria's `validate` callback) and
 * surfaces on each Radio via the `invalid` State.
 *
 * Entity = Selection, interaction = `select.single`.
 *
 * @example
 * ```tsx
 * <RadioGroup label="Size" defaultValue="md">
 *   <Radio value="sm">Small</Radio>
 *   <Radio value="md">Medium</Radio>
 *   <Radio value="lg">Large</Radio>
 * </RadioGroup>
 * ```
 */
export const RadioGroup = ({
  label,
  contextualHelp,
  description,
  errorMessage,
  children,
  ...props
}: RadioGroupProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACRadioGroup
      {...props}
      data-scope="radio-group"
      data-part="root"
      style={SELECTION_GROUP_STYLE}
    >
      {label != null && (
        <FieldLabelPart
          scope="radio-group"
          contextualHelp={contextualHelp}
          colors={c}
          isRequired={props.isRequired}
        >
          {label}
        </FieldLabelPart>
      )}
      {children}
      {description != null && (
        <FieldDescriptionPart scope="radio-group" colors={c}>
          {description}
        </FieldDescriptionPart>
      )}
      <FieldValidationMessagePart scope="radio-group" colors={c}>
        {errorMessage}
      </FieldValidationMessagePart>
    </RACRadioGroup>
  );
};
RadioGroup.displayName = radioGroupMeta.displayName;

// ---------------------------------------------------------------------------
// Radio — individual option
// ---------------------------------------------------------------------------

// Size and glyph scale come from the shared selection-control source; the
// circle is the one axis a radio differs on (`round` vs the halved control
// radius of a checkbox-shaped mark).
const RADIO_BOX_STATIC = {
  ...SELECTION_BOX_BASE,
  position: 'relative',
  borderRadius: vars.radii.round,
} satisfies React.CSSProperties;

/**
 * Props for the Radio component.
 */
export interface RadioProps extends Omit<RACRadioProps, 'style' | 'children'> {
  /** Label content displayed next to the radio indicator. */
  children?: React.ReactNode;
}

/**
 * A single radio option — must be used inside a `RadioGroup`.
 *
 * Renders a circular indicator (`data-part="selectionControl"`) with an
 * inner dot (`data-part="indicator"`) when selected. Reads the parent
 * group's `isInvalid` from React Aria's render props and surfaces the
 * `invalid` State on the control.
 *
 * @example
 * ```tsx
 * <Radio value="sm">Small</Radio>
 * ```
 */
export const Radio = ({ children, ...props }: RadioProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACRadio
      {...props}
      data-scope="radio"
      data-part="root"
      style={({ isDisabled }) => {
        return {
          ...buildSelectionOptionRowStyle({ isDisabled }),
          color: isDisabled ? c?.text?.disabled : c?.text?.default,
        } as React.CSSProperties;
      }}
    >
      {({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
        isInvalid,
      }) => {
        const text = c?.text;

        return (
          <>
            {/* selectionControl — circular radio indicator */}
            <span
              data-scope="radio"
              data-part="selectionControl"
              aria-hidden
              style={buildSelectionMarkStyle({
                base: RADIO_BOX_STATIC,
                colors: c,
                flags: {
                  isSelected,
                  isInvalid,
                  isDisabled,
                  isHovered,
                  isPressed,
                  isFocusVisible,
                },
                selectedBorderWidth: vars.border.outline.selected.width,
              })}
            >
              {/* indicator — inner dot when selected */}
              {isSelected && (
                <span
                  data-scope="radio"
                  data-part="indicator"
                  aria-hidden
                  style={{
                    width: '0.4375rem',
                    height: '0.4375rem',
                    borderRadius: vars.radii.round,
                    backgroundColor: text?.checked ?? text?.default,
                    flexShrink: 0,
                  }}
                />
              )}
            </span>

            {/* label */}
            {children != null && (
              <span
                data-scope="radio"
                data-part="label"
                style={{
                  color: resolveSelectionLabelInk({
                    text,
                    isInvalid,
                    isDisabled,
                  }),
                }}
              >
                {children}
              </span>
            )}
          </>
        );
      }}
    </RACRadio>
  );
};
Radio.displayName = radioMeta.displayName;
