import { Box, Flex, Label, Radio, type RadioProps, Text } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

type FormRadioOption = {
  value: string | number;
  label: string;
  description?: string;
};

export type FormFieldRadioCardProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<RadioProps, 'name'> & {
    options: FormRadioOption[];
    direction?: 'column' | 'row';
    width?: string;
  };

export const FormFieldRadioCard = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldRadioCardProps<TFieldValues, TName>) => {
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
    options,
    direction = 'column',
    width = 'full',
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
              flexDirection: direction,
              gap: '4',
            }}
          >
            {options.map((option: FormRadioOption) => {
              const key = `form-field-radio-${name}-${option.value}`;

              return (
                <Box
                  key={key}
                  sx={{
                    gap: '2',
                    width,
                    border: 'md',
                    borderColor: 'display.border.muted.default',
                    borderRadius: 'md',
                  }}
                >
                  <Label
                    sx={{
                      fontSize: 'md',
                      width: '100%',
                      padding: '4',
                    }}
                  >
                    <Radio
                      {...radioProps}
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
                    />
                    <Flex sx={{ flexDirection: 'column', gap: '1' }}>
                      {option.label && <Text>{option.label}</Text>}
                      {option.description && (
                        <Text sx={{ fontSize: 'sm' }}>
                          {option.description}
                        </Text>
                      )}
                    </Flex>
                  </Label>
                </Box>
              );
            })}
          </Flex>
        );
      }}
    />
  );
};
