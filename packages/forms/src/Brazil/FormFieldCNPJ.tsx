import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField, type FormFieldProps } from '../FormField';

export type FormFieldCNPJProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCnpjValid = (cnpj: any) => {
  if (cnpj?.length != 14) {
    return false;
  }

  if (
    cnpj == '00000000000000' ||
    cnpj == '11111111111111' ||
    cnpj == '22222222222222' ||
    cnpj == '33333333333333' ||
    cnpj == '44444444444444' ||
    cnpj == '55555555555555' ||
    cnpj == '66666666666666' ||
    cnpj == '77777777777777' ||
    cnpj == '88888888888888' ||
    cnpj == '99999999999999'
  ) {
    return false;
  }

  // Valida DVs
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let soma = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    soma += numbers.charAt(size - i) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let result = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (result != digits.charAt(0)) {
    return false;
  }

  size = size + 1;
  numbers = cnpj.substring(0, size);
  soma = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    soma += numbers.charAt(size - i) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  result = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (result != digits.charAt(1)) {
    return false;
  }

  return true;
};

export const FormFieldCNPJ = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldCNPJProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    tooltip,
    inputTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    placeholder = '12.345.678/0000-00',
    ...patternFormatProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      tooltip={tooltip}
      inputTooltip={inputTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      render={({ field }) => {
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
            disabled={disabled}
          />
        );
      }}
    />
  );
};
