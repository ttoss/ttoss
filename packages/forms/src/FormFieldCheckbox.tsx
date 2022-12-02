import {
  Box,
  BoxProps,
  Checkbox,
  CheckboxProps,
  Flex,
  FlexProps,
  Label,
  LabelProps,
} from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues
>({
  label,
  name,
  checkboxProps,
  containerItemProps,
  containerProps,
  labelProps,
}: {
  label?: string;
  name: Path<TFieldValues>;
  containerProps?: BoxProps;
  checkboxProps?: CheckboxProps;
  labelProps?: LabelProps;
  containerItemProps?: FlexProps;
}) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: false,
  });

  const id = `form-field-checkbox-${name}`;

  return (
    <Box {...containerProps}>
      <Flex {...containerItemProps} sx={{ alignItems: 'center' }}>
        <Checkbox
          {...checkboxProps}
          id={id}
          ref={ref}
          checked={value}
          onChange={onChange}
          onBlur={onBlur}
        />
        {label && (
          <Label {...labelProps} htmlFor={id}>
            {label}
          </Label>
        )}
      </Flex>
      <ErrorMessage name={name} />
    </Box>
  );
};
