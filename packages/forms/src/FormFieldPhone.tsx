import { Box, Flex, Input, Select } from '@ttoss/ui';
import * as React from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { PatternFormatProps } from 'react-number-format';
import { NumericFormat, PatternFormat } from 'react-number-format';

import { FormField, type FormFieldProps } from './FormField';
import {
  COMMON_PHONE_COUNTRY_CODES,
  type CountryCodeOption,
  MANUAL_PHONE_COUNTRY_CODE,
} from './phoneCountryCodes';

export type { CountryCodeOption };
export { MANUAL_PHONE_COUNTRY_CODE };

/**
 * Internal wrapper that renders the country-code Select dropdown next to
 * the phone input.
 *
 * Defined at module level so React keeps a stable component identity across
 * re-renders (avoids unmount/remount that would cause input focus loss).
 *
 * FormField injects the generated id via React.cloneElement, which this
 * component receives and forwards to the inner input node, ensuring the
 * label htmlFor association remains valid for accessibility.
 */
type PhoneDropdownWrapperProps = {
  /**
   * The HTML id to forward to the inner input element, injected by
   * FormField via React.cloneElement. This keeps the label htmlFor
   * association valid for accessibility.
   */
  id?: string;
  /** The currently selected calling code (e.g. '+1'). Controlled externally. */
  countryCode?: string;
  /** List of selectable country calling code options. */
  countryCodeOptions: CountryCodeOption[];
  /** Whether the select and input should be disabled. */
  disabled?: boolean;
  /** Called with the new calling-code value when the user changes the selection. */
  onCountryCodeChange?: (code: string) => void;
  /** Called when the user changes the country code, so the phone value can be reset. */
  onPhoneReset?: () => void;
  /**
   * The React element to render as the phone input. The wrapper clones this
   * element to inject the id prop, so it must not already have an explicit
   * id set.
   */
  inputNode: React.ReactElement;
};

const PhoneDropdownWrapper = ({
  id,
  countryCode,
  countryCodeOptions,
  disabled,
  onCountryCodeChange,
  onPhoneReset,
  inputNode,
}: PhoneDropdownWrapperProps) => {
  return (
    <Flex sx={{ gap: '2', alignItems: 'stretch' }}>
      <Box sx={{ minWidth: '180px' }}>
        <Select
          options={countryCodeOptions}
          value={countryCode}
          disabled={disabled}
          onChange={(value) => {
            if (value !== undefined) {
              onPhoneReset?.();
              onCountryCodeChange?.(String(value));
            }
          }}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        {React.cloneElement(inputNode as React.ReactElement<{ id?: string }>, {
          id,
        })}
      </Box>
    </Flex>
  );
};

export type FormFieldPhoneProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'> & {
    /**
     * The country calling code to display as a literal prefix in the input.
     * For example, '+55' for Brazil or '+1' for the United States.
     * Defaults to the first entry in `countryCodeOptions` when not provided.
     */
    countryCode?: string;
    /**
     * The pattern format for the local part of the phone number.
     * Accepts either a static string (e.g., '(##) #####-####') or a function
     * that receives the current raw value and returns the format string,
     * which is useful for dynamic formats (e.g., different lengths).
     *
     * When the selected entry in countryCodeOptions includes its own
     * format, that value takes precedence over this prop.
     *
     * Defaults to '(###) ###-####' when neither this prop nor the selected
     * country option supplies a format.
     *
     * Ignored when `countryCode` is `MANUAL_PHONE_COUNTRY_CODE`.
     */
    format?: string | ((value: string) => string);
    /**
     * List of country calling code options to display in the dropdown.
     * Defaults to `COMMON_PHONE_COUNTRY_CODES` (15 common countries + Manual).
     * Pass an empty array to hide the dropdown and show a plain phone input.
     */
    countryCodeOptions?: CountryCodeOption[];
    /**
     * Called with the newly selected country code value when the user changes
     * the country code via the dropdown. Only relevant when
     * countryCodeOptions is non-empty.
     */
    onCountryCodeChange?: (countryCode: string) => void;
  };

