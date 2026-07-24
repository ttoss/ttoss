import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, CheckboxGroup } from '@ttoss/fsl-ui';

const meta: Meta<typeof CheckboxGroup> = {
  title: 'Selection/CheckboxGroup',
  component: CheckboxGroup,
};

export default meta;

type Story = StoryObj<typeof CheckboxGroup>;

export const Default: Story = {
  render: () => {
    return (
      <CheckboxGroup label="Notifications" description="Pick at least one">
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">SMS</Checkbox>
        <Checkbox value="push">Push</Checkbox>
      </CheckboxGroup>
    );
  },
};
