import { Input, SxProp, Theme, ThemeUIStyleObject } from '@ttoss/ui';
import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FormField } from './FormField';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  warning?: string | React.ReactNode;
  tooltip?: {
    render: string | React.ReactNode;
    place: 'top';
    openOnClick?: boolean;
    clickable?: boolean;
  };
  inputTooltip?: {
    render: string | React.ReactNode;
    place: 'bottom' | 'top' | 'left' | 'right';
    openOnClick?: boolean;
    clickable?: boolean;
    variant?: 'info' | 'warning' | 'success' | 'error';
    sx?: ThemeUIStyleObject<Theme>;
  } & SxProp;
} & NumericFormatProps;

export const FormFieldNumericFormat = ({
  label,
  name,
  warning,
  tooltip,
  inputTooltip,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      warning={warning}
      tooltip={tooltip}
      inputTooltip={inputTooltip}
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
