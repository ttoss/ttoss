import { Flex, Icon, type IconType, Text } from '..';
import React from 'react';

import { type InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';

export type InputProps = InputPropsUI & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, trailingIcon, sx, ...inputProps }, ref) => {
    return (
      <Flex sx={{ position: 'relative', width: '100%', ...sx }}>
        {leadingIcon && (
          <Text
            sx={{
              position: 'absolute',
              alignSelf: 'center',
              fontSize: 'base',
              left: '1rem',
              lineHeight: 0,
            }}
            variant="leading-icon"
          >
            <Icon icon={leadingIcon} />
          </Text>
        )}
        <InputUI
          ref={ref}
          sx={{
            paddingLeft: leadingIcon ? '3xl' : undefined,
            paddingRight: trailingIcon ? '3xl' : undefined,
          }}
          {...inputProps}
        />

        {trailingIcon && (
          <Text
            sx={{
              position: 'absolute',
              right: '1rem',
              alignSelf: 'center',
              fontSize: 'base',
              lineHeight: 0,
            }}
            variant="trailing-icon"
          >
            <Icon icon={trailingIcon} />
          </Text>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';
