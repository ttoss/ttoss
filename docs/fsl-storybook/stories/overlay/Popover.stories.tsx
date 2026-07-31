import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Popover, PopoverTrigger, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Popover> = {
  title: 'Overlay/Popover',
  component: Popover,
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => {
    return (
      <PopoverTrigger>
        <Button evaluation="secondary">Details</Button>
        <Popover>
          <Text variant="body-sm">
            Deploys run from the main branch on every merge.
          </Text>
        </Popover>
      </PopoverTrigger>
    );
  },
};

export const Open: Story = {
  render: () => {
    return (
      <PopoverTrigger defaultOpen>
        <Button evaluation="secondary">Details</Button>
        <Popover>
          <Text variant="body-sm">
            Deploys run from the main branch on every merge.
          </Text>
        </Popover>
      </PopoverTrigger>
    );
  },
};
