import { Checkbox, type CheckboxProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & Omit<CheckboxProps, 'name'>;

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldCheckboxProps<TFieldValues, TName>) => {
  // Separate FormField props from Checkbox props
  const {
    label,
    name,
    tooltip,
    inputTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    ...checkboxProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      tooltip={tooltip}
      inputTooltip={inputTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      render={({ field, fieldState }) => {
        return (
          <Checkbox
            {...checkboxProps}
            {...field}
            disabled={disabled ?? field.disabled}
            aria-invalid={!!fieldState.error}
          />
        );
      }}
    />
  );
};
