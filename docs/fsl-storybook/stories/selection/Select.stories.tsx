import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form, FormSubmit, Select, SelectItem } from '@ttoss/fsl-ui';

const meta: Meta<typeof Select> = {
  title: 'Selection/Select',
  component: Select,
  tags: ['autodocs'],
  subcomponents: { SelectItem },
};

export default meta;

type Story = StoryObj<typeof Select>;

const ROLES = (
  <>
    <SelectItem id="admin">Admin</SelectItem>
    <SelectItem id="editor">Editor</SelectItem>
    <SelectItem id="viewer">Viewer</SelectItem>
  </>
);

export const Default: Story = {
  render: () => {
    return (
      <Select label="Role" defaultSelectedKey="editor">
        {ROLES}
      </Select>
    );
  },
};

export const Open: Story = {
  render: () => {
    return (
      <Select label="Role" defaultOpen>
        {ROLES}
      </Select>
    );
  },
};

export const WithDescription: Story = {
  render: () => {
    return (
      <Select
        label="Role"
        defaultSelectedKey="editor"
        description="Admins manage billing and members; Viewers are read-only."
      >
        {ROLES}
      </Select>
    );
  },
};

/** Required, and marked — the asterisk is decoration; AT hears the attribute. */
export const Required: Story = {
  render: () => {
    return (
      <Select label="Role" isRequired placeholder="Choose a role">
        {ROLES}
      </Select>
    );
  },
};

/** Caller-supplied copy, in the part F-009 was about. */
export const Invalid: Story = {
  render: () => {
    return (
      <Select
        label="Role"
        isInvalid
        placeholder="Choose a role"
        errorMessage="That role is not available on your plan."
      >
        {ROLES}
      </Select>
    );
  },
};

/**
 * No `errorMessage` at all: submit with nothing chosen and the platform's own
 * localized constraint copy fills the message part.
 */
export const PlatformValidationCopy: Story = {
  render: () => {
    return (
      <Form>
        <Select
          label="Role"
          name="role"
          isRequired
          placeholder="Choose a role"
          description="Admins manage billing and members."
        >
          {ROLES}
        </Select>
        <FormSubmit>Invite</FormSubmit>
      </Form>
    );
  },
};

/**
 * The dropdown takes the field's width (F-019). This is the case that tests the
 * rule rather than demonstrating it: options longer than a narrow trigger. The
 * list cannot shrink below the row, and the knob is how a host lets it grow.
 */
export const OptionsLongerThanTheField: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'start' }}>
        <div style={{ width: '140px' }}>
          <Select label="Access" defaultOpen placeholder="Pick">
            <SelectItem id="a">Administrator with billing access</SelectItem>
            <SelectItem id="b">Read-only auditor</SelectItem>
          </Select>
        </div>
      </div>
    );
  },
};
