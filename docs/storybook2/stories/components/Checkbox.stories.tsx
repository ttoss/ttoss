import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@ttoss/ui2';

/**
 * Accessible checkbox built on Ark UI.
 *
 * **Responsibility**: Selection — choosing one or more options.
 *
 * **Semantic tokens**: `input.primary.*` (default), `action.primary.*` (checked)
 */
const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
  args: {
    label: 'Accept terms and conditions',
  },
  parameters: {
    ttoss: {
      responsibility: 'Selection',
      foundations: {
        color: [
          'input.primary.background.default',
          'action.primary.background.checked',
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/** Default unchecked state. */
export const Default: Story = {};

/** Pre-checked state. */
export const Checked: Story = {
  args: { defaultChecked: true },
};

/** Disabled state. */
export const Disabled: Story = {
  args: { disabled: true, label: 'Disabled checkbox' },
};

/** Multiple checkboxes as a group. */
export const Group: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Checkbox label="Option A" />
        <Checkbox label="Option B" defaultChecked />
        <Checkbox label="Option C" />
        <Checkbox label="Disabled" disabled />
      </div>
    );
  },
};
