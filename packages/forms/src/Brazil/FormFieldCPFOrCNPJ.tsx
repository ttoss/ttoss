import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { NumberFormatBase, NumberFormatBaseProps } from 'react-number-format';

import { FormField, type FormFieldProps } from '../FormField';

export type FormFieldCPFOrCNPJProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<NumberFormatBaseProps, 'name' | 'format'>;

/**
 * Custom format function that applies CPF or CNPJ formatting based on digit count.
 * Up to 11 digits: CPF format (###.###.###-##)
 * More than 11 digits: CNPJ format (##.###.###/####-##)
 */
const formatCPFOrCNPJ = (value: string): string => {
  // Remove non-numeric characters
  const numericValue = value.replace(/\D/g, '');

  if (numericValue.length <= 11) {
    // CPF format: ###.###.###-##
    return numericValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ format: ##.###.###/####-##
    return numericValue
      .substring(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

export const FormFieldCPFOrCNPJ = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldCPFOrCNPJProps<TFieldValues, TName>) => {
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
    placeholder = '123.456.789-00 or 12.345.678/0000-00',
    ...formatProps
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
      render={({ field }) => {
        return (
          <NumberFormatBase
            {...formatProps}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            format={formatCPFOrCNPJ}
            customInput={Input}
            placeholder={placeholder}
            disabled={disabled ?? field.disabled}
          />
        );
      }}
    />
  );
};
