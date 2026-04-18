import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from '@ttoss/ui2';

const meta: Meta<typeof RadioGroup> = {
  title: 'ui2/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Choose a plan',
  },
  argTypes: {
    isInvalid: {
      description:
        'Marks the group as invalid. Surfaces the `invalid` token State on every Radio child via React Aria render-props.',
      control: 'boolean',
    },
    isDisabled: {
      description:
        'Disables the entire group. Applies `disabled` state tokens to all Radio children.',
      control: 'boolean',
    },
    isRequired: {
      description: 'Marks the group as required for accessibility.',
      control: 'boolean',
    },
  },
  render: ({ label, ...args }) => {
    return (
      <RadioGroup label={label} {...args}>
        <Radio value="starter">Starter</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="enterprise">Enterprise</Radio>
      </RadioGroup>
    );
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

/** Default — neutral base chrome, no validation state. */
export const Default: Story = {
  args: {},
};

export const WithDefaultValue: Story = {
  args: { defaultValue: 'pro' },
};

/**
 * Invalid — runtime validation failure. Use when the group is required and
 * unsatisfied, or fails a `validate()` callback.
 */
export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: 'pro' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/** Disabled group — all options dimmed, non-interactive. */
export const AllDisabled: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <RadioGroup label="Plan (disabled)" isDisabled defaultValue="pro">
        <Radio value="starter">Starter</Radio>
        <Radio value="pro">Pro</Radio>
        <Radio value="enterprise">Enterprise</Radio>
      </RadioGroup>
    );
  },
};

/** Side-by-side comparison of primary states. */
export const AllStates: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
        <RadioGroup label="Default" defaultValue="pro">
          <Radio value="starter">Starter</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="enterprise">Enterprise</Radio>
        </RadioGroup>
        <RadioGroup label="Invalid" isInvalid defaultValue="pro">
          <Radio value="starter">Starter</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="enterprise">Enterprise</Radio>
        </RadioGroup>
        <RadioGroup label="Disabled" isDisabled defaultValue="pro">
          <Radio value="starter">Starter</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="enterprise">Enterprise</Radio>
        </RadioGroup>
      </div>
    );
  },
};
