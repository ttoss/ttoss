import { Flex, Label, Radio, type RadioProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

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
    tooltip,
    inputTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    ...radioProps
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
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={option.value}
                    checked={field.value === option.value}
                    name={name}
                    disabled={disabled}
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
