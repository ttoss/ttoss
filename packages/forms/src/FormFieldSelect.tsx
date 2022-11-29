import { Box, Label, Select, type SelectProps } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export const FormFieldSelect = <
  TFieldValues extends FieldValues = FieldValues
>({
  label,
  name,
  options,
  arrow,
}: {
  label?: string;
  name: Path<TFieldValues>;
  options: FormRadioOption[];
  arrow?: SelectProps['arrow'];
}) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const id = `form-field-select-${name}`;

  return (
    <Box>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select
        ref={ref}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        arrow={arrow}
        variant="form.select"
      >
        {options.map((option) => {
          return (
            <option key={id} value={option.value} id={id}>
              {option.label}
            </option>
          );
        })}
      </Select>

      <ErrorMessage name={name} />
    </Box>
  );
};
