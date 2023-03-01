import { Box, Icon, Input, type InputProps, Label, Text } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';
import React from 'react';
import type { IconifyIcon } from '@iconify/types';

type IconType = string | React.ReactNode | IconifyIcon;

const renderIcon = (icon: IconType) => {
  if (
    typeof icon === 'string' ||
    (typeof icon === 'object' && !!(icon as IconifyIcon)?.body)
  ) {
    return <Icon icon={icon as string | IconifyIcon} />;
  }

  return <>{icon}</>;
};

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

    return value.length;
  }, [value]);

  const tooltipIconElement = React.useMemo(() => {
    if (!tooltipIcon) {
      return null;
    }

    return renderIcon(tooltipIcon);
  }, [tooltipIcon]);

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
          {tooltipIconElement && (
            <Text
              sx={{ marginLeft: '9px', fontSize: '12px', lineHeight: 0 }}
              variant="tooltip-icon"
            >
              {tooltipIconElement}
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
