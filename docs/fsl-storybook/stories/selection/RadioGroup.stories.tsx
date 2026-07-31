import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form, FormSubmit, Radio, RadioGroup } from '@ttoss/fsl-ui';

const meta: Meta<typeof RadioGroup> = {
  title: 'Selection/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  subcomponents: { Radio },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

const PERIODS = (
  <>
    <Radio value="monthly">Monthly</Radio>
    <Radio value="yearly">Yearly</Radio>
  </>
);

export const Default: Story = {
  render: () => {
    return (
      <RadioGroup label="Billing period" defaultValue="monthly">
        {PERIODS}
      </RadioGroup>
    );
  },
};

export const WithDescription: Story = {
  render: () => {
    return (
      <RadioGroup
        label="Billing period"
        defaultValue="monthly"
        description="Yearly billing saves two months."
      >
        {PERIODS}
      </RadioGroup>
    );
  },
};

/** Required, and marked — the same envelope every other field publishes. */
export const Required: Story = {
  render: () => {
    return (
      <RadioGroup label="Billing period" isRequired>
        {PERIODS}
      </RadioGroup>
    );
  },
};

/** Caller-supplied copy in the group's `validationMessage` part. */
export const Invalid: Story = {
  render: () => {
    return (
      <RadioGroup
        label="Billing period"
        isInvalid
        errorMessage="Choose how you want to be billed."
      >
        {PERIODS}
      </RadioGroup>
    );
  },
};

/** With no `errorMessage`, the platform supplies the copy on a failed submit. */
export const PlatformValidationCopy: Story = {
  render: () => {
    return (
      <Form>
        <RadioGroup label="Billing period" name="period" isRequired>
          {PERIODS}
        </RadioGroup>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );
  },
};
