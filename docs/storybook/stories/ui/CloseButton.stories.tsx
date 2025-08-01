import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { CloseButton, type CloseButtonProps, Flex } from '@ttoss/ui';

type Story = StoryObj<typeof CloseButton>;

const Component = (args: CloseButtonProps) => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: '4' }}>
      <CloseButton {...args} />
    </Flex>
  );
};

export default {
  title: 'UI/CloseButton',
  component: Component,
} as Meta<typeof CloseButton>;

export const Default: Story = {
  args: {
    onClick: action('onChange'),
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
