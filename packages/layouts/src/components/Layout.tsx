import * as React from 'react';
import { Flex, FlexProps } from '@ttoss/ui';
import { Footer } from './Footer';
import { Header } from './Header';

type LayoutComponents = {
  [key: string]: React.ReactElement[] | React.ReactElement | null;
};

export const Layout = (props: FlexProps) => {
  /**
   * It's not worth to use React.useMemo here because children props always
   * change when the parent component re-renders.
   */
  const { header, footer } = (() => {
    return React.Children.toArray(props.children).reduce<LayoutComponents>(
      (acc, child) => {
        if (React.isValidElement(child)) {
          // eslint-disable-next-line no-console
          console.log(child);

          if (child.type === Header) {
            acc.header = child;
          } else if (child.type === Footer) {
            acc.footer = child;
          }
        }

        return acc;
      },
      {
        header: null,
        footer: null,
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
      {footer}
    </Flex>
  );
};
