import * as React from 'react';
import {
  Checkbox as CheckBoxUi,
  CheckboxProps as CheckboxPropsUi,
} from 'theme-ui';

export interface CheckboxProps extends Omit<CheckboxPropsUi, 'onChange'> {
  indeterminate?: boolean;
  onChange?: (
    event: React.ChangeEvent<HTMLInputElement>,
    indeterminate: boolean
  ) => void;
}

export const Checkbox = ({
  indeterminate = false,
  onChange,
  ...rest
}: CheckboxProps) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const newState = target.checked;
    const newIndeterminate = newState ? false : indeterminate;

    if (onChange) {
      onChange(event, newIndeterminate);
    }
  };

  return <CheckBoxUi ref={ref} onChange={handleChange} {...rest} />;
};
