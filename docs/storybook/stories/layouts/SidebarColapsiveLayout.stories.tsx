import { Meta, StoryObj } from '@storybook/react';
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';

type Story = StoryObj<typeof Layout>;

export default {
  title: 'Layouts/Layout',
  component: Layout,
} as Meta<typeof Layout>;

const Header = () => {
  return (
    <Layout.Header
      sx={{
        backgroundColor: 'red',
        height: '100px',
      }}
      sidebarButton={true}
    >
      Header
    </Layout.Header>
  );
};

Header.displayName = Layout.Header.displayName;

const Sidebar = () => {
  return (
    <Layout.Sidebar
      sx={{
        backgroundColor: 'orange',
        height: '500px',
      }}
    >
      Sidebar
    </Layout.Sidebar>
  );
};

Sidebar.displayName = Layout.Sidebar.displayName;

const Main = () => {
  return (
    <Layout.Main
      sx={{
        backgroundColor: 'blue',
        height: '500px',
        width: 'full',
      }}
    >
      Main
    </Layout.Main>
  );
};

Main.displayName = Layout.Main.displayName;

const Footer = () => {
  return (
    <Layout.Footer
      sx={{
        backgroundColor: 'green',
        height: '50px',
      }}
    >
      Footer
    </Layout.Footer>
  );
};

Footer.displayName = Layout.Footer.displayName;

export const SidebarCollapseLayoutStory: Story = {
  name: 'SidebarCollapseLayout',
  render: () => {
    return (
      <SidebarCollapseLayout>
        <Header />
        <Sidebar />
        <Main />
        <Footer />
      </SidebarCollapseLayout>
    );
  },
};
