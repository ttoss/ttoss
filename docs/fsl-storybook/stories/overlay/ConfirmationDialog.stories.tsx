import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ConfirmationDialog } from '@ttoss/fsl-ui';

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'Overlay/ConfirmationDialog',
  component: ConfirmationDialog,
};

export default meta;

type Story = StoryObj<typeof ConfirmationDialog>;

export const Default: Story = {
  render: () => {
    return (
      <ConfirmationDialog
        trigger={<Button evaluation="secondary">Archive project</Button>}
        title="Archive this project?"
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={() => {}}
      />
    );
  },
};

export const Destructive: Story = {
  render: () => {
    return (
      <ConfirmationDialog
        trigger={<Button evaluation="negative">Remove member</Button>}
        title="Remove Ada Lovelace?"
        confirmLabel="Remove"
        cancelLabel="Keep"
        evaluation="negative"
        onConfirm={() => {}}
      />
    );
  },
};
