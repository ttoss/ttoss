import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { PatternFormatProps } from 'react-number-format';
import { PatternFormat } from 'react-number-format';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldPhoneProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'> & {
    /**
     * The country calling code to display as a literal prefix in the input.
     * For example, '+55' for Brazil or '+1' for the United States.
     */
    countryCode?: string;
    /**
     * The pattern format for the local part of the phone number.
     * Accepts either a static string (e.g., '(##) #####-####') or a function
     * that receives the current raw value and returns the format string,
     * which is useful for dynamic formats (e.g., different lengths).
     */
    format: string | ((value: string) => string);
  };

/**
 * Generic phone number form field that supports an optional country code prefix.
 *
 * The `format` prop defines the pattern for the local phone number (using `#`
 * as digit placeholders). When a `countryCode` is provided it is prepended to
 * the format and rendered as a read-only literal inside the input.
 *
 * The value stored in the form contains only the raw digits of the local
 * number (the country code is stripped by `react-number-format`).
 *
 * @example
 * ```tsx
 * // US phone number
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode="+1"
 *   format="(###) ###-####"
 *   placeholder="(555) 555-5555"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Dynamic format (e.g. Brazilian numbers with 8 or 9 local digits)
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode="+55"
 *   format={(value) =>
 *     value.length > 10 ? '(##) #####-####' : '(##) ####-#####'
 *   }
 * />
 * ```
 */
export const FormFieldPhone = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  countryCode,
  format,
  ...props
}: FormFieldPhoneProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    auxiliaryCheckbox,
    onBlur,
    onValueChange,
    ...patternFormatProps
  } = props;

  const getFormat = (value: string) => {
    const baseFormat = typeof format === 'function' ? format(value) : format;
    return countryCode ? `${countryCode} ${baseFormat}` : baseFormat;
  };

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      labelTooltip={labelTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      auxiliaryCheckbox={auxiliaryCheckbox}
      render={({ field, fieldState }) => {
        const phoneFormat = getFormat(field.value ?? '');

        return (
          <PatternFormat
            {...patternFormatProps}
            name={field.name}
            value={field.value}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
            onValueChange={(values, sourceInfo) => {
              field.onChange(values.value);
              onValueChange?.(values, sourceInfo);
            }}
            format={phoneFormat}
            customInput={Input}
            disabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
