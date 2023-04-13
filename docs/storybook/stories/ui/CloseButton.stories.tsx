import { CloseButton, type CloseButtonProps, Flex } from '@ttoss/ui/src';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof CloseButton>;

const Component = (args: CloseButtonProps) => {
  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <CloseButton {...args} label={undefined} />
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
    label: 'Label Text',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const Focus: Story = {
  args: {
    ...Default.args,
    autoFocus: true,
  },
};
