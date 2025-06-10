import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FeedbackTooltipProps } from '../FormFeedbackMessage';
import { FormField } from '../FormField';

export type FormFieldPhoneProps = {
  label: string;
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
} & Partial<PatternFormatProps>;

export const FormFieldPhone = ({
  label,
  name,
  feedback,
  ...patternFormatProps
}: FormFieldPhoneProps) => {
  return (
    <FormField
      name={name}
      label={label}
      feedback={feedback}
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
