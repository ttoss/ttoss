import type { FieldPath, FieldValues } from 'react-hook-form';

import {
  FormFieldPatternFormat,
  type FormFieldPatternFormatProps,
} from '../FormFieldPatternFormat';

export type FormFieldCEPProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<FormFieldPatternFormatProps<TFieldValues, TName>, 'format'>;

export const FormFieldCEP = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  placeholder = '12345-678',
  ...formFieldPatternFormatProps
}: FormFieldCEPProps<TFieldValues, TName>) => {
  return (
    <FormFieldPatternFormat
      format={'#####-###'}
      placeholder={placeholder}
      {...formFieldPatternFormatProps}
    />
  );
};
