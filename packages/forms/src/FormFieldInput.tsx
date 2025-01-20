import { Input, type InputProps } from '@ttoss/ui';
import { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldInputProps<TName> = {
  label?: string;
  name: TName;
} & InputProps &
  FormFieldProps;

export const FormFieldInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  tooltip,
  tooltipClickable,
  onTooltipClick,
  sx,
  defaultValue = '',
  ...inputProps
}: FormFieldInputProps<TName>) => {
  return (
    <FormField
      name={name}
      label={label}
      disabled={inputProps.disabled}
      tooltip={tooltip}
      tooltipClickable={tooltipClickable}
      onTooltipClick={onTooltipClick}
      sx={sx}
      defaultValue={defaultValue as FieldPathValue<TFieldValues, TName>}
      render={({ field, fieldState }) => {
        return (
          <Input
            {...inputProps}
            {...field}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
