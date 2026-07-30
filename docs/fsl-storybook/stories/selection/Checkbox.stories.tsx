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

/**
 * A confirmation checkbox that can state its own rule. `description` says what
 * checking it commits the user to; `errorMessage` appears only once the field is
 * invalid. The accessible name stays the label alone — the supporting copy is
 * linked as a description, not absorbed into the name.
 */
export const WithSupportingCopy: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Checkbox
        isRequired
        description="Members can deploy to production immediately after accepting."
        errorMessage="Confirm you understand the access this grants."
      >
        I understand this grants deploy access
      </Checkbox>
    );
  },
};

/**
 * The same checkbox while invalid. In a real flow the `Form` puts it here on a
 * failed submit; the story sets `isInvalid` so the state is inspectable on its
 * own.
 */
export const SupportingCopyInvalid: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Checkbox
        isRequired
        isInvalid
        description="Members can deploy to production immediately after accepting."
        errorMessage="Confirm you understand the access this grants."
      >
        I understand this grants deploy access
      </Checkbox>
    );
  },
};
