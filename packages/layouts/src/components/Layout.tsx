import * as React from 'react';
import { Flex, FlexProps } from '@ttoss/ui';
import { Footer } from './Footer';
import { Header } from './Header';

type LayoutComponents = {
  [key: string]: React.ReactElement[] | React.ReactElement | null;
  children: React.ReactElement[];
};

export const Layout = (props: FlexProps) => {
  /**
   * It's not worth to use React.useMemo here because children props always
   * change when the parent component re-renders.
   */
  const { header, footer, children } = (() => {
    return React.Children.toArray(props.children).reduce<LayoutComponents>(
      (acc, child) => {
        if (React.isValidElement(child)) {
          if (child.type === Header) {
            acc.header = child;
          } else if (child.type === Footer) {
            acc.footer = child;
          } else {
            acc.children = [...(acc.children || []), child];
          }
        }

        return acc;
      },
      {
        Header: null,
        Footer: null,
        children: [],
      }
    );
  })();

  return (
    <Flex
      variant="layout.layout"
      {...props}
      sx={{
        flexDirection: 'column',
        ...props.sx,
      }}
    >
      {header}
      {children}
      {footer}
    </Flex>
  );
};
