import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  Group as RACGroup,
  Input as RACInput,
  NumberField as RACNumberField,
  type NumberFieldProps as RACNumberFieldProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { buildEmbeddedTriggerStyle } from '../../tokens/embeddedTrigger';
import {
  buildFieldFrameStyle,
  buildFieldRootStyle,
  buildFieldValueStyle,
  FieldDescriptionPart,
  FieldLabelPart,
  FieldValidationMessagePart,
  useFieldLayout,
} from '../Field/anatomy';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`, sizing: `hit`,
//   spacing: `inset.control`, typography: `label.md`, motion: `feedback`,
//   elevation: `flat`.
//
// A numeric input with a `Group` control box holding the `<input>` between a
// decrement and an increment stepper. Validation flows from React Aria's
// `isInvalid`/`validate` into the `invalid` State on the control box + error.
//
// FRICTION LOG (FSL validation):
//  1. The ROADMAP structure lists "trigger(steppers)×2", but `trigger` is not
//     a legal structural role for Input (nor for Action) — only Disclosure
//     has it. Like Select (root + item metas; label/trigger/content/etc. are
//     internal data-parts), NumberField declares only the root meta and
//     renders label/control/steppers/description/validationMessage as INTERNAL
//     data-parts carrying no `*Meta` — so no illegal role is ever claimed.
//  2. The steppers are conceptually "Action-pattern" (buttons), but a source
//     file's color reads are bound to its DECLARED entities by the
//     entity→ux-context contract test. This file declares only `Input`, so the
//     steppers consume Input chrome (`vars.colors.input.*`), not
//     `vars.colors.action.*`. Modelling them as declared Action identities
//     would require a second entity meta in this file; per "no taxonomy
//     additions" + the evidence rule that is deferred. The Action↔Input
//     composition is still exercised at the behavior level (the stepper
//     buttons drive the Input's value). See ROADMAP NumberField row.
// ---------------------------------------------------------------------------

/** Formal semantic identity — NumberField root (Input entity). */
export const numberFieldMeta = {
  displayName: 'NumberField',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Props for the NumberField component. */
export interface NumberFieldProps extends Omit<
  RACNumberFieldProps,
  'style' | 'children' | 'className'
> {
  /** Visible label displayed above the field. */
  label?: React.ReactNode;
  /**
   * A `<ContextualHelp>` element rendered beside the label (the reference
   * system's prop shape) — for the explanation too long for `description`.
   */
  contextualHelp?: React.ReactNode;
  /** Supplementary helper text linked to the field via `aria-describedby`. */
  description?: React.ReactNode;
  /**
   * Validation message shown when the field is invalid. Supply
   * caller-localized copy (i18n rule / §6).
   */
  errorMessage?: React.ReactNode;
  /**
   * Accessible name for the decrement stepper (the icon is the sole carrier of
   * meaning). Ships a documented English fallback (supplementary AT text, not
   * a flow-critical label — i18n rule §6.2); localized hosts override it.
   * @default 'Decrease'
   */
  decrementLabel?: string;
  /**
   * Accessible name for the increment stepper. Documented English fallback,
   * overridable (i18n rule §6.2).
   * @default 'Increase'
   */
  incrementLabel?: string;
}

/**
 * A semantic numeric input built on React Aria's `NumberField`.
 *
 * Renders a labelled control box (`Group`) holding the `<input>` between a
 * decrement (−) and increment (+) stepper. Entity = Input → reads
 * `vars.colors.input.primary.*`. Supports `minValue`/`maxValue`/`step` and
 * locale-aware `formatOptions` (currency, percent, units). Validation is the
 * `invalid` State (via `isInvalid`/`validate`), never an `evaluation` variant.
 *
 * @example
 * ```tsx
 * <NumberField label="Quantity" minValue={0} defaultValue={1}>
 * </NumberField>
 * <NumberField
 *   label="Price"
 *   formatOptions={{ style: 'currency', currency: 'USD' }}
 * />
 * ```
 */
export const NumberField = ({
  label,
  contextualHelp,
  description,
  errorMessage,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  ...props
}: NumberFieldProps) => {
  const c = vars.colors.input.primary;
  const { labelPosition } = useFieldLayout();

  return (
    <RACNumberField
      {...props}
      data-scope="number-field"
      data-part="root"
      style={buildFieldRootStyle({ labelPosition })}
    >
      {label != null && (
        <FieldLabelPart
          scope="number-field"
          contextualHelp={contextualHelp}
          colors={c}
          isRequired={props.isRequired}
        >
          {label}
        </FieldLabelPart>
      )}

      {/*
        The frame paints; the `<input>` keeps `data-part="control"` because it is
        the element a caller types into (F-026, and the precedent C1 set on
        `ComboBox`). Both used to be named `control`, which made the published
        anatomy unaddressable — `querySelector` returned the wrapper, whose box
        reports none of the field's chrome.
      */}
      <RACGroup
        data-scope="number-field"
        data-part="frame"
        style={({ isDisabled, isInvalid, isFocusVisible }) => {
          return buildFieldFrameStyle({
            colors: c,
            labelPosition,
            isDisabled,
            isInvalid,
            isFocusVisible,
          });
        }}
      >
        <RACButton
          slot="decrement"
          data-scope="number-field"
          data-part="trigger"
          style={({ isHovered, isDisabled, isFocusVisible }) => {
            return buildEmbeddedTriggerStyle({
              colors: c,
              isHovered,
              isDisabled,
              isFocusVisible,
            });
          }}
        >
          <Icon intent="action.decrement" size="sm" label={decrementLabel} />
        </RACButton>

        <RACInput
          data-scope="number-field"
          data-part="control"
          style={buildFieldValueStyle({ colors: c, textAlign: 'center' })}
        />

        <RACButton
          slot="increment"
          data-scope="number-field"
          data-part="trigger"
          style={({ isHovered, isDisabled, isFocusVisible }) => {
            return buildEmbeddedTriggerStyle({
              colors: c,
              isHovered,
              isDisabled,
              isFocusVisible,
            });
          }}
        >
          <Icon intent="action.increment" size="sm" label={incrementLabel} />
        </RACButton>
      </RACGroup>

      {description != null && (
        <FieldDescriptionPart scope="number-field" colors={c}>
          {description}
        </FieldDescriptionPart>
      )}

      <FieldValidationMessagePart scope="number-field" colors={c}>
        {errorMessage}
      </FieldValidationMessagePart>
    </RACNumberField>
  );
};
NumberField.displayName = numberFieldMeta.displayName;
