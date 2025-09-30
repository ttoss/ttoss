import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Layout, StackedLayout } from '@ttoss/layouts';

type Story = StoryObj<typeof Layout>;

export default {
  title: 'Layouts/StackedLayout',
  component: StackedLayout,
} as Meta<typeof Layout>;

const Header = () => {
  return <Layout.Header sx={{}}>Header</Layout.Header>;
};

Header.displayName = Layout.Header.displayName;

const Main = () => {
  return (
    <Layout.Main sx={{}}>
      <Layout.Main.Body>Main</Layout.Main.Body>
    </Layout.Main>
  );
};

Main.displayName = Layout.Main.displayName;

const Footer = () => {
  return <Layout.Footer sx={{}}>Footer</Layout.Footer>;
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
