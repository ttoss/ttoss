import * as React from 'react';
import {
  Checkbox as CheckBoxUi,
  CheckboxProps as CheckboxPropsUi,
} from 'theme-ui';

export interface CheckboxProps extends CheckboxPropsUi {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate = false, ...rest }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);

    /**
     * https://stackoverflow.com/a/68163315/8786986
     */
    React.useImperativeHandle(ref, () => {
      return innerRef.current as HTMLInputElement;
    });

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    if (indeterminate) {
      return <input type="checkbox" ref={innerRef} {...rest} />;
    }

    return <CheckBoxUi ref={innerRef} {...rest} />;
  }
);

Checkbox.displayName = 'Checkbox';
