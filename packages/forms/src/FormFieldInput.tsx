import {
  Box,
  Icon,
  type IconType,
  Input,
  type InputProps,
  Label,
  Text,
} from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';
import React from 'react';

export const FormFieldInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  name,
  tooltipIcon,
  showCharacterCounter,
  ...inputProps
}: {
  label?: string;
  name: TName;
  tooltipIcon?: IconType;
  showCharacterCounter?: boolean;
} & InputProps) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const characterCounter = React.useMemo(() => {
    if (!value) {
      return 0;
    }

    return String(value).length;
  }, [value]);

  const id = `form-field-input-${name}`;

  return (
    <Box>
      {label && (
        <Label
          sx={{ display: 'flex', alignItems: 'center' }}
          aria-disabled={inputProps.disabled}
          htmlFor={id}
        >
          {label}
          {tooltipIcon && (
            <Text
              sx={{ marginLeft: 'md', fontSize: 'xs', lineHeight: 0 }}
              variant="tooltip-icon"
            >
              <Icon icon={tooltipIcon} />
            </Text>
          )}

          {showCharacterCounter && (
            <Text
              sx={{
                marginLeft: 'auto',
                fontSize: 'xs',
                lineHeight: 0,
              }}
              variant="character-counter"
            >
              {characterCounter}
            </Text>
          )}
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
