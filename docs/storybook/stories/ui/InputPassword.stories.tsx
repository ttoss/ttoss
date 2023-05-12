import { InputPassword } from '@ttoss/ui/src';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof InputPassword>;

export default {
  title: 'UI/InputPassword',
  component: InputPassword,
} as Meta<typeof InputPassword>;

const PASSWORD = 'MyPassword';

export const Default: Story = {
  args: {
    defaultValue: PASSWORD,
    onChange: action('onChange'),
  },
};

export const ShowByDefault: Story = {
  args: {
    ...Default.args,
    showPasswordByDefault: true,
  },
};
