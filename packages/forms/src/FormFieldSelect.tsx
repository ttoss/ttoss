import { Select, type SelectProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<SelectProps, 'name' | 'defaultValue'>;

export const FormFieldSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldSelectProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    tooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    ...selectProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      tooltip={tooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      render={({ field, fieldState }) => {
        return (
          <Select
            {...selectProps}
            {...field}
            isDisabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
