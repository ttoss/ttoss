import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select, SelectItem } from '@ttoss/ui2';

const meta: Meta<typeof Select> = {
  title: 'ui2/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: 'Framework',
    placeholder: 'Choose a framework',
  },
  argTypes: {
    isInvalid: {
      description:
        'Marks the select as invalid. Surfaces the `invalid` token State on the trigger and label via React Aria render-props.',
      control: 'boolean',
    },
    isDisabled: {
      description: 'Disables the trigger. Applies `disabled` state tokens.',
      control: 'boolean',
    },
    isRequired: {
      description: 'Marks the select as required for accessibility.',
      control: 'boolean',
    },
    label: {
      description: 'Label displayed above the trigger button.',
      control: 'text',
    },
    placeholder: {
      description: 'Placeholder text shown when no option is selected.',
      control: 'text',
    },
  },
  render: ({ label, placeholder, ...args }) => {
    return (
      <Select label={label} placeholder={placeholder} {...args}>
        <SelectItem id="react">React</SelectItem>
        <SelectItem id="vue">Vue</SelectItem>
        <SelectItem id="angular">Angular</SelectItem>
        <SelectItem id="svelte">Svelte</SelectItem>
      </Select>
    );
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

/** Default — neutral base chrome, no validation state. */
export const Default: Story = {
  args: {},
};

/**
 * Invalid — runtime validation failure. Use when the select is required
 * and unsatisfied, or fails a `validate()` callback.
 */
export const Invalid: Story = {
  args: { isInvalid: true },
};

export const WithDefaultValue: Story = {
  args: { defaultSelectedKey: 'react' },
};

export const NoLabel: Story = {
  args: { label: undefined },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/** Side-by-side comparison of primary states. */
export const AllStates: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    const frameworks = (
      <>
        <SelectItem id="react">React</SelectItem>
        <SelectItem id="vue">Vue</SelectItem>
        <SelectItem id="angular">Angular</SelectItem>
        <SelectItem id="svelte">Svelte</SelectItem>
      </>
    );

    return (
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'flex-start',
        }}
      >
        <Select label="Default" placeholder="Choose…">
          {frameworks}
        </Select>
        <Select label="Selected" defaultSelectedKey="react">
          {frameworks}
        </Select>
        <Select label="Invalid" isInvalid placeholder="Choose…">
          {frameworks}
        </Select>
        <Select label="Disabled" isDisabled placeholder="Choose…">
          {frameworks}
        </Select>
      </div>
    );
  },
};
