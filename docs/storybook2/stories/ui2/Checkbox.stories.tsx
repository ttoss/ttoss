import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@ttoss/ui2';

const meta: Meta<typeof Checkbox> = {
  title: 'ui2/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Accept terms and conditions',
  },
  argTypes: {
    isInvalid: {
      description:
        'Marks the checkbox as invalid. Maps to the `invalid` token State on `vars.colors.input.primary` — the canonical signal for runtime validation failure.',
      control: 'boolean',
    },
    isDisabled: {
      description: 'Disables the checkbox. Applies `disabled` state tokens.',
      control: 'boolean',
    },
    isIndeterminate: {
      description:
        'Renders the dash (−) indicator instead of a check. Maps to `indeterminate` color state.',
      control: 'boolean',
    },
    isSelected: {
      description: 'Controls the checked state (controlled mode).',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/** Default — neutral base chrome, no validation state. */
export const Default: Story = {
  args: {},
};

/** Checked — selected state. */
export const Checked: Story = {
  args: { isSelected: true },
};

/** Disabled — non-interactive, dimmed. */
export const Disabled: Story = {
  args: { isDisabled: true },
};

/** Disabled + checked. */
export const DisabledChecked: Story = {
  args: { isDisabled: true, isSelected: true },
};

/** Indeterminate — dash indicator for "partial" tri-state scenarios. */
export const Indeterminate: Story = {
  args: { isIndeterminate: true },
};

/**
 * Invalid — runtime validation failure. Use when a required checkbox is
 * unchecked or fails a validate() callback. Surfaces the `invalid` token
 * State on background, border, and label.
 */
export const Invalid: Story = {
  args: { isInvalid: true },
};

/** Invalid + checked — invalid State persists when selected. */
export const InvalidChecked: Story = {
  args: { isInvalid: true, isSelected: true },
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Checkbox>Default</Checkbox>
        <Checkbox isSelected>Checked</Checkbox>
        <Checkbox isIndeterminate>Indeterminate</Checkbox>
        <Checkbox isInvalid>Invalid</Checkbox>
        <Checkbox isInvalid isSelected>
          Invalid + checked
        </Checkbox>
        <Checkbox isDisabled>Disabled</Checkbox>
      </div>
    );
  },
};
