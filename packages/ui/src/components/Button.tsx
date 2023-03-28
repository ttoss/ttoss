import * as React from 'react';
import {
  type ButtonProps as ButtonPropsUi,
  Button as ButtonUi,
} from 'theme-ui';
import { Icon } from './Icon';

export type ButtonProps = ButtonPropsUi & {
  leftIcon?: React.ReactNode | string;
  rightIcon?: React.ReactNode | string;
};

const RenderIcon = ({ icon }: { icon: React.ReactNode | string }) => {
  if (!icon) {
    return null;
  }

  if (typeof icon === 'string') {
    return (
      <>
        <Icon icon={icon} />
      </>
    );
  }

  return <>{icon}</>;
};

const MemoizedRenderIcon = React.memo(RenderIcon);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { children, leftIcon, rightIcon, ...restProps } = props;

    return (
      <ButtonUi
        ref={ref}
        {...restProps}
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
        <MemoizedRenderIcon icon={leftIcon} />
        {children}
        <MemoizedRenderIcon icon={rightIcon} />
      </ButtonUi>
    );
  }
);

Button.displayName = 'Button';
