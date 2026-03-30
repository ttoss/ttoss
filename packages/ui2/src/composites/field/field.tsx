/* eslint-disable react/prop-types */
import { Field as ArkField, type FieldRootProps } from '@ark-ui/react/field';
import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Props for the Field component.
 *
 * Host: FieldFrame
 * Roles: label, control, description, validationMessage
 */
export interface FieldProps extends FieldRootProps {
  /** Field label text. Role: FieldFrame.label */
  label?: string;
  /** Helper/description text. Role: FieldFrame.description */
  helperText?: string;
  /** Error message. Role: FieldFrame.validationMessage */
  errorText?: string;
}

export type FieldInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export type FieldTextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Accessible field structure built on Ark UI.
 *
 * Host: **FieldFrame** — fields and their supporting elements.
 *
 * @example
 * ```tsx
 * <Field.Root>
 *   <Field.Label>Email</Field.Label>
 *   <Field.Input type="email" placeholder="you@example.com" />
 *   <Field.HelperText>We'll never share your email.</Field.HelperText>
 * </Field.Root>
 * ```
 *
 * @example
 * ```tsx
 * <Field.Root invalid>
 *   <Field.Label>Name</Field.Label>
 *   <Field.Input />
 *   <Field.ErrorText>Name is required.</Field.ErrorText>
 * </Field.Root>
 * ```
 */

const FieldRoot = React.forwardRef<HTMLDivElement, FieldRootProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkField.Root
        ref={ref}
        className={cn('ui2-field', className)}
        {...props}
      />
    );
  }
);
FieldRoot.displayName = 'Field.Root';

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => {
  return (
    <ArkField.Label
      ref={ref}
      className={cn('ui2-field__label', className)}
      {...props}
    >
      {children}
      <ArkField.RequiredIndicator className="ui2-field__required-indicator">
        *
      </ArkField.RequiredIndicator>
    </ArkField.Label>
  );
});
FieldLabel.displayName = 'Field.Label';

const FieldInput = React.forwardRef<HTMLInputElement, FieldInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkField.Input
        ref={ref}
        className={cn('ui2-field__input', className)}
        {...props}
      />
    );
  }
);
FieldInput.displayName = 'Field.Input';

const FieldTextarea = React.forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <ArkField.Textarea
        ref={ref}
        className={cn('ui2-field__textarea', className)}
        {...props}
      />
    );
  }
);
FieldTextarea.displayName = 'Field.Textarea';

const FieldHelperText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <ArkField.HelperText
      ref={ref}
      className={cn('ui2-field__helper-text', className)}
      {...props}
    />
  );
});
FieldHelperText.displayName = 'Field.HelperText';

const FieldErrorText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <ArkField.ErrorText
      ref={ref}
      className={cn('ui2-field__error-text', className)}
      {...props}
    />
  );
});
FieldErrorText.displayName = 'Field.ErrorText';

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Input: FieldInput,
  Textarea: FieldTextarea,
  HelperText: FieldHelperText,
  ErrorText: FieldErrorText,
};
