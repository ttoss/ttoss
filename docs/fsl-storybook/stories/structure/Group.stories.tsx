import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Group } from '@ttoss/fsl-ui';

const meta: Meta<typeof Group> = {
  title: 'Structure/Group',
  component: Group,
};

export default meta;

type Story = StoryObj<typeof Group>;

export const Default: Story = {
  render: () => {
    return (
      <Group label="Export">
        <Button evaluation="secondary">CSV</Button>
        <Button evaluation="secondary">JSON</Button>
      </Group>
    );
  },
};
