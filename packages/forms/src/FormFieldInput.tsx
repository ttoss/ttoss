import { Box, Input, Label } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

export const FormFieldInput = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  disabled,
  placeholder,
}: {
  label?: string;
  name: Path<TFieldValues>;
  disabled?: boolean;
  placeholder?: string;
}) => {
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
        <Label aria-disabled={disabled} htmlFor={id}>
          {label}
        </Label>
      )}
      <Input
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        name={name}
        disabled={disabled}
        placeholder={placeholder}
        id={id}
      />
      <ErrorMessage name={name} />
    </Box>
  );
};
