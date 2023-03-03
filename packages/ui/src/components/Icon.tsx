import * as React from 'react';
import {
  Icon as IconifyIcon,
  IconifyIconHTMLElement,
  IconifyIconProps,
} from '@iconify-icon/react';
import type { IconifyIcon as IconifyIconType } from '@iconify/types';

export type IconType = string | IconifyIconType;

export type IconProps = Omit<IconifyIconProps, 'ref'>;

export const Icon = React.forwardRef<IconifyIconHTMLElement | null, IconProps>(
  (props, ref) => {
    return <IconifyIcon ref={ref} data-testid="iconify-icon" {...props} />;
  }
);

Icon.displayName = 'Icon';
