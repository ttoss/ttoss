import { Input, Theme, ThemeUIStyleObject } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField } from './FormField';

export type FormFieldPatternFormatProps = {
  label?: string;
  name: string;
  warning?: string | React.ReactNode;
  inputTooltip?: {
    render: string | React.ReactNode;
    place: 'bottom' | 'top' | 'left' | 'right';
    openOnClick?: boolean;
    clickable?: boolean;
    variant?: 'info' | 'warning' | 'success' | 'error';
    sx?: ThemeUIStyleObject<Theme>;
  };
} & PatternFormatProps;

export const FormFieldPatternFormat = ({
  label,
  name,
  warning,
  inputTooltip,
  ...patternFormatProps
}: FormFieldPatternFormatProps) => {
  return (
    <FormField
      name={name}
      label={label}
      warning={warning}
      inputTooltip={inputTooltip}
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
