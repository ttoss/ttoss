import { Meta, Story } from '@storybook/react';

import { Checkbox, type CheckboxProps, Label } from '@ttoss/ui';

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
  title: 'Components/Checkbox',
  component: Checkbox,
} as Meta;
