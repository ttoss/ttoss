import { useDebounce } from '@ttoss/react-hooks';
import { Input, type InputProps } from '@ttoss/ui';
import * as React from 'react';

export type SearchProps = Omit<InputProps, 'onChange'> & {
  loading?: boolean;
  debounce?: number;
  onChange: (value?: InputProps['value']) => void;
};

export const Search = ({
  value,
  defaultValue,
  loading,
  onChange,
  ...props
}: SearchProps) => {
  const [text, setText] = React.useState(value ?? defaultValue);

  const debouncedValue = useDebounce(text, 500);

  React.useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <Input
      leadingIcon={loading ? 'loading' : 'search'}
      defaultValue={text}
      onChange={(e) => {
        return setText(e.target.value);
      }}
      {...props}
    />
  );
};
