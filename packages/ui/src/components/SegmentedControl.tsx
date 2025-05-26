import 'rc-segmented/assets/index.css';

import Segmented from 'rc-segmented';
import * as React from 'react';

export interface SegmentedControlProps {
  options: (
    | string
    | number
    | { label: React.ReactNode; value: string | number; disabled?: boolean }
  )[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
}

export const SegmentedControl = ({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  ...rest
}: SegmentedControlProps) => {
  return (
    <Segmented
      options={options}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
};
