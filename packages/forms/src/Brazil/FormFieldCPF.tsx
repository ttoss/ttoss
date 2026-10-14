import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { PatternFormatProps } from 'react-number-format';
import { PatternFormat } from 'react-number-format';

import { FormField, type FormFieldProps } from '../FormField';

export type FormFieldCPFProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'>;

const REPEATED_DIGIT_CPFS = [
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
];

/**
 * Computes the CPF check digit that follows the first `length` digits.
 */
const getCpfCheckDigit = ({ cpf, length }: { cpf: string; length: number }) => {
  let soma = 0;
  for (let i = 0; i < length; i++) {
    soma += parseInt(cpf.charAt(i)) * (length + 1 - i);
  }
  const resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    return 0;
  }
  return resto;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCpfValid = (cpf: any) => {
  if (cpf?.length != 11) {
    return false;
  }

  if (
    REPEATED_DIGIT_CPFS.some((repeated) => {
      return cpf == repeated;
    })
  ) {
    return false;
  }

  // Valida primeiro dígito verificador
  if (getCpfCheckDigit({ cpf, length: 9 }) != parseInt(cpf.charAt(9))) {
    return false;
  }

  // Valida segundo dígito verificador
  if (getCpfCheckDigit({ cpf, length: 10 }) != parseInt(cpf.charAt(10))) {
    return false;
  }

  return true;
};

export const FormFieldCPF = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldCPFProps<TFieldValues, TName>) => {
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
    placeholder = '123.456.789-00',
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
            format={'###.###.###-##'}
            customInput={Input}
            placeholder={placeholder}
            disabled={disabled ?? field.disabled}
          />
        );
      }}
    />
  );
};
