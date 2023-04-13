import { Button, type ButtonProps } from 'theme-ui';
import { Icon } from './Icon';
import React from 'react';

export type CloseButtonProps = ButtonProps & {
  label?: string;
};

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  CloseButtonProps
>(({ label, sx, ...props }, ref) => {
  return (
    <Button
      variant="buttons.closeButton"
      type="button"
      aria-label={label}
      sx={{ gap: 'sm', padding: 0, ...sx }}
      {...props}
      ref={ref}
    >
      {label}

      <Icon icon="close" />
    </Button>
  );
});

CloseButton.displayName = 'CloseButton';
