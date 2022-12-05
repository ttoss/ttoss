import { Box, Checkbox, Flex, Label } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues
>({
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
    defaultValue: false,
  });

  const id = `form-field-checkbox-${name}`;

  return (
    <Box>
      <Flex sx={{ alignItems: 'center' }}>
        <Checkbox
          id={id}
          ref={ref}
          checked={value}
          onChange={onChange}
          onBlur={onBlur}
        />
        {label && <Label htmlFor={id}>{label}</Label>}
      </Flex>
      <ErrorMessage name={name} />
    </Box>
  );
};
