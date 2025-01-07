import { Box, Flex, Label, Radio, type RadioProps } from '@ttoss/ui';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { FormErrorMessage } from './FormErrorMessage';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export const FormFieldRadio = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  options,
  sx,
  ...radioProps
}: {
  label?: string;
  name: FieldPath<TFieldValues>;
  options: FormRadioOption[];
} & RadioProps) => {
  const {
    field: { onChange, onBlur, value, ref },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useController<any>({
    name,
    defaultValue: '',
  });

  return (
    <Flex sx={{ flexDirection: 'column', width: '100%', ...sx }}>
      {label && <Label sx={{ marginBottom: '1' }}>{label}</Label>}
      <Box>
        {options.map((option: FormRadioOption) => {
          const id = `form-field-radio-${name}-${option.value}`;

          return (
            <Label key={id} htmlFor={id}>
              <Radio
                ref={ref}
                onChange={onChange}
                onBlur={onBlur}
                value={option.value}
                checked={value === option.value}
                name={name}
                id={id}
                {...radioProps}
              />
              {option.label}
            </Label>
          );
        })}
      </Box>

      <FormErrorMessage name={name} />
    </Flex>
  );
};
