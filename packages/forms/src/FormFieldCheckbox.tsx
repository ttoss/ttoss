import { Checkbox, type CheckboxProps } from '@ttoss/ui';
import type { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & Omit<CheckboxProps, 'name'>;

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  defaultValue = false as FieldPathValue<TFieldValues, TName>,
  disabled,
  ...props
}: FormFieldCheckboxProps<TFieldValues, TName>) => {
  // Separate FormField props from Checkbox props
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    ...checkboxProps
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
      render={({ field, fieldState }) => {
        const { value, ...fieldWithoutValue } = field;
        return (
          <Checkbox
            {...checkboxProps}
            {...fieldWithoutValue}
            checked={value}
            disabled={disabled ?? field.disabled}
            aria-invalid={!!fieldState.error}
          />
        );
      }}
    />
  );
};
