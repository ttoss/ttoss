import { Input } from '@ttoss/ui';
import * as React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { FeedbackTooltipProps } from './FormFeedbackMessage';
import { FormField } from './FormField';

export type FormFieldNumericFormatProps = {
  label?: string;
  name: string;
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackVariant?: 'error' | 'warning' | 'info' | 'success';
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
  feedbackMessage,
  tooltip,
  feedbackMaxLines,
  ...numericFormatProps
}: FormFieldNumericFormatProps) => {
  return (
    <FormField
      label={label}
      name={name}
      feedbackMessage={feedbackMessage}
      feedbackMaxLines={feedbackMaxLines}
      feedbackTooltipProps={numericFormatProps.feedbackTooltipProps}
      feedbackVariant={numericFormatProps.feedbackVariant}
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
