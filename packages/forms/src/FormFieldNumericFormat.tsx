import { FormField } from './FormField';
import { Input } from '@ttoss/ui';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
} & NumericFormatProps;

export const FormFieldNumericFormat = ({
  label,
  name,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      render={({ field }) => {
        return (
          <NumericFormat
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.floatValue);
            }}
            customInput={Input}
            {...numericFormatProps}
          />
        );
      }}
    />
  );
};
