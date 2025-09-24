import { Meta, StoryObj } from '@storybook/react-webpack5';
import { CloseButton, type CloseButtonProps, Flex } from '@ttoss/ui';
import { action } from 'storybook/actions';

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
