import { Meta, StoryObj } from '@storybook/react';
import { Layout, StackedLayout } from '@ttoss/layouts';

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
    >
      Header
    </Layout.Header>
  );
};

Header.displayName = Layout.Header.displayName;

const Main = () => {
  return (
    <Layout.Main
      sx={{
        backgroundColor: 'blue',
        height: '500px',
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

export const StackedLayoutStory: Story = {
  name: 'StackedLayout',
  render: () => {
    return (
      <StackedLayout>
        <Header />
        <Main />
        <Footer />
      </StackedLayout>
    );
  },
};
