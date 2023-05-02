import * as React from 'react';
import { Button, type ButtonProps } from 'theme-ui';
import { Icon } from './Icon';

export type CloseButtonProps = ButtonProps & {
  label?: string;
  onlyText?: boolean;
};

export const CloseButton = React.forwardRef<
  HTMLButtonElement,
  CloseButtonProps
>(({ label, onlyText, ...props }, ref) => {
  if (onlyText && !label) {
    return null;
  }

  return (
    <Button
      variant="buttons.closeButton"
      type="button"
      aria-label={label}
      {...props}
      ref={ref}
    >
      {label}

      {!onlyText && <Icon icon="close" />}
    </Button>
  );
});

CloseButton.displayName = 'CloseButton';
