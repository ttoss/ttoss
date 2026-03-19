import { Box, Flex, Input } from '@ttoss/ui';
import type * as React from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { PatternFormatProps } from 'react-number-format';
import { PatternFormat } from 'react-number-format';

import { FormField, type FormFieldProps } from './FormField';

export type CountryCodeOption = {
  /** Label displayed in the dropdown (e.g. '🇺🇸 +1'). */
  label: string;
  /** The calling-code value (e.g. '+1'). */
  value: string;
};

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
    /**
     * When provided, renders a select dropdown before the phone input so the
     * user can pick the country calling code. The currently selected code is
     * controlled via the `countryCode` prop.
     */
    countryCodeOptions?: CountryCodeOption[];
    /**
     * Called with the newly selected country code value when the user changes
     * the country code via the dropdown. Only relevant when
     * `countryCodeOptions` is provided.
     */
    onCountryCodeChange?: (countryCode: string) => void;
  };

/**
 * Generic phone number form field that supports an optional country code prefix.
 *
 * The `format` prop defines the pattern for the local phone number (using `#`
 * as digit placeholders). When a `countryCode` is provided it is prepended to
 * the format and rendered as a read-only literal inside the input.
 *
 * When `countryCodeOptions` is provided, a select dropdown is rendered before
 * the phone input, allowing the user to switch the country calling code. The
 * currently selected code is controlled via `countryCode`, and changes are
 * reported via `onCountryCodeChange`.
 *
 * The value stored in the form contains only the raw digits of the local
 * number (the country code is stripped by `react-number-format`).
 *
 * @example
 * ```tsx
 * // US phone number (static country code)
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
 * // Selectable country code
 * const [countryCode, setCountryCode] = React.useState('+1');
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode={countryCode}
 *   onCountryCodeChange={setCountryCode}
 *   format="(###) ###-####"
 *   countryCodeOptions={[
 *     { label: '🇺🇸 +1', value: '+1' },
 *     { label: '🇧🇷 +55', value: '+55' },
 *   ]}
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
  countryCodeOptions,
  onCountryCodeChange,
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

        const patternInput = (
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

        if (!countryCodeOptions) {
          return patternInput;
        }

        return (
          <Flex sx={{ gap: '2', alignItems: 'stretch' }}>
            <Box
              as="select"
              value={countryCode}
              disabled={disabled ?? field.disabled}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                onCountryCodeChange?.(e.target.value);
              }}
              sx={{
                fontFamily: 'body',
                fontSize: 'md',
                paddingX: '3',
                paddingY: '3',
                border: '1px solid',
                borderColor: 'display.border.muted.default',
                borderRadius: 'sm',
                backgroundColor: 'display.background.secondary.default',
                color: 'display.text.primary.default',
                cursor: 'pointer',
                ':disabled': {
                  backgroundColor: 'display.background.muted.default',
                  cursor: 'not-allowed',
                },
              }}
            >
              {countryCodeOptions.map((opt) => {
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                );
              })}
            </Box>
            <Box sx={{ flex: 1 }}>{patternInput}</Box>
          </Flex>
        );
      }}
    />
  );
};
