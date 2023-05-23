import { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from './FormField';
import { InputPassword, type InputPasswordProps } from '@ttoss/ui';

export type FormFieldPasswordProps<TName> = {
  label?: string;
  name: TName;
} & InputPasswordProps &
  FormFieldProps;

export const FormFieldPassword = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  name,
  tooltip,
  onTooltipClick,
  sx,
  defaultValue = '',
  ...inputProps
}: FormFieldPasswordProps<TName>) => {
  return (
    <FormField
      name={name}
      label={label}
      disabled={inputProps.disabled}
      tooltip={tooltip}
      onTooltipClick={onTooltipClick}
      sx={sx}
      defaultValue={defaultValue as FieldPathValue<TFieldValues, TName>}
      render={({ field, formState }) => {
        const hasError = !!formState.errors[name]?.message;

        return (
          <InputPassword
            {...inputProps}
            {...field}
            aria-invalid={hasError.valueOf()}
          />
        );
      }}
    />
  );
};
