import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof Button> = {
  title: 'Action/Button',
  component: Button,
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Save changes' },
};

export const Evaluations: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Button evaluation="primary">Primary</Button>
        <Button evaluation="secondary">Secondary</Button>
        <Button evaluation="accent">Accent</Button>
        <Button evaluation="muted">Muted</Button>
        <Button evaluation="negative">Negative</Button>
      </Stack>
    );
  },
};

export const Disabled: Story = {
  args: { children: 'Unavailable', isDisabled: true },
};
