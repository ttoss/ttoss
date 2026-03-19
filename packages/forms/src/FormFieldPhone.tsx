import { Box, Flex, Input } from '@ttoss/ui';
import * as React from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { PatternFormatProps } from 'react-number-format';
import { PatternFormat } from 'react-number-format';

import { FormField, type FormFieldProps } from './FormField';

export type CountryCodeOption = {
  /** Label displayed in the dropdown (e.g. 'US +1'). */
  label: string;
  /** The calling-code value (e.g. '+1'). */
  value: string;
  /**
   * Optional phone number format for the local part specific to this country
   * (e.g. '(###) ###-####'). When the user selects this option the format
   * is used automatically, overriding the `format` prop of `FormFieldPhone`.
   */
  format?: string | ((value: string) => string);
};

/**
 * `Box` is typed as a `div` wrapper. To use it as a `<select>` element with
 * full prop type-safety (including native `onChange`, `value`, `disabled`),
 * we cast it to a component that accepts native select HTML attributes plus
 * the Theme UI `sx` prop.
 */
const BoxSelect = Box as React.ComponentType<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    sx?: React.ComponentPropsWithoutRef<typeof Box>['sx'];
    as?: string;
  }
>;

/**
 * Internal wrapper that renders the country-code select dropdown next to
 * the phone input.
 *
 * Defined at module level so React keeps a stable component identity across
 * re-renders (avoids unmount/remount that would cause input focus loss).
 *
 * FormField injects the generated id via React.cloneElement, which this
 * component receives and forwards to the inner PatternFormat, ensuring the
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
  isDisabled?: boolean;
  /** Called with the new calling-code value when the user changes the selection. */
  onCountryCodeChange?: (code: string) => void;
  /**
   * The PatternFormat React element to render as the phone input. The
   * wrapper clones this element to inject the id prop, so it must not
   * already have an explicit id set.
   */
  patternNode: React.ReactElement;
};

const PhoneDropdownWrapper = ({
  id,
  countryCode,
  countryCodeOptions,
  isDisabled,
  onCountryCodeChange,
  patternNode,
}: PhoneDropdownWrapperProps) => {
  return (
    <Flex sx={{ gap: '2', alignItems: 'stretch' }}>
      <BoxSelect
        as="select"
        value={countryCode}
        disabled={isDisabled}
        onChange={(e) => {
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
      </BoxSelect>
      <Box sx={{ flex: 1 }}>
        {React.cloneElement(
          patternNode as React.ReactElement<{ id?: string }>,
          { id }
        )}
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
     */
    format?: string | ((value: string) => string);
    /**
     * When provided, renders a select dropdown before the phone input so the
     * user can pick the country calling code. The currently selected code is
     * controlled via the countryCode prop.
     */
    countryCodeOptions?: CountryCodeOption[];
    /**
     * Called with the newly selected country code value when the user changes
     * the country code via the dropdown. Only relevant when
     * countryCodeOptions is provided.
     */
    onCountryCodeChange?: (countryCode: string) => void;
  };

/**
 * Generic phone number form field that supports an optional country code prefix.
 *
 * The format prop defines the pattern for the local phone number (using #
 * as digit placeholders). When a countryCode is provided it is prepended to
 * the format and rendered as a read-only literal inside the input.
 *
 * When countryCodeOptions is provided, a select dropdown is rendered before
 * the phone input, allowing the user to switch the country calling code. The
 * currently selected code is controlled via countryCode, and changes are
 * reported via onCountryCodeChange.
 *
 * The value stored in the form contains only the raw digits of the local
 * number (the country code is stripped by react-number-format).
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
 * // Selectable country code with per-country formats (use COMMON_PHONE_COUNTRY_CODES)
 * import { COMMON_PHONE_COUNTRY_CODES } from '@ttoss/forms';
 *
 * const [countryCode, setCountryCode] = React.useState(
 *   COMMON_PHONE_COUNTRY_CODES[0].value
 * );
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode={countryCode}
 *   onCountryCodeChange={setCountryCode}
 *   countryCodeOptions={COMMON_PHONE_COUNTRY_CODES}
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
    const selectedOption = countryCodeOptions?.find((opt) => {
      return opt.value === countryCode;
    });
    const resolvedFormat = selectedOption?.format ?? format ?? '(###) ###-####';
    const baseFormat =
      typeof resolvedFormat === 'function'
        ? resolvedFormat(value)
        : resolvedFormat;
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

        /**
         * The id prop is intentionally omitted here. It will be injected by
         * FormField's cloneElement call (no-dropdown path) or forwarded by
         * PhoneDropdownWrapper (dropdown path) to ensure label association.
         */
        const patternNode = (
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
          // FormField injects id via cloneElement directly onto the input.
          return patternNode;
        }

        /**
         * FormField injects id via cloneElement onto PhoneDropdownWrapper.
         * PhoneDropdownWrapper (module-level, stable identity) receives id
         * and forwards it to the inner PatternFormat so that
         * label htmlFor correctly points to the input.
         */
        return (
          <PhoneDropdownWrapper
            countryCode={countryCode}
            countryCodeOptions={countryCodeOptions}
            isDisabled={disabled ?? field.disabled}
            onCountryCodeChange={onCountryCodeChange}
            patternNode={patternNode}
          />
        );
      }}
    />
  );
};
