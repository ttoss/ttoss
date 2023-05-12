import * as React from 'react';
import { Input } from '../Input';
import { type InputProps } from '../Input';
import { useHidePassInput } from './useHidePassInput';

export type InputPasswordProps = Omit<
  InputProps,
  'trailingIcon' | 'onTrailingIconClick' | 'type'
> & {
  showPasswordByDefault?: boolean;
};

export const InputPassword = React.forwardRef<
  HTMLInputElement,
  InputPasswordProps
>(({ showPasswordByDefault, ...inputPasswordProps }, ref) => {
  const { handleClick, icon, inputType } = useHidePassInput(
    !showPasswordByDefault
  );

  return (
    <Input
      ref={ref}
      {...inputPasswordProps}
      trailingIcon={icon}
      onTrailingIconClick={handleClick}
      type={inputType}
    />
  );
});

InputPassword.displayName = 'InputPassword';
