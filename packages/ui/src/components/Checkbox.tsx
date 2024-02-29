import * as React from 'react';
import {
  Checkbox as CheckBoxUi,
  CheckboxProps as CheckboxPropsUi,
} from 'theme-ui';

export interface CheckboxProps extends CheckboxPropsUi {
  indeterminate?: boolean;
}

export const Checkbox = ({ indeterminate = false, ...rest }: CheckboxProps) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  if (indeterminate) {
    return <input type="checkbox" ref={ref} {...rest} />;
  }

  return (
    <CheckBoxUi
      ref={ref}
      sx={{
        borderBlock: false,
        borderRadius: '50%',
      }}
      {...rest}
    />
  );
};
