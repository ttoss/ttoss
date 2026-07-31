import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form, FormSubmit, NumberField } from '@ttoss/fsl-ui';

const meta: Meta<typeof NumberField> = {
  title: 'Input/NumberField',
  component: NumberField,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NumberField>;

export const Default: Story = {
  args: { label: 'Quantity', defaultValue: 1 },
};

export const Bounded: Story = {
  args: { label: 'Seats', defaultValue: 5, minValue: 1, maxValue: 10 },
};

export const WithDescription: Story = {
  args: {
    label: 'Seats',
    defaultValue: 5,
    minValue: 1,
    maxValue: 10,
    description: 'Between 1 and 10; billed per seat.',
  },
};

/** Required, and marked — the envelope's marker, hidden from assistive tech. */
export const Required: Story = {
  args: { label: 'Quantity', isRequired: true },
};

export const Invalid: Story = {
  args: {
    label: 'Seats',
    defaultValue: 20,
    maxValue: 10,
    isInvalid: true,
    errorMessage: 'Your plan allows at most 10 seats.',
  },
};

/** With no `errorMessage`, the platform's own copy fills the message part. */
export const PlatformValidationCopy: Story = {
  render: () => {
    return (
      <Form>
        <NumberField label="Quantity" name="quantity" isRequired />
        <FormSubmit>Order</FormSubmit>
      </Form>
    );
  },
};
