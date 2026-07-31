import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeading,
  DialogModal,
  DialogTrigger,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof Dialog> = {
  title: 'Overlay/Dialog',
  component: Dialog,
  subcomponents: { DialogHeading, DialogBody, DialogActions, DialogModal },
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => {
    return (
      <DialogTrigger>
        <Button>Invite member</Button>
        <DialogModal>
          <Dialog aria-label="Invite member">
            <DialogHeading>Invite member</DialogHeading>
            <DialogBody>
              Send an invitation to join this workspace. The member can accept
              from their inbox.
            </DialogBody>
            <DialogActions>
              <Button composition="secondaryAction" evaluation="secondary">
                Cancel
              </Button>
              <Button composition="primaryAction">Send invite</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  },
};

export const Inline: Story = {
  render: () => {
    return (
      <Dialog aria-label="Inline example">
        <DialogHeading>Anatomy</DialogHeading>
        <DialogBody>
          A Dialog outside a modal — heading, body, and actions.
        </DialogBody>
        <DialogActions>
          <Button composition="primaryAction">OK</Button>
        </DialogActions>
      </Dialog>
    );
  },
};
