import { Box, Input, type InputProps, Label } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

export const FormFieldInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  name,
  ...inputProps
}: {
  label?: string;
  name: TName;
} & InputProps) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const id = `form-field-input-${name}`;

  return (
    <Box>
      {label && (
        <Label aria-disabled={inputProps.disabled} htmlFor={id}>
          {label}
        </Label>
      )}
      <Input
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        name={name}
        id={id}
        {...inputProps}
      />
      <ErrorMessage name={name} />
    </Box>
  );
};
