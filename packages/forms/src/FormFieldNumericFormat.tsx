import { Input } from '@ttoss/ui';
import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FormField } from './FormField';
import { WarningTooltipProps } from './FormWarningMessage';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  warning?: string | React.ReactNode;
  warningMaxLines?: number;
  warningTooltip?: WarningTooltipProps;
  tooltip?: {
    render: string | React.ReactNode;
    place: 'top';
    openOnClick?: boolean;
    clickable?: boolean;
  };
} & NumericFormatProps;

export const FormFieldNumericFormat = ({
  label,
  name,
  warning,
  tooltip,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      warning={warning}
      warningMaxLines={numericFormatProps.warningMaxLines}
      tooltip={tooltip}
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
