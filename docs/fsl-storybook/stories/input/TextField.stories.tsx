import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  TextField,
  TextFieldControl,
  TextFieldDescription,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof TextField> = {
  title: 'Input/TextField',
  component: TextField,
  subcomponents: {
    TextFieldLabel,
    TextFieldControl,
    TextFieldDescription,
    TextFieldError,
  },
};

export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  render: () => {
    return (
      <TextField>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl />
      </TextField>
    );
  },
};

export const WithDescription: Story = {
  render: () => {
    return (
      <TextField>
        <TextFieldLabel>Display name</TextFieldLabel>
        <TextFieldControl />
        <TextFieldDescription>
          Shown on your public profile.
        </TextFieldDescription>
      </TextField>
    );
  },
};

export const Invalid: Story = {
  render: () => {
    return (
      <TextField isInvalid>
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl />
        <TextFieldError>Enter a valid email address.</TextFieldError>
      </TextField>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <TextField isDisabled>
        <TextFieldLabel>Workspace</TextFieldLabel>
        <TextFieldControl />
      </TextField>
    );
  },
};
