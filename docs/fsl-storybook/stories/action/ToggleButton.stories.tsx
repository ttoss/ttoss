import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, ToggleButton } from '@ttoss/fsl-ui';

const meta: Meta<typeof ToggleButton> = {
  title: 'Action/ToggleButton',
  component: ToggleButton,
};

export default meta;

type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = {
  args: { children: 'Bold' },
};

export const Selected: Story = {
  args: { children: 'Bold', defaultSelected: true },
};

export const Evaluations: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <ToggleButton evaluation="primary" defaultSelected>
          Primary
        </ToggleButton>
        <ToggleButton evaluation="muted" defaultSelected>
          Muted
        </ToggleButton>
      </Stack>
    );
  },
};
