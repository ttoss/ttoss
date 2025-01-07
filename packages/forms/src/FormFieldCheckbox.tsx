import { Checkbox, type CheckboxProps } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from './FormField';

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  name,
  sx,
  ...checkboxProps
}: {
  label?: React.ReactNode;
  name: FieldPath<TFieldValues>;
} & CheckboxProps) => {
  return (
    <FormField
      label={label}
      labelPosition="right"
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Checkbox
            {...field}
            {...checkboxProps}
            aria-invalid={!!fieldState.error}
            sx={sx}
          />
        );
      }}
    />
  );
};
