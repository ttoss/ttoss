import { Flex, Grid, Icon, Text } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'UI/Icon',
  component: Icon,
} as Meta;

const Template: Story = (args) => {
  const icons = [
    'ant-design:down-square-filled',
    'ant-design:up-square-filled',
    'ant-design:arrow-left-outlined',
    'ant-design:arrow-right-outlined',
    args.dynamicIcon,
  ];

  return (
    <Grid columns={3}>
      {icons.map((icon) => {
        return (
          <Flex
            key={icon}
            sx={{ flexDirection: 'column', alignItems: 'center' }}
          >
            <Icon icon={icon} sx={{ fontSize: '40px' }} />
            <Text sx={{ fontSize: '12px' }}>{icon}</Text>
          </Flex>
        );
      })}
    </Grid>
  );
};

export const Example = Template.bind({});

Example.args = {
  dynamicIcon: 'mdi-light:home',
};
