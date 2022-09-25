import { Box, Input, Label } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

export const FormFieldInput = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
}: {
  label?: string;
  name: Path<TFieldValues>;
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
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
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
