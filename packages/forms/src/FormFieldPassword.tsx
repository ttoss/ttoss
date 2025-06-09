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
      feedbackMessage={inputProps.feedbackMessage}
      feedbackMaxLines={inputProps.feedbackMaxLines}
      feedbackTooltipProps={inputProps.feedbackTooltipProps}
      feedbackVariant={inputProps.feedbackVariant}
      feedbackTooltipLabel={inputProps.feedbackTooltipLabel}
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
