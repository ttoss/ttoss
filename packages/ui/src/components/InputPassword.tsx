import * as React from 'react';

import { Input } from './Input';
import { type InputProps } from './Input';

export type InputPasswordProps = Omit<InputProps, 'trailingIcon' | 'type'> & {
  showPasswordByDefault?: boolean;
};

export const InputPassword = ({
  showPasswordByDefault = false,
  ...inputPasswordProps
}: InputPasswordProps) => {
  const [hidePass, setHidePass] = React.useState<boolean>(
    Boolean(!showPasswordByDefault)
  );

  const { icon, inputType } = React.useMemo(() => {
    return {
      icon: hidePass ? 'view-off' : 'view-on',
      inputType: hidePass ? 'password' : 'text',
    };
  }, [hidePass]);

  const handleClick = () => {
    setHidePass((prev) => {
      return !prev;
    });
  };

  return (
    <Input
      {...inputPasswordProps}
      trailingIcon={{ icon, onClick: handleClick }}
      type={inputType}
    />
  );
};
