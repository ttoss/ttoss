import * as React from 'react';

export const useHidePassInput = (defaultValue = true) => {
  const [hidePass, setHidePass] = React.useState<boolean>(
    Boolean(defaultValue)
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

  return {
    handleClick,
    icon,
    inputType,
  };
};
