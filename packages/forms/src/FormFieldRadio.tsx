import { Box, Label, Radio } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export const FormFieldRadio = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  options,
}: {
  label?: string;
  name: Path<TFieldValues>;
  options: FormRadioOption[];
}) => {
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
                defaultChecked={value === option.value}
                name={name}
                id={id}
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
