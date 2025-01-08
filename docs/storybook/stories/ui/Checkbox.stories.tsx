/* eslint-disable formatjs/no-literal-string-in-jsx */
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

export const ExampleIndeterminated = Template.bind({});

ExampleIndeterminated.args = {
  indeterminate: true,
};

export const ExampleDisabled = Template.bind({});

ExampleDisabled.args = {
  disabled: true,
  checked: true,
};

export const ExampleError = Template.bind({});

ExampleError.args = {
  'aria-invalid': 'true',
  defaultChecked: false,
};

export default {
  title: 'UI/Checkbox',
  component: Checkbox,
} as Meta;
