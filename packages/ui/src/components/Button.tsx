import * as React from 'react';
import {
  type ButtonProps as ButtonPropsUi,
  Button as ButtonUi,
} from 'theme-ui';
import { Icon, IconType } from '@ttoss/react-icons';

export type ButtonProps = ButtonPropsUi & {
  leftIcon?: IconType;
  rightIcon?: IconType;
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { children, leftIcon, rightIcon, loading, ...restProps } = props;

    return (
      <ButtonUi
        type="button"
        {...restProps}
        ref={ref}
        sx={{
          cursor: 'pointer',
          paddingX: '6',
          paddingY: '4',
          fontFamily: 'body',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4',
          ...restProps.sx,
        }}
      >
        {loading && <Icon inline icon="three-dots-loading" />}
        {!loading && leftIcon && <Icon inline icon={leftIcon} />}
        {children}
        {rightIcon && <Icon inline icon={rightIcon} />}
      </ButtonUi>
    );
  }
);

Button.displayName = 'Button';
