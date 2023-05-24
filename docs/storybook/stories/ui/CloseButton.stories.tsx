import { CloseButton, type CloseButtonProps, Flex } from '@ttoss/ui/src';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof CloseButton>;

const Component = (args: CloseButtonProps) => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: 'lg' }}>
      <CloseButton {...args} />
      <CloseButton {...args} onlyText />
      <CloseButton {...args} label={undefined} />
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
    label: 'Close',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
