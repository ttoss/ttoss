import { Input } from '@ttoss/ui';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FormField } from './FormField';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  warning?: string;
} & NumericFormatProps;

export const FormFieldNumericFormat = ({
  label,
  name,
  warning,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      warning={warning}
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
