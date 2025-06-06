import { Select, type SelectProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, FormFieldProps } from './FormField';

type FormFieldSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps, 'defaultValue'> & FormFieldProps<TFieldValues, TName>;

export const FormFieldSelect = <
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  name,
  id,
  defaultValue,
  sx,
  css,
  disabled,
  tooltip,
  ...selectProps
}: FormFieldSelectProps<TFieldValues>) => {
  return (
    <FormField
      name={name}
      label={label}
      id={id}
      defaultValue={defaultValue}
      disabled={disabled}
      tooltip={tooltip}
      warning={selectProps.warning}
      warningMaxLines={selectProps.warningMaxLines}
      warningTooltip={selectProps.warningTooltip}
      sx={sx}
      css={css}
      render={({ field, fieldState }) => {
        return (
          <Select
            {...selectProps}
            {...field}
            isDisabled={disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
