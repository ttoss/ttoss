import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Input, type InputProps } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { NumericFormatProps } from 'react-number-format';
import { NumericFormat } from 'react-number-format';

import type { FormFieldProps } from './FormField';
import { FormField } from './FormField';

const messages = defineMessages({
  decimalSeparator: {
    defaultMessage: '.',
    description:
      'Decimal separator for number formatting (e.g., "." for 1.23 or "," for 1,23)',
  },
  thousandSeparator: {
    defaultMessage: ',',
    description:
      'Thousand separator for number formatting (e.g., "," for 1,000 or "." for 1.000)',
  },
});

export type FormFieldNumericFormatProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<NumericFormatProps, 'name'> &
  Pick<InputProps, 'leadingIcon' | 'trailingIcon'>;

export const FormFieldNumericFormat = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  decimalSeparator,
  thousandSeparator,
  placeholder,
  prefix,
  decimalScale,
  ...props
}: FormFieldNumericFormatProps<TFieldValues, TName>) => {
  const { intl } = useI18n();

  const finalDecimalSeparator =
    decimalSeparator ?? intl.formatMessage(messages.decimalSeparator);
  const finalThousandSeparator =
    thousandSeparator ?? intl.formatMessage(messages.thousandSeparator);

  // Auto-generate placeholder for currency inputs with prefix
  const finalPlaceholder =
    placeholder ??
    (prefix && decimalScale !== undefined
      ? `${prefix} 0${finalDecimalSeparator}${'0'.repeat(decimalScale)}`
      : undefined);

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
    leadingIcon,
    trailingIcon,
    auxiliaryCheckbox,
    onBlur,
    onValueChange,
    ...numericFormatProps
  } = props;

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
      render={({ field }) => {
        return (
          <NumericFormat
            {...numericFormatProps}
            decimalSeparator={finalDecimalSeparator}
            thousandSeparator={finalThousandSeparator}
            placeholder={finalPlaceholder}
            prefix={prefix}
            decimalScale={decimalScale}
            name={field.name}
            value={field.value}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
            onValueChange={(values, sourceInfo) => {
              field.onChange(values.floatValue);
              onValueChange?.(values, sourceInfo);
            }}
            customInput={Input}
            leadingIcon={leadingIcon}
            trailingIcon={trailingIcon}
            disabled={disabled ?? field.disabled}
          />
        );
      }}
    />
  );
};
