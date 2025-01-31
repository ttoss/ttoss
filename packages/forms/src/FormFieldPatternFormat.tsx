import { Input } from '@ttoss/ui';
import * as React from 'react';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField } from './FormField';

export type FormFieldPatternFormatProps = {
  label?: string;
  name: string;
  warning?: string | React.ReactNode;
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
