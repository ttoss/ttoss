import { Box, Label, Select, type SelectProps } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

type FormRadioOption = {
  value: string | number;
  label: string;
};

type SelectSwitchProps =
  | (SelectProps & { placeholder?: never })
  | (SelectProps & { defaultValue?: never });

const checkDefaultValue = (
  options: Array<FormRadioOption>,
  defaultValue?: string | number | readonly string[],
  placeholder?: string
) => {
  const hasEmptyValue = options.some((opt) => {
    return opt.value === '' || opt.value === 0;
  });

  if (placeholder && hasEmptyValue) return '';
  if (placeholder && !hasEmptyValue) {
    options.push({
      label: '',
      value: '',
    });
    return '';
  }
  if (!placeholder && defaultValue) return defaultValue;
  return options[0].value;
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
  const { defaultValue, placeholder } = selectProps;

  const checkedDefaultValue = checkDefaultValue(
    options,
    defaultValue,
    placeholder
  );

  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: checkedDefaultValue,
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
