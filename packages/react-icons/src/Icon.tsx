import * as React from 'react';
import {
  Icon as IconComponent,
  IconifyIcon,
  IconifyIconHTMLElement,
  IconifyIconProps,
} from '@iconify-icon/react';

export type IconType = string | IconifyIcon;

export type IconProps = Omit<IconifyIconProps, 'ref'>;

export type { IconifyIcon };

export const Icon = React.forwardRef<IconifyIconHTMLElement | null, IconProps>(
  (props, ref) => {
    return <IconComponent ref={ref} data-testid="iconify-icon" {...props} />;
  }
);

Icon.displayName = 'Icon';
