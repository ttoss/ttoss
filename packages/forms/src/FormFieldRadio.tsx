import { Flex, Label, Radio, type RadioProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from './FormField';

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
  ...radioProps
}: {
  label?: React.ReactNode;
  name: TName;
  options: FormRadioOption[];
} & RadioProps) => {
  return (
    <FormField
      label={label}
      name={name}
      sx={sx}
      render={({ field }) => {
        return (
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '1',
            }}
          >
            {options.map((option: FormRadioOption) => {
              const id = `form-field-radio-${name}-${option.value}`;

              return (
                <Label
                  key={id}
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
