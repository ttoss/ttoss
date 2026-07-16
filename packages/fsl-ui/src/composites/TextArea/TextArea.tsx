import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  FieldError as RACFieldError,
  type FieldErrorProps as RACFieldErrorProps,
  Label as RACLabel,
  type LabelProps as RACLabelProps,
  Text as RACText,
  TextArea as RACTextArea,
  type TextAreaProps as RACTextAreaProps,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type TextProps as RACTextProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { createPresenceScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — presence-only host guard (same contract as TextField).
// ---------------------------------------------------------------------------

const textAreaScope = createPresenceScope('TextArea');

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row (colors `input.primary`, radii
// `control`, border `outline.control`, spacing `inset.control`, typography
// `label`, motion `feedback`). TextArea is the multiline sibling of TextField:
// the same Input parts, with the control rendered as React Aria's `TextArea`
// (a `<textarea>`). Validation flows through the `invalid` State exactly as in
// TextField. `rows` is exposed for the initial height; vertical resize is
// enabled so the user can grow it.
// ---------------------------------------------------------------------------

/** Formal semantic identity — TextArea root (Input entity). */
export const textAreaMeta = {
  displayName: 'TextArea',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — label slot. */
export const textAreaLabelMeta = {
  displayName: 'TextAreaLabel',
  entity: 'Input',
  structure: 'label',
  composition: 'label',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — control slot (the `<textarea>`). */
export const textAreaControlMeta = {
  displayName: 'TextAreaControl',
  entity: 'Input',
  structure: 'control',
  composition: 'control',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — description slot. */
export const textAreaDescriptionMeta = {
  displayName: 'TextAreaDescription',
  entity: 'Input',
  structure: 'description',
  composition: 'description',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — status slot (validation message). */
export const textAreaErrorMeta = {
  displayName: 'TextAreaError',
  entity: 'Input',
  structure: 'validationMessage',
  composition: 'status',
} as const satisfies ComponentMeta<'Input'>;

/** Props for the TextArea root. */
export type TextAreaProps = Omit<RACTextFieldProps, 'style' | 'className'>;

/**
 * A multiline text input composite (Input entity) — the multiline sibling of
 * `TextField`. Composes `TextAreaLabel`, `TextAreaControl`,
 * `TextAreaDescription`, and `TextAreaError`. Validation is driven by React
 * Aria's `isInvalid` / `validate`.
 *
 * @example
 * ```tsx
 * <TextArea isRequired>
 *   <TextAreaLabel>Notes</TextAreaLabel>
 *   <TextAreaControl rows={4} />
 *   <TextAreaError />
 * </TextArea>
 * ```
 */
export const TextArea = ({ children, ...props }: TextAreaProps) => {
  return (
    <RACTextField
      {...props}
      data-scope="text-area"
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
      {(values) => {
        return (
          <textAreaScope.Provider>
            {typeof children === 'function' ? children(values) : children}
          </textAreaScope.Provider>
        );
      }}
    </RACTextField>
  );
};
TextArea.displayName = textAreaMeta.displayName;

/** Props for the TextArea label. */
export type TextAreaLabelProps = Omit<RACLabelProps, 'style' | 'className'>;

/** The label slot of a TextArea. */
export const TextAreaLabel = (props: TextAreaLabelProps) => {
  textAreaScope.use(textAreaLabelMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <RACLabel
      {...props}
      data-scope="text-area"
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
TextAreaLabel.displayName = textAreaLabelMeta.displayName;

/** Props for the TextArea control. */
export type TextAreaControlProps = Omit<
  RACTextAreaProps,
  'style' | 'className'
>;

/**
 * The control slot — the actual `<textarea>`. Surfaces the `invalid` State
 * via `vars.colors.input.primary.*`; vertical resize is enabled.
 */
export const TextAreaControl = (props: TextAreaControlProps) => {
  textAreaScope.use(textAreaControlMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <RACTextArea
      {...props}
      data-scope="text-area"
      data-part="control"
      style={({ isHovered, isDisabled, isFocusVisible, isInvalid }) => {
        return {
          boxSizing: 'border-box',
          resize: 'vertical',
          minBlockSize: vars.sizing.hit.base,
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
          outline: focusRingOutline(isFocusVisible),
          ...(vars.text.label.md as React.CSSProperties),
        } as React.CSSProperties;
      }}
    />
  );
};
TextAreaControl.displayName = textAreaControlMeta.displayName;

/** Props for the TextArea description. */
export type TextAreaDescriptionProps = Omit<
  RACTextProps,
  'style' | 'className' | 'slot'
>;

/** Helper/description text linked to the control. */
export const TextAreaDescription = (props: TextAreaDescriptionProps) => {
  textAreaScope.use(textAreaDescriptionMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <RACText
      slot="description"
      {...props}
      data-scope="text-area"
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
TextAreaDescription.displayName = textAreaDescriptionMeta.displayName;

/** Props for the TextArea error. */
export type TextAreaErrorProps = Omit<
  RACFieldErrorProps,
  'style' | 'className'
>;

/** Validation message — rendered by React Aria only when the field is invalid. */
export const TextAreaError = (props: TextAreaErrorProps) => {
  textAreaScope.use(textAreaErrorMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <RACFieldError
      {...props}
      data-scope="text-area"
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
TextAreaError.displayName = textAreaErrorMeta.displayName;
