import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '@ttoss/ui2';

const meta: Meta<typeof Switch> = {
  title: 'ui2/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Enable notifications',
  },
  argTypes: {
    isDisabled: {
      description: 'Disables the switch. Applies `disabled` state tokens.',
      control: 'boolean',
    },
    isSelected: {
      description: 'Controls the ON/OFF state (controlled mode).',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/**
 * Default — neutral base chrome.
 *
 * Switches do not surface a `invalid` State because React Aria's `Switch`
 * has no validation; toggles change settings, they don't fail validation.
 */
export const Default: Story = {
  args: {},
};

export const On: Story = {
  args: { isSelected: true },
};

export const Off: Story = {
  args: { isSelected: false },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

export const DisabledOn: Story = {
  args: { isDisabled: true, isSelected: true },
};

/** Focus ring — trigger with Tab after clicking inside the canvas. */
export const FocusState: Story = {
  args: { autoFocus: true },
};

/** Side-by-side comparison of all primary states. */
export const AllStates: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Switch>Off (default)</Switch>
        <Switch isSelected>On</Switch>
        <Switch isDisabled>Disabled off</Switch>
        <Switch isDisabled isSelected>
          Disabled on
        </Switch>
      </div>
    );
  },
};
