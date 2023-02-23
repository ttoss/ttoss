import * as React from 'react';
import {
  Icon as IconifyIcon,
  IconifyIconHTMLElement,
  IconifyIconProps,
} from '@iconify-icon/react';

export type IconProps = Omit<IconifyIconProps, 'ref'>;

export const Icon = React.forwardRef<IconifyIconHTMLElement | null, IconProps>(
  (props, ref) => {
    return <IconifyIcon ref={ref} data-testid="iconify-icon" {...props} />;
  }
);

Icon.displayName = 'Icon';
