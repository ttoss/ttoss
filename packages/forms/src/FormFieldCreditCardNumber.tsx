import type { FieldPath, FieldValues } from 'react-hook-form';

import {
  FormFieldPatternFormat,
  type FormFieldPatternFormatProps,
} from './FormFieldPatternFormat';

export type FormFieldCreditCardNumberProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldPatternFormatProps<TFieldValues, TName>;

export const FormFieldCreditCardNumber = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  format = '#### #### #### ####',
  placeholder = '1234 1234 1234 1234',
  ...formFieldPatternFormatProps
}: FormFieldCreditCardNumberProps<TFieldValues, TName>) => {
  return (
    <FormFieldPatternFormat
      format={format}
      placeholder={placeholder}
      {...formFieldPatternFormatProps}
    />
  );
};
