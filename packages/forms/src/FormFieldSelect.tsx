import { Box, Label, Select, type SelectProps } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

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
  ...selectProps
}: {
  label?: string;
  name: FieldPath<TFieldValues>;
  options: FormRadioOption[];
} & SelectSwitchProps) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: defaultValue ? defaultValue : '',
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
        id={id}
        {...{ ...selectProps, defaultValue: undefined }}
      >
        {options.map((option) => {
          return (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </Select>
      <ErrorMessage name={name} />
    </Box>
  );
};
