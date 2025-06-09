import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FeedbackTooltipProps } from './FormFeedbackMessage';
import { FormField } from './FormField';

export type FormFieldPatternFormatProps = {
  label?: string;
  name: string;
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackVariant?: 'error' | 'warning' | 'info' | 'success';
} & PatternFormatProps;

export const FormFieldPatternFormat = ({
  label,
  name,
  feedbackMessage,
  feedbackMaxLines,
  feedbackTooltipProps,
  feedbackVariant,
  ...patternFormatProps
}: FormFieldPatternFormatProps) => {
  return (
    <FormField
      name={name}
      label={label}
      feedbackMessage={feedbackMessage}
      feedbackMaxLines={feedbackMaxLines}
      feedbackTooltipProps={feedbackTooltipProps}
      feedbackVariant={feedbackVariant}
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
