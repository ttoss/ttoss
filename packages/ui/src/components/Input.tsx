import { Flex, Icon, type IconType, Text } from '..';
import { type InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';
import React from 'react';

export type InputProps = InputPropsUI & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, trailingIcon, className, sx, ...inputProps }, ref) => {
    return (
      <Flex
        className={className}
        sx={{ ...sx, position: 'relative', padding: 0, border: 'none' }}
      >
        {leadingIcon && (
          <Text
            sx={{
              position: 'absolute',
              alignSelf: 'center',
              left: '1rem',
            }}
            variant="leading-icon"
          >
            <Icon inline icon={leadingIcon} />
          </Text>
        )}
        <InputUI
          ref={ref}
          sx={{
            ...sx,
            paddingLeft: leadingIcon ? '3xl' : undefined,
            paddingRight: trailingIcon ? '3xl' : undefined,
            margin: 0,
          }}
          className={className}
          {...inputProps}
        />

        {trailingIcon && (
          <Text
            sx={{
              position: 'absolute',
              right: '1rem',
              alignSelf: 'center',
            }}
            variant="trailing-icon"
          >
            <Icon inline icon={trailingIcon} />
          </Text>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';
