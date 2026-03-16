import { Input, type InputProps } from '@ttoss/ui';
import type { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & Omit<InputProps, 'name'>;

export const FormFieldInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  defaultValue = '' as FieldPathValue<TFieldValues, TName>,
  disabled,
  ...props
}: FormFieldInputProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    leadingIcon,
    trailingIcon,
    unsavedChangesGuard,
    auxiliaryCheckbox,
    onBlur,
    onChange,
    ...inputProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      labelTooltip={labelTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      unsavedChangesGuard={unsavedChangesGuard}
      auxiliaryCheckbox={auxiliaryCheckbox}
      render={({ field, fieldState }) => {
        return (
          <Input
            {...inputProps}
            {...field}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
            onChange={(e) => {
              field.onChange(e);
              onChange?.(e);
            }}
            leadingIcon={leadingIcon}
            trailingIcon={trailingIcon}
            disabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
