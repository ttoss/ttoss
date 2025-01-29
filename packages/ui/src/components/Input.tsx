import { Icon, type IconType } from '@ttoss/react-icons';
import * as React from 'react';
import { Input as InputUI, InputProps as InputPropsUI } from 'theme-ui';

import { Flex, Text } from '..';

export interface InputProps extends InputPropsUI {
  leadingIcon?: IconType;
  onLeadingIconClick?: () => void;
  trailingIcon?: IconType;
  onTrailingIconClick?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      leadingIcon,
      trailingIcon: trailingIconProp,
      onLeadingIconClick,
      onTrailingIconClick,
      className,
      sx,
      ...inputProps
    },
    ref
  ) => {
    const trailingIcon = inputProps['aria-invalid']
      ? 'warning-alt'
      : trailingIconProp;

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
              left: '4',
              cursor: onLeadingIconClick ? 'pointer' : 'default',
            }}
            onClick={onLeadingIconClick}
            variant="leading-icon"
          >
            <Icon inline icon={leadingIcon} />
          </Text>
        )}
        <InputUI
          ref={ref}
          sx={{
            fontFamily: 'body',
            paddingY: '3',
            paddingX: '4',
            ...sx,
            paddingLeft: leadingIcon ? '10' : undefined,
            paddingRight: trailingIcon ? '10' : undefined,
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
              cursor: onTrailingIconClick ? 'pointer' : 'default',
            }}
            variant="trailing-icon"
            onClick={onTrailingIconClick}
          >
            <Icon inline icon={trailingIcon} />
          </Text>
        )}
      </Flex>
    );
  }
);

Input.displayName = 'Input';
