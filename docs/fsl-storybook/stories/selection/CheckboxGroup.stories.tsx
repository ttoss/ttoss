import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, CheckboxGroup, Form, FormSubmit } from '@ttoss/fsl-ui';

const meta: Meta<typeof CheckboxGroup> = {
  title: 'Selection/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
  subcomponents: { Checkbox },
};

export default meta;

type Story = StoryObj<typeof CheckboxGroup>;

const CHANNELS = (
  <>
    <Checkbox value="email">Email</Checkbox>
    <Checkbox value="sms">SMS</Checkbox>
    <Checkbox value="push">Push</Checkbox>
  </>
);

export const Default: Story = {
  render: () => {
    return (
      <CheckboxGroup label="Notifications" description="Pick at least one">
        {CHANNELS}
      </CheckboxGroup>
    );
  },
};

/** Required, and marked — the same envelope every other field publishes. */
export const Required: Story = {
  render: () => {
    return (
      <CheckboxGroup label="Notifications" isRequired>
        {CHANNELS}
      </CheckboxGroup>
    );
  },
};

/**
 * Group-level `isInvalid` propagates to every child Checkbox, and the group
 * states the rule once rather than each option repeating it.
 */
export const Invalid: Story = {
  render: () => {
    return (
      <CheckboxGroup
        label="Notifications"
        isInvalid
        errorMessage="Choose at least one channel."
      >
        {CHANNELS}
      </CheckboxGroup>
    );
  },
};

/** With no `errorMessage`, the platform's own copy fills the message part. */
export const PlatformValidationCopy: Story = {
  render: () => {
    return (
      <Form>
        <CheckboxGroup label="Notifications" name="channels" isRequired>
          {CHANNELS}
        </CheckboxGroup>
        <FormSubmit>Save</FormSubmit>
      </Form>
    );
  },
};
