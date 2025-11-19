import type { FieldPath, FieldValues } from 'react-hook-form';

import {
  FormFieldNumericFormat,
  type FormFieldNumericFormatProps,
} from './FormFieldNumericFormat';

export type FormFieldCurrencyInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldNumericFormatProps<TFieldValues, TName> & {
  prefix: string;
};

export const FormFieldCurrencyInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  prefix,
  decimalSeparator = ',',
  thousandSeparator = '.',
  ...formFieldNumericFormatProps
}: FormFieldCurrencyInputProps<TFieldValues, TName>) => {
  return (
    <FormFieldNumericFormat
      fixedDecimalScale
      decimalScale={2}
      prefix={prefix}
      decimalSeparator={decimalSeparator}
      thousandSeparator={thousandSeparator}
      placeholder={`${prefix} 0${decimalSeparator}00`}
      allowNegative={false}
      {...formFieldNumericFormatProps}
    />
  );
};
