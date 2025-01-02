import { Checkbox, type CheckboxProps, Flex, Label } from '@ttoss/ui';
import * as React from 'react';
import { FieldPath, FieldValues, useController } from 'react-hook-form';

import { FormErrorMessage } from './FormErrorMessage';

export const FormFieldCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  name,
  sx,
  ...checkboxProps
}: {
  label?: React.ReactNode;
  name: FieldPath<TFieldValues>;
} & CheckboxProps) => {
  const {
    field: { onChange, onBlur, value, ref },
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useController<any>({
    name,
    defaultValue: false,
  });

  const uniqueId = React.useId();

  const id = checkboxProps.id || `form-field-checkbox-${name}-${uniqueId}`;

  const error = !!errors[name]?.message;

  return (
    <Flex sx={{ flexDirection: 'column', width: '100%', ...sx }}>
      <Flex sx={{ alignItems: 'center' }}>
        <Label aria-disabled={checkboxProps.disabled} htmlFor={id}>
          <Checkbox
            id={id}
            ref={ref}
            checked={value}
            onChange={onChange}
            onBlur={onBlur}
            name={name}
            aria-invalid={error ? 'true' : 'false'}
            {...checkboxProps}
          />
          {label}
        </Label>
      </Flex>
      <FormErrorMessage name={name} />
    </Flex>
  );
};
