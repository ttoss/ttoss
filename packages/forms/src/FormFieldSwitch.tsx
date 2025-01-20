import { Switch, type SwitchProps } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from './FormField';

export const FormFieldSwitch = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  sx,
  ...switchProps
}: {
  label?: React.ReactNode;
  name: TName;
  tooltip?: string | React.ReactNode;
} & SwitchProps) => {
  return (
    <FormField
      label={label}
      name={name}
      render={({ field, fieldState }) => {
        return (
          <Switch
            {...field}
            {...switchProps}
            aria-invalid={!!fieldState.error}
            sx={sx}
          />
        );
      }}
    />
  );
};
