import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  FieldError as RACFieldError,
  Group as RACGroup,
  Input as RACInput,
  Label as RACLabel,
  NumberField as RACNumberField,
  type NumberFieldProps as RACNumberFieldProps,
  Text as RACText,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`, sizing: `hit.base`,
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

type InputColors = typeof vars.colors.input.primary;

/** Control box (the `Group`) chrome — the framed field around input + steppers. */
const buildControlBoxStyle = ({
  c,
  isDisabled,
  isInvalid,
  isFocusVisible,
}: {
  c: InputColors;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: vars.sizing.hit.base,
    borderRadius: vars.radii.control,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    transitionProperty: 'background-color, border-color',
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    backgroundColor: resolveInteractiveStyle(c?.background, {
      isDisabled,
      isInvalid,
    }),
    borderColor: resolveInteractiveStyle(c?.border, {
      isDisabled,
      isInvalid,
      isFocusVisible,
    }),
    outline: focusRingOutline(isFocusVisible),
  };
};

/** Stepper button chrome — borderless Action-pattern control in Input chrome. */
const buildStepperStyle = ({
  c,
  isDisabled,
}: {
  c: InputColors;
  isDisabled?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: 0,
    background: 'transparent',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    paddingBlock: vars.spacing.inset.control.sm,
    paddingInline: vars.spacing.inset.control.sm,
    color: c?.text?.default,
  };
};

/**
 * Resolve the field's text colors once (default for label/description/input,
 * invalid for the validation message). Hoisted out of the render so the
 * optional-chain reads keep the component's cyclomatic complexity low.
 */
const resolveFieldTextColors = (
  c: InputColors
): { base: string | undefined; invalid: string | undefined } => {
  const text = c?.text;
  return { base: text?.default, invalid: text?.invalid ?? text?.default };
};

/** The `<input>` itself — borderless; the surrounding `Group` owns the frame. */
const buildInputStyle = (c: InputColors): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    flex: 1,
    minWidth: 0,
    border: 0,
    background: 'transparent',
    outline: 'none',
    textAlign: 'center',
    paddingBlock: vars.spacing.inset.control.sm,
    color: c?.text?.default,
    ...(vars.text.label.md as React.CSSProperties),
  };
};

/** Props for the NumberField component. */
export interface NumberFieldProps extends Omit<
  RACNumberFieldProps,
  'style' | 'children' | 'className'
> {
  /** Visible label displayed above the field. */
  label?: React.ReactNode;
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
  description,
  errorMessage,
  decrementLabel = 'Decrease',
  incrementLabel = 'Increase',
  ...props
}: NumberFieldProps) => {
  const c = vars.colors.input.primary;
  const { base, invalid } = resolveFieldTextColors(c);

  return (
    <RACNumberField
      {...props}
      data-scope="number-field"
      data-part="root"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
      }}
    >
      {label != null && (
        <RACLabel
          data-scope="number-field"
          data-part="label"
          style={{
            ...(vars.text.label.md as React.CSSProperties),
            color: base,
          }}
        >
          {label}
        </RACLabel>
      )}

      <RACGroup
        data-scope="number-field"
        data-part="control"
        style={({ isDisabled, isInvalid, isFocusVisible }) => {
          return buildControlBoxStyle({
            c,
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
          style={({ isDisabled }) => {
            return buildStepperStyle({ c, isDisabled });
          }}
        >
          <Icon intent="action.decrement" size="sm" label={decrementLabel} />
        </RACButton>

        <RACInput
          data-scope="number-field"
          data-part="control"
          style={buildInputStyle(c)}
        />

        <RACButton
          slot="increment"
          data-scope="number-field"
          data-part="trigger"
          style={({ isDisabled }) => {
            return buildStepperStyle({ c, isDisabled });
          }}
        >
          <Icon intent="action.increment" size="sm" label={incrementLabel} />
        </RACButton>
      </RACGroup>

      {description != null && (
        <RACText
          slot="description"
          data-scope="number-field"
          data-part="description"
          style={{
            ...(vars.text.label.sm as React.CSSProperties),
            color: base,
          }}
        >
          {description}
        </RACText>
      )}

      <RACFieldError
        data-scope="number-field"
        data-part="validationMessage"
        style={{
          ...(vars.text.label.sm as React.CSSProperties),
          color: invalid,
        }}
      >
        {errorMessage}
      </RACFieldError>
    </RACNumberField>
  );
};
NumberField.displayName = numberFieldMeta.displayName;
