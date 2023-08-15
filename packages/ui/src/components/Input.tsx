import * as React from 'react';
import { Flex, Text } from '..';
import { Icon, type IconType } from '@ttoss/react-icons';
import { InputProps as InputPropsUI, Input as InputUI } from 'theme-ui';

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
              left: '1rem',
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
            paddingY: 'lg',
            paddingX: 'xl',
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
