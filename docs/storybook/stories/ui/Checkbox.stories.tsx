import { Checkbox, type CheckboxProps, Label } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

const Template: Story<CheckboxProps> = (args) => {
  return (
    <Label>
      <Checkbox {...args} />
      Label
    </Label>
  );
};

export const Example = Template.bind({});

export const ExampleDisabled = Template.bind({});

ExampleDisabled.args = {
  disabled: true,
  checked: true,
};

export default {
  title: 'UI/Checkbox',
  component: Checkbox,
} as Meta;
