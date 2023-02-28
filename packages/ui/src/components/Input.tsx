import { Flex, Icon, Text } from '..';
import React from 'react';
import type { IconifyIcon } from '@iconify/types';

import { type InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';

type IconType = string | React.ReactNode | IconifyIcon;

export type InputProps = InputPropsUI & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
};

const renderIcon = (icon: IconType) => {
  if (
    typeof icon === 'string' ||
    (typeof icon === 'object' && !!(icon as IconifyIcon)?.body)
  ) {
    return <Icon icon={icon as string | IconifyIcon} />;
  }

  return <>{icon}</>;
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
            {renderIcon(leadingIcon)}
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
            {renderIcon(trailingIcon)}
          </Text>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';
