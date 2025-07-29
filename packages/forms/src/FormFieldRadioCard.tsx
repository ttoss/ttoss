import { Box, Flex, Label, Radio, type RadioProps, Text } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

type FormRadioOption = {
  value: string | number;
  label: string;
  description?: string;
};

export const FormFieldRadioCard = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  direction = 'column',
  width = 'full',
  sx,
  options,
  tooltip,
  onChange,
  ...radioProps
}: {
  options: FormRadioOption[];
  direction?: 'column' | 'row';
  width?: string;
  onChange?: (value: string | number) => void;
} & FormFieldProps<TFieldValues, TName> &
  RadioProps) => {
  return (
    <FormField
      label={label}
      name={name}
      sx={sx}
      tooltip={tooltip}
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
                      ref={field.ref}
                      onChange={(e) => {
                        field.onChange(e);
                        if (onChange) {
                          onChange(e.target.value);
                        }
                      }}
                      onBlur={field.onBlur}
                      value={option.value}
                      checked={field.value === option.value}
                      name={name}
                      {...radioProps}
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
