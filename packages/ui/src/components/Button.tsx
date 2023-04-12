import * as React from 'react';
import {
  type ButtonProps as ButtonPropsUi,
  Button as ButtonUi,
} from 'theme-ui';
import { Icon, IconType } from './Icon';

export type ButtonProps = ButtonPropsUi & {
  leftIcon?: IconType;
  rightIcon?: IconType;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { children, leftIcon, rightIcon, ...restProps } = props;

    return (
      <ButtonUi
        type="button"
        {...restProps}
        ref={ref}
        sx={{
          cursor: 'pointer',
          paddingX: 'xl',
          paddingY: 'lg',
          fontFamily: 'body',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'lg',
          ...restProps.sx,
        }}
      >
        {leftIcon && <Icon inline icon={leftIcon} />}
        {children}
        {rightIcon && <Icon inline icon={rightIcon} />}
      </ButtonUi>
    );
  }
);

Button.displayName = 'Button';
