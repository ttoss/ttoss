import type {
  IconifyIcon,
  IconifyIconHTMLElement,
  IconifyIconProps,
} from '@iconify-icon/react';
import { Icon as IconComponent } from '@iconify-icon/react';
import * as React from 'react';

export type IconType = string | IconifyIcon;

export type IconProps = Omit<IconifyIconProps, 'ref'>;

export type { IconifyIcon };

/**
 * Renders an Iconify icon and disables observer behavior by default.
 *
 * Set `noobserver={false}` only when you need Iconify observer updates enabled.
 */
export const Icon = React.forwardRef<IconifyIconHTMLElement | null, IconProps>(
  (props, ref) => {
    const { noobserver = true, ...restProps } = props;

    return (
      <IconComponent
        ref={ref}
        data-testid="iconify-icon"
        {...(noobserver ? { noobserver: true } : {})}
        {...restProps}
      />
    );
  }
);

Icon.displayName = 'Icon';
