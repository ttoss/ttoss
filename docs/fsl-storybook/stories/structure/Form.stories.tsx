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
