import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Icon } from '@ttoss/react-icons';
import { Flex, IconButton, IconButtonProps } from '@ttoss/ui';

export default {
  title: 'UI/IconButton',
  component: IconButton,
} as Meta;

const ChildrenTemplate: StoryFn<IconButtonProps> = (args) => {
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

const IconPropTemplate: StoryFn<IconButtonProps> = (args) => {
  return (
    <Flex
      sx={{
        gap: '4',
        flexDirection: 'row',
        alignItems: 'start',
      }}
    >
      <IconButton {...args} icon="delete" />
      <IconButton {...args} icon="ant-design:down-square-filled" />
    </Flex>
  );
};

export const WithChildren = ChildrenTemplate.bind({});
WithChildren.args = {
  variant: 'primary',
};

export const WithIconProp = IconPropTemplate.bind({});
WithIconProp.args = {
  variant: 'primary',
};

export const Accent = ChildrenTemplate.bind({});
Accent.args = {
  variant: 'accent',
};

export const Disabled = ChildrenTemplate.bind({});
Disabled.args = {
  variant: 'primary',
  disabled: true,
};
