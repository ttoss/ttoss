import { Input } from '@ttoss/ui';
import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FormField } from './FormField';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  warning?: boolean | string;
  tooltip?: string | React.ReactNode;
  onTooltipClick?: () => void;
} & NumericFormatProps;

export const FormFieldNumericFormat = ({
  label,
  name,
  warning,
  tooltip,
  onTooltipClick,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      warning={warning}
      tooltip={tooltip}
      onTooltipClick={onTooltipClick}
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
