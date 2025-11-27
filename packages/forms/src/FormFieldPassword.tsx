import { InputPassword, type InputPasswordProps } from '@ttoss/ui';
import { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldPasswordProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & Omit<InputPasswordProps, 'name'>;

export const FormFieldPassword = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  defaultValue = '' as FieldPathValue<TFieldValues, TName>,
  disabled,
  ...props
}: FormFieldPasswordProps<TFieldValues, TName>) => {
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
    auxiliaryCheckbox,
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
      auxiliaryCheckbox={auxiliaryCheckbox}
      render={({ field, fieldState }) => {
        return (
          <InputPassword
            {...inputProps}
            {...field}
            leadingIcon={leadingIcon}
            disabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
