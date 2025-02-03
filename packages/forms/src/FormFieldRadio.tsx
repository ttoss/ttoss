import { Flex, Label, Radio, type RadioProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export const FormFieldRadio = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  sx,
  options,
  tooltip,
  ...radioProps
}: {
  options: FormRadioOption[];
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
