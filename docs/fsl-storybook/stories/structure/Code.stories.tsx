import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Code> = {
  title: 'Structure/Code',
  component: Code,
};

export default meta;

type Story = StoryObj<typeof Code>;

export const Default: Story = {
  args: { children: 'pnpm add @ttoss/fsl-ui' },
};

export const Inline: Story = {
  render: () => {
    return (
      <Text>
        Run <Code size="sm">pnpm dev</Code> to start the local server.
      </Text>
    );
  },
};
