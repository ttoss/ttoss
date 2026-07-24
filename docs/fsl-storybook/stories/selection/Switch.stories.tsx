import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack, Switch } from '@ttoss/fsl-ui';

const meta: Meta<typeof Switch> = {
  title: 'Selection/Switch',
  component: Switch,
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: { children: 'Enable notifications' },
};

export const States: Story = {
  render: () => {
    return (
      <Stack gap="sm">
        <Switch>Off</Switch>
        <Switch defaultSelected>On</Switch>
        <Switch isDisabled>Disabled</Switch>
      </Stack>
    );
  },
};
