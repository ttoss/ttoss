import { Input } from '@ttoss/ui';
import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FeedbackTooltipProps } from './FormFeedbackMessage';
import { FormField } from './FormField';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  feedback?:
    | {
        message?: string | React.ReactNode;
        maxLines?: number;
        tooltipProps?: FeedbackTooltipProps;
        tooltipLabel?: string;
        variant?: 'success' | 'warning' | 'error' | 'info';
      }
    | string;
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
  feedback,
  tooltip,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      feedback={feedback}
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
