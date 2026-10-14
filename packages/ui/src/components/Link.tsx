import * as React from 'react';
import { Link as LinkUi, type LinkProps as LinkPropsUi } from 'theme-ui';

export type LinkProps = LinkPropsUi & {
  quiet?: boolean;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ quiet, className, ...props }, ref) => {
    return (
      <LinkUi
        className={`${quiet ? 'quiet' : ''} ${className ?? ''}`}
        {...props}
        ref={ref}
      />
    );
  }
);

Link.displayName = 'Link';
