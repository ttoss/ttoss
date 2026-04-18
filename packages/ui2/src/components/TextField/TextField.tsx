import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
import {
  FieldError as RACFieldError,
  type FieldErrorProps as RACFieldErrorProps,
  Input as RACInput,
  type InputProps as RACInputProps,
  Label as RACLabel,
  type LabelProps as RACLabelProps,
  Text as RACText,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type TextProps as RACTextProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// TextField is the canonical composite: one Input entity rendered as four
// parts in four composition slots (label, control, description, status).
// Each sub-part owns a ComponentMeta (I2) with its `composition` role (I1).
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`,
//   sizing: `hit`, spacing: `inset.control`, typography: `label`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback flows from React Aria's `isInvalid` (or `validate`
// callback) into the `invalid` token State on the control, the label, and
// the validation message.
// ---------------------------------------------------------------------------

/** Formal semantic identity — TextField root (Input entity, root part). */
export const textFieldMeta = {
  displayName: 'TextField',
  entity: 'Input',
  structure: 'root',
  interaction: 'entry.text',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — label slot. */
export const textFieldLabelMeta = {
  displayName: 'TextFieldLabel',
  entity: 'Input',
  structure: 'label',
  composition: 'label',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — control slot (the actual input element). */
export const textFieldControlMeta = {
  displayName: 'TextFieldControl',
  entity: 'Input',
  structure: 'control',
  interaction: 'entry.text',
  composition: 'control',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — description slot (helper text). */
export const textFieldDescriptionMeta = {
  displayName: 'TextFieldDescription',
  entity: 'Input',
  structure: 'description',
  composition: 'description',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — status slot (validation message). */
export const textFieldErrorMeta = {
  displayName: 'TextFieldError',
  entity: 'Input',
  structure: 'validationMessage',
  composition: 'status',
} as const satisfies ComponentMeta<'Input'>;

// ---------------------------------------------------------------------------
// TextField — root (orchestrator + container)
// ---------------------------------------------------------------------------

/** Props for the TextField root. */
export type TextFieldProps = Omit<RACTextFieldProps, 'style'>;

/**
 * A semantic text input composite built on React Aria's `TextField`.
 *
 * Composes four slots: `TextFieldLabel`, `TextFieldControl`,
 * `TextFieldDescription`, and `TextFieldError`. Each sub-part carries its
 * own `ComponentMeta` with a `composition` role per FSL §4.
 *
 * Validation feedback is driven by React Aria's `isInvalid` prop or
 * `validate` callback and surfaces on the control, label, and validation
 * message via the `invalid` token State.
 *
 * @example
 * ```tsx
 * <TextField isRequired>
 *   <TextFieldLabel>Email</TextFieldLabel>
 *   <TextFieldControl type="email" />
 *   <TextFieldDescription>We never share your email.</TextFieldDescription>
 *   <TextFieldError />
 * </TextField>
 * ```
 */
export const TextField = ({ children, ...props }: TextFieldProps) => {
  return (
    <RACTextField
      {...props}
      data-scope="text-field"
      data-part="root"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.xs,
        } as React.CSSProperties
      }
    >
      {children}
    </RACTextField>
  );
};
TextField.displayName = textFieldMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldLabel — label slot
// ---------------------------------------------------------------------------

/** Props for the TextField label. */
export type TextFieldLabelProps = Omit<RACLabelProps, 'style' | 'className'>;

/** The label slot of a TextField. Wired to React Aria for a11y linkage. */
export const TextFieldLabel = (props: TextFieldLabelProps) => {
  const colors = vars.colors.input.primary;

  return (
    <RACLabel
      {...props}
      data-scope="text-field"
      data-part="label"
      style={
        {
          color: colors?.text?.default,
          ...(vars.text.label.md as React.CSSProperties),
        } as React.CSSProperties
      }
    />
  );
};
TextFieldLabel.displayName = textFieldLabelMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldControl — the <input> itself
// ---------------------------------------------------------------------------

/** Props for the TextField control. */
export type TextFieldControlProps = Omit<RACInputProps, 'style'>;

/**
 * The control slot of a TextField — the actual `<input>` element. Reads
 * `isInvalid` from React Aria's render-props and surfaces the `invalid`
 * State via `vars.colors.input.primary.*`.
 */
export const TextFieldControl = (props: TextFieldControlProps) => {
  const colors = vars.colors.input.primary;

  return (
    <RACInput
      {...props}
      data-scope="text-field"
      data-part="control"
      style={({ isHovered, isDisabled, isFocusVisible, isInvalid }) => {
        return {
          boxSizing: 'border-box',
          minHeight: vars.sizing.hit.base,
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.md,
          borderRadius: vars.radii.control,
          borderWidth: vars.border.outline.control.width,
          borderStyle: vars.border.outline.control.style,
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'background-color, border-color, color',
          backgroundColor: resolveInteractiveStyle(colors?.background, {
            isHovered,
            isDisabled,
            isInvalid,
          }),
          borderColor: resolveInteractiveStyle(colors?.border, {
            isDisabled,
            isInvalid,
            isFocusVisible,
          }),
          color:
            resolveInteractiveStyle(colors?.text, {
              isHovered,
              isDisabled,
              isInvalid,
            }) ?? colors?.text?.default,
          outline: isFocusVisible
            ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
            : 'none',
          ...(vars.text.label.md as React.CSSProperties),
        } as React.CSSProperties;
      }}
    />
  );
};
TextFieldControl.displayName = textFieldControlMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldDescription — supporting helper text
// ---------------------------------------------------------------------------

/** Props for the TextField description. */
export type TextFieldDescriptionProps = Omit<
  RACTextProps,
  'style' | 'className' | 'slot'
>;

/** Helper/description text linked to the control via React Aria's slot. */
export const TextFieldDescription = (props: TextFieldDescriptionProps) => {
  const colors = vars.colors.input.primary;

  return (
    <RACText
      slot="description"
      {...props}
      data-scope="text-field"
      data-part="description"
      style={
        {
          color: colors?.text?.default,
          ...(vars.text.label.sm as React.CSSProperties),
        } as React.CSSProperties
      }
    />
  );
};
TextFieldDescription.displayName = textFieldDescriptionMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldError — validation message (status slot)
// ---------------------------------------------------------------------------

/** Props for the TextField error. */
export type TextFieldErrorProps = Omit<
  RACFieldErrorProps,
  'style' | 'className'
>;

/**
 * Validation message — rendered by React Aria only when the field is
 * invalid. Uses the `invalid` State of the canonical `input.primary`
 * subtree (mirroring the control's invalid coloring).
 */
export const TextFieldError = (props: TextFieldErrorProps) => {
  const colors = vars.colors.input.primary;

  return (
    <RACFieldError
      {...props}
      data-scope="text-field"
      data-part="validationMessage"
      style={
        {
          color: colors?.text?.invalid ?? colors?.text?.default,
          ...(vars.text.label.sm as React.CSSProperties),
        } as React.CSSProperties
      }
    />
  );
};
TextFieldError.displayName = textFieldErrorMeta.displayName;
