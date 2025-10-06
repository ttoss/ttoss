import { Meta, StoryFn } from '@storybook/react-webpack5';
import { type CheckboxProps, Flex, Label, Switch } from '@ttoss/ui';

export default {
  title: 'UI/Switch',
  component: Switch,
} as Meta;

const Template: StoryFn<CheckboxProps> = (args) => {
  return (
    <Label
      sx={{
        whiteSpace: 'nowrap',
      }}
    >
      Usar conta de anúncios
      <Flex
        sx={{
          width: 'full',
        }}
      >
        <Switch {...args} />
      </Flex>
    </Label>
  );
};

export const Example = Template.bind({});
