import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  TextArea,
  TextAreaControl,
  TextAreaDescription,
  TextAreaError,
  TextAreaLabel,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof TextArea> = {
  title: 'Input/TextArea',
  component: TextArea,
  subcomponents: {
    TextAreaLabel,
    TextAreaControl,
    TextAreaDescription,
    TextAreaError,
  },
};

export default meta;

type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  render: () => {
    return (
      <TextArea>
        <TextAreaLabel>Notes</TextAreaLabel>
        <TextAreaControl />
        <TextAreaDescription>Optional.</TextAreaDescription>
      </TextArea>
    );
  },
};

export const Invalid: Story = {
  render: () => {
    return (
      <TextArea isInvalid>
        <TextAreaLabel>Description</TextAreaLabel>
        <TextAreaControl />
        <TextAreaError>A description is required.</TextAreaError>
      </TextArea>
    );
  },
};
