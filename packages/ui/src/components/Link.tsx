import { type LinkProps as LinkPropsUi, Link as LinkUi } from 'theme-ui';
import React from 'react';

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
