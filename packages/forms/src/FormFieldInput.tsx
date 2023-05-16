import { FieldPath, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from './FormField';
import { Input, type InputProps } from '@ttoss/ui';

export type FormFieldInputProps<TName> = {
  label?: string;
  name: TName;
} & InputProps &
  FormFieldProps;

export const FormFieldInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  name,
  tooltip,
  onTooltipClick,
  sx,
  ...inputProps
}: FormFieldInputProps<TName>) => {
  return (
    <FormField
      name={name}
      label={label}
      disabled={inputProps.disabled}
      tooltip={tooltip}
      onTooltipClick={onTooltipClick}
      sx={sx}
      render={({ field, formState }) => {
        const hasError = !!formState.errors[name]?.message;

        return (
          <Input {...inputProps} {...field} aria-invalid={hasError.valueOf()} />
        );
      }}
    />
  );
};
