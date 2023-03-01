import { Flex, Icon, Text } from '..';
import React from 'react';
import type { IconifyIcon } from '@iconify/types';

import { type InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';

export type IconType = string | React.ReactNode | IconifyIcon;

export type InputProps = InputPropsUI & {
  leadingIcon?: IconType;
  trailingIcon?: IconType;
  showCharacterCounter?: boolean;
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
  (
    { leadingIcon, trailingIcon, sx, showCharacterCounter, ...inputProps },
    ref
  ) => {
    const leadingIconElement = React.useMemo(() => {
      if (!leadingIcon) {
        return null;
      }

      return renderIcon(leadingIcon);
    }, [leadingIcon]);

    const trailingIconElement = React.useMemo(() => {
      if (!trailingIcon) {
        return null;
      }

      return renderIcon(trailingIcon);
    }, [trailingIcon]);

    const characterCounter = React.useMemo(() => {
      if (!inputProps.value) {
        return 0;
      }

      return String(inputProps.value).length;
    }, [inputProps.value]);

    return (
      <Flex sx={{ position: 'relative' }}>
        {showCharacterCounter && (
          <Text
            sx={{
              marginLeft: 'auto',
              fontSize: 'xs',
              lineHeight: 0,
              position: 'absolute',
              right: 0,
              top: '-md',
            }}
            variant="character-counter"
          >
            {characterCounter}
          </Text>
        )}

        {leadingIcon && (
          <Text
            sx={{
              position: 'absolute',
              alignSelf: 'center',
              fontSize: 'lg',
              left: '1rem',
              lineHeight: 0,
            }}
            variant="leading-icon"
          >
            {leadingIconElement}
          </Text>
        )}
        <InputUI
          ref={ref}
          sx={{
            paddingLeft: leadingIcon ? '3xl' : undefined,
            paddingRight: trailingIcon ? '3xl' : undefined,
            ...sx,
          }}
          {...inputProps}
        />

        {trailingIcon && (
          <Text
            sx={{
              position: 'absolute',
              right: '1rem',
              alignSelf: 'center',
              fontSize: 'lg',
              lineHeight: 0,
            }}
            variant="trailing-icon"
          >
            {trailingIconElement}
          </Text>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';
