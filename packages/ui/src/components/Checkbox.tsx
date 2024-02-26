import * as React from 'react';
import {
  Checkbox as CheckBoxUi,
  CheckboxProps as CheckboxPropsUi,
} from 'theme-ui';

export interface CheckboxProps extends CheckboxPropsUi {
  indeterminate?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  indeterminate = false,
  className = '',
  onChange,
  checked,
  ...rest
}) => {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <CheckBoxUi
      type="checkbox"
      ref={ref}
      onChange={handleChange}
      checked={checked}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  );
};
