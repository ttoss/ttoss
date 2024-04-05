import * as React from 'react';

export interface ListProps extends HTMLProps<HTMLUListElement> {
  children: React.ReactNode;
}

export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ children, ...props }, ref) => {
    return (
      <ul {...props} ref={ref}>
        {children}
      </ul>
    );
  }
);

List.displayName = 'List';
