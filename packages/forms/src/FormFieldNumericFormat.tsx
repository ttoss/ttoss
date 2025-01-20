import { Input } from '@ttoss/ui';
import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FormField } from './FormField';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  tooltip?: string | React.ReactNode;
  tooltipClickable?: boolean;
} & NumericFormatProps;

export const FormFieldNumericFormat = ({
  label,
  name,
  tooltip,
  tooltipClickable,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      tooltip={tooltip}
      tooltipClickable={tooltipClickable}
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
