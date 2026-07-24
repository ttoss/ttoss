import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Container> = {
  title: 'Structure/Container',
  component: Container,
};

export default meta;

type Story = StoryObj<typeof Container>;

export const Default: Story = {
  render: () => {
    return (
      <Container>
        <Text>
          A centered container capped at the surface width with gutter padding.
        </Text>
      </Container>
    );
  },
};

export const Reading: Story = {
  render: () => {
    return (
      <Container size="reading">
        <Text>
          The reading size caps content at the long-form measure — article
          pages, docs, legal text.
        </Text>
      </Container>
    );
  },
};
