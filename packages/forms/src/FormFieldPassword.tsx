import { InputPassword, type InputPasswordProps } from '@ttoss/ui';
import { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldPasswordProps<TName> = {
  label?: string;
  name: TName;
} & InputPasswordProps &
  FormFieldProps;

export const FormFieldPassword = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  tooltip,
  tooltipClickable,
  tooltipStyle,
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
      tooltipClickable={tooltipClickable}
      tooltipStyle={tooltipStyle}
      sx={sx}
      defaultValue={defaultValue as FieldPathValue<TFieldValues, TName>}
      render={({ field, fieldState }) => {
        return (
          <InputPassword
            {...inputProps}
            {...field}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
