import { BaseLayout, type BaseLayoutProps } from './BaseLayout';
import { type BoxProps, Container, type ContainerProps } from '@ttoss/ui';
import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';

export type { ContainerProps, BoxProps };

type LayoutProps = BaseLayoutProps;

export const Layout = ({ children, ...props }: LayoutProps) => {
  return (
    <BaseLayout variant="layout.layout" {...props}>
      {children}
    </BaseLayout>
  );
};

Layout.Header = Header;
Layout.Main = Main;
Layout.Footer = Footer;
Layout.Container = Container;
