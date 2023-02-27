import { Box, Flex, Input, type InputProps, Label, Text } from '@ttoss/ui';
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
  trailingIcon,
  leadingIcon,
  showCharacterCounter,
  sx,
  ...inputProps
}: {
  label?: string;
  name: TName;
  leadingIcon?: React.ReactNode;
  tooltipIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  showCharacterCounter?: boolean;
} & InputProps) => {
  const {
    field: { onChange, onBlur, value, ref },
    formState: { errors },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const characterCounter = React.useMemo(() => {
    if (!value) {
      return 0;
    }

    return value.length;
  }, [value]);

  const hasError = !!errors[name]?.message;

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
              sx={{ marginLeft: '9px', fontSize: '12px', lineHeight: 0 }}
              variant="tooltip-icon"
            >
              {tooltipIcon}
            </Text>
          )}

          {showCharacterCounter && (
            <Text
              sx={{ marginLeft: 'auto', fontSize: '12px', lineHeight: 0 }}
              variant="character-counter"
            >
              {characterCounter}
            </Text>
          )}
        </Label>
      )}
      <Flex sx={{ position: 'relative' }}>
        {leadingIcon && (
          <Text
            sx={{
              position: 'absolute',
              alignSelf: 'center',
              fontSize: '18px',
              left: '16px',
              lineHeight: 0,
            }}
            variant="leading-icon"
          >
            {leadingIcon}
          </Text>
        )}
        <Input
          ref={ref}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
          name={name}
          id={id}
          sx={{
            paddingLeft: leadingIcon ? '50px' : undefined,
            paddingRight: trailingIcon ? '50px' : undefined,
            borderColor: hasError ? 'danger' : undefined,
            borderWidth: '2px',
            ...sx,
          }}
          {...inputProps}
        />

        {trailingIcon && (
          <Text
            sx={{
              position: 'absolute',
              right: '16px',
              alignSelf: 'center',
              fontSize: '18px',
              lineHeight: 0,
              color: hasError ? 'danger' : undefined,
            }}
            variant="trailing-icon"
          >
            {trailingIcon}
          </Text>
        )}
      </Flex>
      <ErrorMessage name={name} />
    </Box>
  );
};
