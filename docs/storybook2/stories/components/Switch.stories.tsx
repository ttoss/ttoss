import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '@ttoss/ui2';

/**
 * Accessible switch/toggle built on Ark UI.
 *
 * **Responsibility**: Selection — toggling between two states.
 *
 * **Semantic tokens**: `input.muted.*` (off), `action.primary.*` (on)
 */
const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
  args: {
    label: 'Dark mode',
  },
  parameters: {
    ttoss: {
      responsibility: 'Selection',
      foundations: {
        color: [
          'input.muted.background.default',
          'action.primary.background.checked',
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/** Default off state. */
export const Default: Story = {};

/** Pre-checked (on) state. */
export const Checked: Story = {
  args: { defaultChecked: true, label: 'Notifications enabled' },
};

/** Disabled state. */
export const Disabled: Story = {
  args: { disabled: true, label: 'Disabled switch' },
};

/** Multiple switches. */
export const Group: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Switch label="Email notifications" />
        <Switch label="Push notifications" defaultChecked />
        <Switch label="SMS notifications" disabled />
      </div>
    );
  },
};
