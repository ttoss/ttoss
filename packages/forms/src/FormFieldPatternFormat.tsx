import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField } from './FormField';
import { WarningTooltipProps } from './FormWarningMessage';

export type FormFieldPatternFormatProps = {
  label?: string;
  name: string;
  warning?: string | React.ReactNode;
  warningMaxLines?: number;
  warningTooltip?: WarningTooltipProps;
} & PatternFormatProps;

export const FormFieldPatternFormat = ({
  label,
  name,
  warning,
  ...patternFormatProps
}: FormFieldPatternFormatProps) => {
  return (
    <FormField
      name={name}
      label={label}
      warning={warning}
      warningMaxLines={patternFormatProps.warningMaxLines}
      warningTooltip={patternFormatProps.warningTooltip}
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
