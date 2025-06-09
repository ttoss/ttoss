import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FeedbackTooltipProps } from '../FormFeedbackMessage';
import { FormField } from '../FormField';

export type FormFieldPhoneProps = {
  label: string;
  name: string;
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackVariant?: 'error' | 'warning' | 'info' | 'success';
  feedbackTooltipLabel?: string;
} & Partial<PatternFormatProps>;

export const FormFieldPhone = ({
  label,
  name,
  feedbackMessage,
  feedbackMaxLines,
  feedbackTooltipProps,
  ...patternFormatProps
}: FormFieldPhoneProps) => {
  return (
    <FormField
      name={name}
      label={label}
      feedbackMessage={feedbackMessage}
      feedbackMaxLines={feedbackMaxLines}
      feedbackTooltipProps={feedbackTooltipProps}
      feedbackVariant={patternFormatProps.feedbackVariant}
      feedbackTooltipLabel={patternFormatProps.feedbackTooltipLabel}
      render={({ field }) => {
        const format =
          field.value?.length > 10 ? '(##) #####-####' : '(##) ####-#####';

        return (
          <PatternFormat
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            format={format}
            customInput={Input}
            placeholder="(11) 91234-1234"
            {...patternFormatProps}
          />
        );
      }}
    />
  );
};
