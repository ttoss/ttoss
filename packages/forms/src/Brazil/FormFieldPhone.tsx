import { Input } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField, type FormFieldProps } from '../FormField';

export type FormFieldPhoneProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<PatternFormatProps, 'name' | 'format'>;

export const FormFieldPhone = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldPhoneProps<TFieldValues, TName>) => {
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
    placeholder = '(11) 91234-1234',
    ...patternFormatProps
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
      render={({ field }) => {
        const format =
          field.value?.length > 10 ? '(##) #####-####' : '(##) ####-#####';

        return (
          <PatternFormat
            {...patternFormatProps}
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            format={format}
            customInput={Input}
            placeholder={placeholder}
            disabled={disabled ?? field.disabled}
          />
        );
      }}
    />
  );
};
