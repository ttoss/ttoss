import * as React from 'react';
import { type IconButtonProps, IconButton as IconButtonUi } from 'theme-ui';

export type { IconButtonProps };

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    return <IconButtonUi type="button" {...props} ref={ref} />;
  }
);

IconButton.displayName = 'IconButton';
