import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';
import { Flex, Label, Select, type SelectProps } from '@ttoss/ui';

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
  sx,
  ...selectProps
}: {
  label?: string;
  name: FieldPath<TFieldValues>;
  options: FormRadioOption[];
} & SelectProps) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const id = `form-field-select-${name}`;

  return (
    <Flex sx={{ flexDirection: 'column', width: '100%', ...sx }}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select
        ref={ref}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        id={id}
        {...selectProps}
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
    </Flex>
  );
};
