import { Box, Label, Radio, type RadioProps } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export const FormFieldRadio = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  options,
  ...radioProps
}: {
  label?: string;
  name: FieldPath<TFieldValues>;
  options: FormRadioOption[];
} & RadioProps) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  return (
    <Box>
      {label && <Label>{label}</Label>}
      <Box>
        {options.map((option) => {
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

      <ErrorMessage name={name} />
    </Box>
  );
};
