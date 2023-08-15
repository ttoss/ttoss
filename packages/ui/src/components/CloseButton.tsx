import * as React from 'react';
import { Button, type ButtonProps } from './Button';
import { Icon } from '@ttoss/react-icons';

export type CloseButtonProps = ButtonProps & {
  label?: string;
  onlyText?: boolean;
};

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  CloseButtonProps
>(({ label, sx, onlyText, ...props }, ref) => {
  if (onlyText && !label) {
    return null;
  }

  return (
    <Button
      variant="buttons.closeButton"
      type="button"
      aria-label={label}
      sx={{
        fontFamily: 'caption',
        fontSize: 'xs',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        lineHeight: 'normal',
        gap: 'sm',
        padding: 'sm',
        width: 'fit-content',
        transition: 'all 0.2s',
        '& > iconify-icon': {
          fontSize: 'base',
        },
        ...sx,
      }}
      {...props}
      ref={ref}
    >
      {label}

      {!onlyText && <Icon icon="close" />}
    </Button>
  );
});

CloseButton.displayName = 'CloseButton';
