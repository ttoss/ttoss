import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from '@ttoss/ui2';

/**
 * Accessible field structure built on Ark UI.
 *
 * **Host**: FieldFrame — fields and their supporting elements.
 *
 * **Roles**: label, control, description, validationMessage
 *
 * **Tokens**: content.primary (label), input.primary (control),
 * content.muted (description), feedback.negative (error)
 */
const meta: Meta = {
  title: 'Composites/Field',
  tags: ['autodocs'],
  parameters: {
    ttoss: {
      responsibility: 'Structure',
      host: 'FieldFrame',
      foundations: {
        color: [
          'content.primary.text.default',
          'input.primary.background.default',
          'content.muted.text.default',
          'feedback.negative.text.default',
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Basic text input with label and helper text. */
export const TextInput: Story = {
  render: () => {
    return (
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Field.Input type="email" placeholder="you@example.com" />
        <Field.HelperText>We will never share your email.</Field.HelperText>
      </Field.Root>
    );
  },
};

/** Required field. */
export const Required: Story = {
  render: () => {
    return (
      <Field.Root required>
        <Field.Label>Full name</Field.Label>
        <Field.Input placeholder="John Doe" />
      </Field.Root>
    );
  },
};

/** Invalid field with error message. */
export const Invalid: Story = {
  render: () => {
    return (
      <Field.Root invalid>
        <Field.Label>Password</Field.Label>
        <Field.Input type="password" />
        <Field.ErrorText>
          Password must be at least 8 characters.
        </Field.ErrorText>
      </Field.Root>
    );
  },
};

/** Disabled field. */
export const Disabled: Story = {
  render: () => {
    return (
      <Field.Root disabled>
        <Field.Label>Username</Field.Label>
        <Field.Input value="readonly-user" />
        <Field.HelperText>This field cannot be changed.</Field.HelperText>
      </Field.Root>
    );
  },
};

/** Textarea field. */
export const TextareaField: Story = {
  render: () => {
    return (
      <Field.Root>
        <Field.Label>Bio</Field.Label>
        <Field.Textarea placeholder="Tell us about yourself..." rows={4} />
        <Field.HelperText>Max 500 characters.</Field.HelperText>
      </Field.Root>
    );
  },
};

/** Multiple fields in a form layout. */
export const FormLayout: Story = {
  render: () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 400,
        }}
      >
        <Field.Root required>
          <Field.Label>First name</Field.Label>
          <Field.Input placeholder="Jane" />
        </Field.Root>
        <Field.Root required>
          <Field.Label>Last name</Field.Label>
          <Field.Input placeholder="Doe" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Field.Input type="email" placeholder="jane@example.com" />
          <Field.HelperText>Optional — for notifications.</Field.HelperText>
        </Field.Root>
        <Field.Root invalid>
          <Field.Label>Phone</Field.Label>
          <Field.Input type="tel" />
          <Field.ErrorText>Invalid phone number.</Field.ErrorText>
        </Field.Root>
      </div>
    );
  },
};
