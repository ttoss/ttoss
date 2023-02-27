import { Flex, Icon, Text } from '..';
import React from 'react';

import { type InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';

export type InputProps = InputPropsUI & {
  leadingIcon: string | React.ReactNode;
  trailingIcon: string | React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ leadingIcon, trailingIcon, sx, ...inputProps }, ref) => {
    return (
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
            {typeof leadingIcon === 'string' ? (
              <Icon icon={leadingIcon} />
            ) : (
              leadingIcon
            )}
          </Text>
        )}
        <InputUI
          ref={ref}
          sx={{
            paddingLeft: leadingIcon ? '50px' : undefined,
            paddingRight: trailingIcon ? '50px' : undefined,
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
            }}
            variant="trailing-icon"
          >
            {typeof trailingIcon === 'string' ? (
              <Icon icon={trailingIcon} />
            ) : (
              trailingIcon
            )}
          </Text>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';
