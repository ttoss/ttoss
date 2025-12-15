import { Flex, Label, Radio, type RadioProps } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export type FormFieldRadioProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<RadioProps, 'name'> & {
    options: FormRadioOption[];
  };

export const FormFieldRadio = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  options,
  ...props
}: FormFieldRadioProps<TFieldValues, TName>) => {
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
    onBlur,
    onChange,
    ...radioProps
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
        return (
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '1',
            }}
          >
            {options.map((option: FormRadioOption) => {
              const key = `form-field-radio-${name}-${option.value}`;

              return (
                <Label
                  key={key}
                  sx={{
                    fontSize: 'md',
                  }}
                >
                  <Radio
                    ref={field.ref}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange?.(e);
                    }}
                    onBlur={(e) => {
                      field.onBlur();
                      onBlur?.(e);
                    }}
                    value={option.value}
                    checked={field.value === option.value}
                    name={name}
                    disabled={disabled ?? field.disabled}
                    {...radioProps}
                  />
                  {option.label}
                </Label>
              );
            })}
          </Flex>
        );
      }}
    />
  );
};
