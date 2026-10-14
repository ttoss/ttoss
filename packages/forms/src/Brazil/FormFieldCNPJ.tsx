import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { PatternFormatProps } from 'react-number-format';
import { PatternFormat } from 'react-number-format';

import { FormField, type FormFieldProps } from '../FormField';

export type FormFieldCNPJProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'>;

const REPEATED_DIGIT_CNPJS = [
  '00000000000000',
  '11111111111111',
  '22222222222222',
  '33333333333333',
  '44444444444444',
  '55555555555555',
  '66666666666666',
  '77777777777777',
  '88888888888888',
  '99999999999999',
];

/**
 * Computes a CNPJ check digit (DV) from the digits that precede it.
 */
const getCnpjCheckDigit = ({ numbers }: { numbers: string }) => {
  const size = numbers.length;
  let soma = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    soma += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  return soma % 11 < 2 ? 0 : 11 - (soma % 11);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCnpjValid = (cnpj: any) => {
  if (cnpj?.length != 14) {
    return false;
  }

  if (
    REPEATED_DIGIT_CNPJS.some((repeated) => {
      return cnpj == repeated;
    })
  ) {
    return false;
  }

  // Valida DVs
  const size = cnpj.length - 2;
  const digits = cnpj.substring(size);

  if (
    getCnpjCheckDigit({ numbers: cnpj.substring(0, size) }) != digits.charAt(0)
  ) {
    return false;
  }

  if (
    getCnpjCheckDigit({ numbers: cnpj.substring(0, size + 1) }) !=
    digits.charAt(1)
  ) {
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
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    placeholder = '12.345.678/0000-00',
    auxiliaryCheckbox,
    ...patternFormatProps
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
