import { Box, BoxProps, Input, InputProps, Label, LabelProps } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

export const FormFieldInput = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  inputProps,
  containerProps,
  labelProps,
}: {
  label?: string;
  name: Path<TFieldValues>;
  inputProps?: InputProps;
  containerProps?: BoxProps;
  labelProps?: LabelProps;
}) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const id = `form-field-input-${name}`;

  return (
    <Box {...containerProps}>
      {label && (
        <Label {...labelProps} htmlFor={id}>
          {label}
        </Label>
      )}
      <Input
        {...inputProps}
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        name={name}
        id={id}
      />
      <ErrorMessage name={name} />
    </Box>
  );
};
