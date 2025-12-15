import * as React from 'react';
import type { CheckboxProps as CheckboxPropsUi } from 'theme-ui';
import { Checkbox as CheckBoxUi } from 'theme-ui';

export interface CheckboxProps extends CheckboxPropsUi {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate = false, ...rest }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);

    /**
     * Callback ref that properly forwards to both internal and external refs.
     * This is needed because we need to track the indeterminate state internally
     * while also forwarding the ref to the parent component (like react-hook-form).
     */
    const setRefs = React.useCallback(
      (element: HTMLInputElement | null) => {
        innerRef.current = element;

        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    if (indeterminate) {
      return <input type="checkbox" ref={setRefs} {...rest} />;
    }

    return <CheckBoxUi ref={setRefs} {...rest} />;
  }
);

Checkbox.displayName = 'Checkbox';
