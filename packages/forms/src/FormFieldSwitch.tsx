import { Switch, type SwitchProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export const FormFieldSwitch = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  sx,
  tooltip,
  ...switchProps
}: FormFieldProps<TFieldValues, TName> & SwitchProps) => {
  return (
    <FormField
      label={label}
      name={name}
      tooltip={tooltip}
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
