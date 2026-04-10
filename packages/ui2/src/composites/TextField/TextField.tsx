import type * as React from 'react';

import { defineComposite } from '../../_model/defineComposite';
import { HelperText } from '../../components/HelperText/HelperText';
import type { InputSize } from '../../components/Input/Input';
import { Input } from '../../components/Input/Input';
import { Label } from '../../components/Label/Label';
import { ValidationMessage } from '../../components/ValidationMessage/ValidationMessage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Content props for the TextField composite — everything except the
 * FieldContextProps (invalid, disabled, required, readOnly), which are
 * handled automatically by defineComposite({ context: 'Field' }).
 */
export interface TextFieldContentProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Label text rendered above the input.
   * Wired to the input via Ark Field context — no manual `htmlFor` required.
   */
  label?: React.ReactNode;

  /**
   * Supporting helper text rendered below the input (when not in error state).
   */
  helperText?: React.ReactNode;

  /**
   * Error message rendered below the input when `invalid={true}`.
   * Only visible when the field is invalid.
   */
  errorText?: React.ReactNode;

  /**
   * Size variant for the underlying Input.
   * @default 'md'
   */
  size?: InputSize;
}

/**
 * Props for the TextField composite component.
 *
 * Extends TextFieldContentProps with FieldContextProps (invalid, disabled,
 * required, readOnly) — all forwarded to Ark Field.Root for automatic
 * ARIA wiring and state propagation.
 */
export type TextFieldProps = TextFieldContentProps & {
  /** Marks the field as invalid — triggers visual error state. */
  invalid?: boolean;
  /** Marks the field as disabled. */
  disabled?: boolean;
  /** Marks the field as required — Ark renders a required indicator on the label. */
  required?: boolean;
  /** Marks the field as read-only. */
  readOnly?: boolean;
  /** Inline styles applied to the Field.Root container. */
  style?: React.CSSProperties;
};

// ---------------------------------------------------------------------------
// Component — defined via defineComposite() (B-07 reference implementation)
// ---------------------------------------------------------------------------

/**
 * TextField — a complete form field composite.
 *
 * Assembles Label + Input + HelperText + ValidationMessage inside an Ark UI
 * `Field.Root`, which provides:
 * - Automatic ARIA wiring: `aria-labelledby`, `aria-describedby`, `aria-invalid`,
 *   `aria-required`, `aria-readonly` — no manual attribute management.
 * - State propagation: `invalid`, `disabled`, `required`, `readOnly` flow
 *   from `Field.Root` to all parts automatically.
 *
 * This component is the **reference implementation** of the `defineComposite()`
 * pattern (B-07). Study this file when building a new form-field composite.
 *
 * For custom layouts or additional control, compose the primitives directly:
 * `Label`, `Input`, `HelperText`, `ValidationMessage` are all exported from
 * `@ttoss/ui2` and can be used standalone inside your own `Field.Root`.
 *
 * @example
 * // Minimal
 * <TextField label="Email" placeholder="you@example.com" />
 *
 * @example
 * // With validation
 * <TextField
 *   label="Password"
 *   type="password"
 *   helperText="Must be at least 8 characters."
 *   invalid={!!errors.password}
 *   errorText={errors.password?.message}
 *   required
 * />
 *
 * @example
 * // Custom layout using primitives
 * <Field.Root invalid={hasError}>
 *   <Label>Username</Label>
 *   <Input placeholder="@handle" />
 *   <ValidationMessage>{error}</ValidationMessage>
 * </Field.Root>
 */
const { Component: TextFieldBase, compositeConfig: textFieldCompositeConfig } =
  defineComposite<TextFieldContentProps>({
    name: 'TextField',
    scope: 'text-field',
    parts: ['Label', 'Input', 'HelperText', 'ValidationMessage'],
    context: 'Field',
    partComponents: { Label, Input, HelperText, ValidationMessage },
    render: (
      { label, helperText, errorText, size, ...inputProps },
      { Label: L, Input: I, HelperText: HT, ValidationMessage: VM }
    ) => (
      <>
        {label !== undefined && <L>{label}</L>}
        <I size={size as InputSize} {...inputProps} />
        {helperText !== undefined && <HT>{helperText}</HT>}
        <VM>{errorText}</VM>
      </>
    ),
  });

export const TextField = TextFieldBase as React.ComponentType<TextFieldProps>;
export { textFieldCompositeConfig };

