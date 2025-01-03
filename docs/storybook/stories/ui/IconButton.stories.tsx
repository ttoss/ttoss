import { Meta, Story } from '@storybook/react';
import { Icon } from '@ttoss/react-icons';
import { Flex, IconButton, IconButtonProps } from '@ttoss/ui';

export default {
  title: 'UI/IconButton',
  component: IconButton,
} as Meta;

const Template: Story<IconButtonProps> = (args) => {
  return (
    <Flex
      sx={{
        gap: '4',
        flexDirection: 'row',
        alignItems: 'start',
      }}
    >
      <IconButton {...args}>
        <Icon icon="delete" />
      </IconButton>
      <IconButton {...args}>
        <Icon icon="ant-design:down-square-filled" />
      </IconButton>
    </Flex>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
};

export const Accent = Template.bind({});
Accent.args = {
  variant: 'accent',
};
