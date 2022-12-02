import {
  Box,
  BoxProps,
  Label,
  LabelProps,
  Select,
  type SelectProps,
} from '@ttoss/ui';
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
  containerProps,
  labelProps,
  selectProps,
}: {
  label?: string;
  name: Path<TFieldValues>;
  options: FormRadioOption[];
  containerProps?: BoxProps;
  labelProps?: LabelProps;
  selectProps?: SelectProps;
}) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const id = `form-field-select-${name}`;

  return (
    <Box {...containerProps}>
      {label && (
        <Label {...labelProps} htmlFor={id}>
          {label}
        </Label>
      )}
      <Select
        {...selectProps}
        ref={ref}
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        id={id}
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
