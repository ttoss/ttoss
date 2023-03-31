import {
  type CheckboxProps as CheckboxPropsUi,
  Checkbox as CheckboxUi,
} from 'theme-ui';
import React from 'react';

export type CheckboxProps = CheckboxPropsUi & {
  error?: boolean;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ error, ...props }, ref) => {
    return (
      <CheckboxUi
        aria-invalid={error ? 'true' : undefined}
        ref={ref}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';
