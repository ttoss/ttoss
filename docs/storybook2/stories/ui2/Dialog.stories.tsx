import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeading,
  DialogModal,
  DialogTrigger,
} from '@ttoss/ui2';

const meta: Meta<typeof Dialog> = {
  title: 'ui2/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    evaluation: {
      description:
        'Surface color role — maps to `content.*` tokens. Controls the **surface** palette, NOT the actions inside. Default `primary` works for almost all dialogs.',
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'muted', 'negative'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

/**
 * Standard confirmation dialog.
 *
 * The surface is always neutral (`primary`). The action buttons carry their own
 * independent evaluations: `muted` for Cancel, `primary` for Confirm.
 * The surface evaluation does NOT follow the button evaluation.
 */
export const Confirmation: Story = {
  render: () => {
    return (
      <DialogTrigger>
        <Button>Save changes</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Save changes?</DialogHeading>
            <DialogBody>
              Your changes will be saved and published immediately.
            </DialogBody>
            <DialogActions>
              <Button slot="close" evaluation="muted">
                Cancel
              </Button>
              <Button evaluation="primary">Save</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  },
};

/**
 * Destructive action dialog.
 *
 * The surface stays neutral — the danger signal belongs to the Button alone
 * (`evaluation="negative"`), not to the Dialog container.
 * This is the key pattern: surface evaluation ≠ action evaluation.
 */
export const Destructive: Story = {
  render: () => {
    return (
      <DialogTrigger>
        <Button evaluation="negative">Delete item</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Delete item?</DialogHeading>
            <DialogBody>
              This will permanently delete the item. You cannot undo this
              action.
            </DialogBody>
            <DialogActions>
              <Button slot="close" evaluation="muted">
                Cancel
              </Button>
              <Button evaluation="negative">Delete</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  },
};

/**
 * System error surface.
 *
 * This is the correct use case for `evaluation="negative"` on the Dialog
 * itself — the **surface** is communicating a system-initiated danger context
 * (e.g. a critical error report), not an action the user is about to take.
 */
export const ErrorSurface: Story = {
  render: () => {
    return (
      <DialogTrigger>
        <Button evaluation="negative">View error report</Button>
        <DialogModal evaluation="negative">
          <Dialog evaluation="negative">
            <DialogHeading>Critical error</DialogHeading>
            <DialogBody>
              The deployment failed due to a configuration error. Review the
              logs below and contact your infrastructure team.
            </DialogBody>
            <DialogActions>
              <Button slot="close" evaluation="muted">
                Dismiss
              </Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  },
};

/** Dialog with only a heading and close button — minimal usage. */
export const Minimal: Story = {
  render: () => {
    return (
      <DialogTrigger>
        <Button>Open minimal</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Minimal dialog</DialogHeading>
            <DialogActions>
              <Button slot="close" evaluation="muted">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  },
};

/** Long body content — verifies scroll behavior inside the surface. */
export const LongContent: Story = {
  render: () => {
    return (
      <DialogTrigger>
        <Button>Open long content</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Terms and conditions</DialogHeading>
            <DialogBody>
              {Array.from({ length: 20 }, (_, i) => {
                return (
                  <p key={i}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Pellentesque habitant morbi tristique senectus et netus et
                    malesuada fames ac turpis egestas.
                  </p>
                );
              })}
            </DialogBody>
            <DialogActions>
              <Button slot="close" evaluation="muted">
                Decline
              </Button>
              <Button evaluation="primary">Accept</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  },
};

/**
 * Surface evaluations — token coverage reference.
 *
 * These demonstrate the `content.*` surface color families.
 * In real usage, surfaces are almost always `primary`.
 * Use `negative` only when the surface itself communicates system danger,
 * not when the action inside is destructive.
 */
export const SurfaceEvaluations: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    const evaluations = [
      'primary',
      'secondary',
      'accent',
      'muted',
      'negative',
    ] as const;

    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {evaluations.map((evaluation) => {
          return (
            <DialogTrigger key={evaluation}>
              <Button evaluation="muted">{evaluation} surface</Button>
              <DialogModal evaluation={evaluation}>
                <Dialog evaluation={evaluation}>
                  <DialogHeading>{evaluation} surface</DialogHeading>
                  <DialogBody>
                    Surface using <code>content.{evaluation}</code> tokens.
                    Note: the buttons below have their own independent
                    evaluations.
                  </DialogBody>
                  <DialogActions>
                    <Button slot="close" evaluation="muted">
                      Cancel
                    </Button>
                    <Button evaluation="primary">Confirm</Button>
                  </DialogActions>
                </Dialog>
              </DialogModal>
            </DialogTrigger>
          );
        })}
      </div>
    );
  },
};