/**
 * Generic phone number form field that supports an optional country code prefix.
 *
 * By default, a country-code dropdown is rendered using `COMMON_PHONE_COUNTRY_CODES`
 * (15 common countries + a Manual entry). Pass `countryCodeOptions={[]}` to
 * disable the dropdown and show a plain phone input.
 *
 * The format prop defines the pattern for the local phone number (using #
 * as digit placeholders). When a countryCode is provided it is prepended to
 * the format and rendered as a read-only literal inside the input.
 *
 * When the user selects the "Manual" option (`MANUAL_PHONE_COUNTRY_CODE`),
 * the pattern mask is disabled and a plain text input is shown so the user
 * can type the full international number freely.
 *
 * When a country code is provided, the stored value is the country code
 * concatenated directly with the raw local digits (e.g., `"+15555555555"`
 * for country code `"+1"` and local digits `"5555555555"`). When no country
 * code is set, only the raw local digits are stored.
 *
 * @example
 * ```tsx
 * // Default: dropdown with COMMON_PHONE_COUNTRY_CODES
 * <FormFieldPhone name="phone" label="Phone" />
 * ```
 *
 * @example
 * ```tsx
 * // Controlled country code with default list
 * const [countryCode, setCountryCode] = React.useState('+1');
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode={countryCode}
 *   onCountryCodeChange={setCountryCode}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // No dropdown — plain phone input
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode="+1"
 *   format="(###) ###-####"
 *   countryCodeOptions={[]}
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
 *   countryCodeOptions={[]}
 * />
 * ```
 */
export const FormFieldPhone = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  countryCode: countryCodeProp,
  format,
  countryCodeOptions = COMMON_PHONE_COUNTRY_CODES,
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
    placeholder,
    ...patternFormatProps
  } = props;

  const countryCode =
    countryCodeProp ?? countryCodeOptions[0]?.value ?? undefined;

  const isManual = countryCode === MANUAL_PHONE_COUNTRY_CODE;

  const getFormat = (value: string) => {
    const selectedOption = countryCodeOptions.find((opt) => {
      return opt.value === countryCode;
    });
    const resolvedFormat = selectedOption?.format ?? format ?? '(###) ###-####';
    const baseFormat =
      typeof resolvedFormat === 'function'
        ? resolvedFormat(value)
        : resolvedFormat;
    return countryCode && !isManual
      ? `${countryCode} ${baseFormat}`
      : baseFormat;
  };

  const showDropdown = countryCodeOptions.length > 0;

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
        /**
         * The id prop is intentionally omitted here. It will be injected by
         * FormField's cloneElement call (no-dropdown path) or forwarded by
         * PhoneDropdownWrapper (dropdown path) to ensure label association.
         */
        const localPhoneValue =
          !isManual && countryCode && field.value?.startsWith(countryCode)
            ? field.value.slice(countryCode.length)
            : field.value;

        const inputNode = isManual ? (
          <NumericFormat
            name={field.name}
            value={field.value ?? ''}
            placeholder={placeholder}
            prefix="+"
            allowLeadingZeros
            decimalScale={0}
            thousandSeparator={false}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
            onValueChange={(values, sourceInfo) => {
              field.onChange(values.formattedValue);
              onValueChange?.(values, sourceInfo);
            }}
            customInput={Input}
            disabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        ) : (
          <PatternFormat
            {...patternFormatProps}
            name={field.name}
            value={localPhoneValue}
            placeholder={placeholder}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
            onValueChange={(values, sourceInfo) => {
              const fullValue =
                countryCode && values.value
                  ? countryCode + values.value
                  : values.value;
              field.onChange(fullValue);
              onValueChange?.(values, sourceInfo);
            }}
            format={getFormat(localPhoneValue ?? '')}
            customInput={Input}
            disabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );

        if (!showDropdown) {
          // FormField injects id via cloneElement directly onto the input.
          return inputNode;
        }

        /**
         * FormField injects id via cloneElement onto PhoneDropdownWrapper.
         * PhoneDropdownWrapper (module-level, stable identity) receives id
         * and forwards it to the inner input so that label htmlFor correctly
         * points to the input.
         */
        return (
          <PhoneDropdownWrapper
            countryCode={countryCode}
            countryCodeOptions={countryCodeOptions}
            disabled={disabled ?? field.disabled}
            onCountryCodeChange={onCountryCodeChange}
            onPhoneReset={() => {
              return field.onChange('');
            }}
            inputNode={inputNode}
          />
        );
      }}
    />
  );
};
