import * as React from 'react';
import { type BoxProps, Container, type ContainerProps } from '@ttoss/ui';
import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';
import { StackedLayout } from './StackedLayout';

export type { ContainerProps, BoxProps };

type Layouts = 'StackedLayout';

type LayoutProps = React.PropsWithChildren<{
  layout?: Layouts;
}>;

export const Layout = ({ children }: LayoutProps) => {
  return <StackedLayout>{children}</StackedLayout>;
};

Layout.Header = Header;
Layout.Main = Main;
Layout.Footer = Footer;
Layout.Container = Container;
