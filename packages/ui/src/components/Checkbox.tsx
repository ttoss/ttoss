import * as React from 'react';
import {
  Checkbox as CheckBoxUi,
  CheckboxProps as CheckboxPropsUi,
} from 'theme-ui';

export interface CheckboxProps extends Omit<CheckboxPropsUi, 'onChange'> {
  indeterminate?: boolean;
}

export const Checkbox = ({ indeterminate = false, ...rest }: CheckboxProps) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return <CheckBoxUi ref={ref} {...rest} />;
};
