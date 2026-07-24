import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof Link> = {
  title: 'Navigation/Link',
  component: Link,
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: { children: 'View documentation', href: '#docs' },
};

export const Evaluations: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <Link href="#a" evaluation="primary">
          Primary link
        </Link>
        <Link href="#b" evaluation="secondary">
          Secondary link
        </Link>
        <Link href="#c" evaluation="muted">
          Muted link
        </Link>
      </Stack>
    );
  },
};
