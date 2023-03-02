import { Icon } from '..';
import React from 'react';
import type { IconifyIcon } from '@iconify/types';

export type IconTypeProp = string | IconifyIcon;

export const useIconElement = (icon?: IconTypeProp) => {
  const iconElement = React.useMemo(() => {
    if (
      !!icon &&
      (typeof icon === 'string' ||
        (typeof icon === 'object' && !!(icon as IconifyIcon)?.body))
    ) {
      return <Icon icon={icon as string | IconifyIcon} />;
    }

    return null;
  }, [icon]);

  return iconElement;
};
