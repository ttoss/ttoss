import { Checkbox, type CheckboxProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  sx,
  tooltip,
  onTooltipClick,
  ...checkboxProps
}: FormFieldProps<TFieldValues, TName> & CheckboxProps) => {
  return (
    <FormField
      label={label}
      name={name}
      tooltip={tooltip}
      onTooltipClick={onTooltipClick}
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
