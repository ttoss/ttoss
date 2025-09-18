import { Meta, StoryObj } from '@storybook/react-webpack5';
import { InputPassword } from '@ttoss/ui';
import { action } from 'storybook/actions';

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
