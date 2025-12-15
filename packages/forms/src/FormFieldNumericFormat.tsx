import { Input, type InputProps } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import type { NumericFormatProps } from 'react-number-format';
import { NumericFormat } from 'react-number-format';

import type { FormFieldProps } from './FormField';
import { FormField } from './FormField';

export type FormFieldNumericFormatProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<NumericFormatProps, 'name'> &
  Pick<InputProps, 'leadingIcon' | 'trailingIcon'>;

export const FormFieldNumericFormat = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldNumericFormatProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    leadingIcon,
    trailingIcon,
    auxiliaryCheckbox,
    onBlur,
    onValueChange,
    ...numericFormatProps
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
      render={({ field }) => {
        return (
          <NumericFormat
            {...numericFormatProps}
            name={field.name}
            value={field.value}
            onBlur={(e) => {
              field.onBlur();
              onBlur?.(e);
            }}
            onValueChange={(values, sourceInfo) => {
              field.onChange(values.floatValue);
              onValueChange?.(values, sourceInfo);
            }}
            customInput={Input}
            leadingIcon={leadingIcon}
            trailingIcon={trailingIcon}
            disabled={disabled ?? field.disabled}
          />
        );
      }}
    />
  );
};
