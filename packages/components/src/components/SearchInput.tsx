import * as React from 'react';
import { Input, type InputProps } from '@ttoss/ui';
import { useDebounce } from '@ttoss/react-hooks';

export type SearchInputProps = Omit<InputProps, 'onChange'> & {
  loading?: boolean;
  debounce?: number;
  onChange: (value?: string | number | readonly string[]) => void;
};

export const SearchInput = ({
  value,
  defaultValue,
  loading,
  onChange,
  ...props
}: SearchInputProps) => {
  const [text, setText] = React.useState(value ?? defaultValue);

  const debouncedValue = useDebounce(text, 500);

  React.useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue]);

  return (
    <Input
      leadingIcon={loading ? 'loading' : 'search'}
      value={text}
      onChange={(e) => {
        return setText(e.target.value);
      }}
      {...props}
    />
  );
};
