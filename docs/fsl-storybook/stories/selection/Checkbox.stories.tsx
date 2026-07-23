import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof Checkbox> = {
  title: 'Selection/Checkbox',
  component: Checkbox,
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: { children: 'Email me about product updates' },
};

export const States: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <Checkbox>Unchecked</Checkbox>
        <Checkbox defaultSelected>Checked</Checkbox>
        <Checkbox isIndeterminate>Indeterminate</Checkbox>
        <Checkbox isDisabled>Disabled</Checkbox>
      </Stack>
    );
  },
};
