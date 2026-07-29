import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Form,
  FormActions,
  FormSubmit,
  Select,
  SelectItem,
  TextField,
  TextFieldControl,
  TextFieldLabel,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof Form> = {
  title: 'Structure/Form',
  component: Form,
  tags: ['autodocs'],
  subcomponents: { FormActions, FormSubmit },
};

export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => {
    return (
      <Form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <TextField name="email" type="email" isRequired>
          <TextFieldLabel>Email</TextFieldLabel>
          <TextFieldControl />
        </TextField>
        <Select label="Role" name="role" defaultSelectedKey="editor">
          <SelectItem id="admin">Admin</SelectItem>
          <SelectItem id="editor">Editor</SelectItem>
        </Select>
        <FormActions>
          <Button composition="secondaryAction" evaluation="secondary">
            Cancel
          </Button>
          <FormSubmit>Invite</FormSubmit>
        </FormActions>
      </Form>
    );
  },
};

/**
 * `labelPosition="side"` puts every label in one column shared by the whole form,
 * so the controls all start at the same x. That sharing is the point — it is why
 * this is a Form decision and not a field prop, and why it needs a wide,
 * multi-row form to be worth having. On the narrow forms above it would be worse.
 *
 * A `Checkbox` keeps its label in its own row (there was never a label above the
 * control to move) but still takes the control column, so it lines up with the
 * fields rather than sitting under the labels.
 */
export const SideLabels: Story = {
  render: () => {
    return (
      <Form
        labelPosition="side"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <TextField
          label="Workspace name"
          name="name"
          isRequired
          description="Shown in the workspace switcher."
        />
        <TextField
          label="Slug"
          name="slug"
          description="Used in deploy URLs."
        />
        <Select label="Region" name="region" defaultSelectedKey="eu">
          <SelectItem id="eu">Europe (Lisbon)</SelectItem>
          <SelectItem id="us">US East (Virginia)</SelectItem>
        </Select>
        <FormActions>
          <Button evaluation="secondary">Cancel</Button>
          <FormSubmit>Save changes</FormSubmit>
        </FormActions>
      </Form>
    );
  },
};

/** The label column is `max-content` by default; a host can pin it. */
export const SideLabelsFixedColumn: Story = {
  render: () => {
    return (
      <div style={{ ['--fsl-form-label-width' as string]: '12rem' }}>
        <Form labelPosition="side">
          <TextField label="Name" name="name" />
          <TextField label="Slug" name="slug" />
          <FormActions>
            <FormSubmit>Save</FormSubmit>
          </FormActions>
        </Form>
      </div>
    );
  },
};
