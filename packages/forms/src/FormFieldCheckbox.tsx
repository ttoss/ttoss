import { Box, Checkbox, type CheckboxProps, Flex, Label } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues
>({
  label,
  name,
  ...checkboxProps
}: {
  label?: string;
  name: FieldPath<TFieldValues>;
} & CheckboxProps) => {
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
        <Label aria-disabled={checkboxProps.disabled} htmlFor={id}>
          <Checkbox
            id={id}
            ref={ref}
            checked={value}
            onChange={onChange}
            onBlur={onBlur}
            name={name}
            {...checkboxProps}
          />
          {label}
        </Label>
      </Flex>
      <ErrorMessage name={name} />
    </Box>
  );
};
