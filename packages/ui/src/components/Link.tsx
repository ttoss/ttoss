import * as React from 'react';
import { type LinkProps as LinkPropsUi, Link as LinkUi } from 'theme-ui';

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
