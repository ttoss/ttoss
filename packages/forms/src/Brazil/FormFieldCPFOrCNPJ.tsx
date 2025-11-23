import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField, type FormFieldProps } from '../FormField';

export type FormFieldCPFOrCNPJProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'>;

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
    tooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    placeholder = '123.456.789-00 or 12.345.678/0000-00',
    ...patternFormatProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      tooltip={tooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      render={({ field }) => {
        // Use CNPJ format which is longer and can accommodate CPF
        // CNPJ: ##.###.###/####-##  (14 digits)
        // CPF will use the first 11 digits: ###.###.###-##
        return (
          <PatternFormat
            {...patternFormatProps}
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            format={'##.###.###/####-##'}
            customInput={Input}
            placeholder={placeholder}
            disabled={disabled ?? field.disabled}
          />
        );
      }}
    />
  );
};
