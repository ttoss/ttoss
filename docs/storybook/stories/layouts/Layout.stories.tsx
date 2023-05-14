import { Footer, Header, Layout } from '@ttoss/layouts/src';
import { Meta, StoryObj } from '@storybook/react';

type Story = StoryObj<typeof Layout>;

export default {
  title: 'Layouts/Layout',
  component: Layout,
} as Meta<typeof Layout>;

export const Layout1: Story = {
  render: () => {
    return (
      <Layout>
        <Header>Header</Header>
        <div>Content1</div>
        <div>Content2</div>
        <Footer>Footer</Footer>
      </Layout>
    );
  },
};
