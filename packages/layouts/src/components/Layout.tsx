import {
  Box,
  type BoxProps,
  Container,
  type ContainerProps,
  type StackProps,
} from '@ttoss/ui';

import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';
import { Sidebar } from './Sidebar';

export type { BoxProps, ContainerProps };

export const Layout = ({ children }: React.PropsWithChildren<StackProps>) => {
  return <Box variant="layout.layout">{children}</Box>;
};

Layout.Header = Header;
Layout.Sidebar = Sidebar;
Layout.Main = Main;
Layout.Footer = Footer;
Layout.Container = Container;
