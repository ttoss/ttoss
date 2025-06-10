import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FeedbackTooltipProps } from './FormFeedbackMessage';
import { FormField } from './FormField';

export type FormFieldPatternFormatProps = {
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
} & PatternFormatProps;

export const FormFieldPatternFormat = ({
  label,
  name,
  feedback,
  ...patternFormatProps
}: FormFieldPatternFormatProps) => {
  return (
    <FormField
      name={name}
      label={label}
      feedback={feedback}
      render={({ field, fieldState }) => {
        return (
          <PatternFormat
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            customInput={Input}
            aria-invalid={Boolean(fieldState.error).valueOf()}
            {...patternFormatProps}
          />
        );
      }}
    />
  );
};
