import { Meta, StoryObj } from '@storybook/react';
import { Label, Radio, RadioProps } from '@ttoss/ui';

type Story = StoryObj<typeof Radio>;

const Component = (args: RadioProps) => {
  return (
    <Label>
      <Radio {...args} />
      Label
    </Label>
  );
};

const meta: Meta<typeof Radio> = {
  title: 'UI/Radio',
  component: Component,
};

export default meta;

export const DefaultUnchecked: Story = {
  args: {},
};

export const DefaultChecked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    'aria-invalid': 'true',
  },
};
