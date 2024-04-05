import * as React from 'react';

export interface ListItemProps extends React.HTMLProps<HTMLLIElement> {
  children: React.ReactNode;
}

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  (props, ref) => {
    const { children, ...rest } = props;
    return (
      <li {...rest} ref={ref}>
        {children}
      </li>
    );
  }
);

ListItem.displayName = 'ListItem';
