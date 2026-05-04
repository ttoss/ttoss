import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  TextField,
  TextFieldControl,
  TextFieldDescription,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/ui2';

/**
 * `TextField` is the canonical Input composite — one entity rendered as
 * four slots (`label`, `control`, `description`, `status`). Each sub-part
 * carries its own `ComponentMeta` with a `composition` role, and asserts
 * host presence via the shared `createPresenceScope` guard: rendered
 * outside `<TextField>` they throw a clear error.
 *
 * Validation feedback rides React Aria's `isInvalid` / `validate` channel
 * and surfaces on control + label + status via the `invalid` token state.
 * No new state machinery lives on the composite — see CONTRIBUTING §4.
 */
const meta: Meta<typeof TextField> = {
  title: 'ui2/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    isRequired: {
      description: 'Mark the field as required.',
      control: 'boolean',
    },
    isDisabled: {
      description: 'Disable the field. Surfaces the `disabled` token state.',
      control: 'boolean',
    },
    isReadOnly: {
      description: 'Render read-only.',
      control: 'boolean',
    },
  },
  args: {
    isRequired: false,
    isDisabled: false,
    isReadOnly: false,
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

/**
 * Standard composition — label, control, description, status.
 */
export const Standard: Story = {
  render: (args) => {
    return (
      <div style={{ minWidth: '20rem' }}>
        <TextField {...args} name="email" type="email">
          <TextFieldLabel>Email</TextFieldLabel>
          <TextFieldControl placeholder="you@example.com" />
          <TextFieldDescription>
            We never share your email.
          </TextFieldDescription>
          <TextFieldError />
        </TextField>
      </div>
    );
  },
};

/**
 * Invalid state via the `validate` callback — the `invalid` token state
 * propagates through the canonical state cascade in
 * `resolveInteractiveStyle`. The label and control pick up the invalid
 * voice; `<TextFieldError>` renders the message returned by `validate`.
 */
export const Invalid: Story = {
  render: () => {
    return (
      <div style={{ minWidth: '20rem' }}>
        <TextField
          name="username"
          defaultValue="ab"
          validate={(value) => {
            return value.length < 3
              ? 'Username must be at least 3 characters.'
              : null;
          }}
        >
          <TextFieldLabel>Username</TextFieldLabel>
          <TextFieldControl />
          <TextFieldError />
        </TextField>
      </div>
    );
  },
};

/**
 * Disabled — chrome dims via the `disabled` token state; the field is
 * removed from the tab order by React Aria.
 */
export const Disabled: Story = {
  render: () => {
    return (
      <div style={{ minWidth: '20rem' }}>
        <TextField name="locked" isDisabled defaultValue="locked@example.com">
          <TextFieldLabel>Email</TextFieldLabel>
          <TextFieldControl />
        </TextField>
      </div>
    );
  },
};

/**
 * Read-only — keyboard-focusable but not editable.
 */
export const ReadOnly: Story = {
  render: () => {
    return (
      <div style={{ minWidth: '20rem' }}>
        <TextField name="ref" isReadOnly defaultValue="REF-2026-04-30">
          <TextFieldLabel>Reference code</TextFieldLabel>
          <TextFieldControl />
          <TextFieldDescription>Copy this on submission.</TextFieldDescription>
        </TextField>
      </div>
    );
  },
};
