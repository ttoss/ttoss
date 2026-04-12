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
export interface TextFieldContentProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
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
export const {
  Component: TextField,
  compositeConfig: textFieldCompositeConfig,
  compositeMeta: textFieldCompositeMeta,
} = defineComposite<TextFieldContentProps>({
  name: 'TextField',
  scope: 'text-field',
  parts: ['Label', 'Input', 'HelperText', 'ValidationMessage'],
  context: 'Field',
  partComponents: { Label, Input, HelperText, ValidationMessage },
  layout: {
    base: {
      display: 'flex',
      flexDirection: 'column',
    },
  },
  render: (
    { label, helperText, errorText, size, ...inputProps },
    { Label: L, Input: I, HelperText: HT, ValidationMessage: VM }
  ) => {
    return (
      <>
        {label !== undefined && <L>{label}</L>}
        <I size={size as InputSize} {...inputProps} />
        {helperText !== undefined && <HT>{helperText}</HT>}
        <VM>{errorText}</VM>
      </>
    );
  },
});

/**
 * Props for the TextField composite component.
 *
 * Derived from the `defineComposite()` factory return type — includes
 * `TextFieldContentProps` plus `FieldContextProps` (`invalid`, `disabled`,
 * `required`, `readOnly`) from the `context: 'Field'` declaration.
 *
 * No manual declaration or cast needed: TypeScript resolves the intersection
 * because `TCtx = 'Field'` is captured as a concrete literal type.
 */
export type TextFieldProps = React.ComponentProps<typeof TextField>;
