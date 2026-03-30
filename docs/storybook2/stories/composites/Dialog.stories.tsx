import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Dialog } from '@ttoss/ui2';

/**
 * Accessible modal dialog built on Ark UI.
 *
 * **Responsibility**: Overlay — temporary layered UI above the interface.
 *
 * **Host**: SurfaceFrame — structured surface with heading, body, and actions.
 *
 * **Composition**: Footer acts as ActionSet host. Button variants map to roles:
 * - `solid` → ActionSet.primary
 * - `outline` → ActionSet.secondary
 * - `ghost` → ActionSet.dismiss
 */
const meta: Meta = {
  title: 'Composites/Dialog',
  tags: ['autodocs'],
  parameters: {
    ttoss: {
      responsibility: 'Overlay',
      host: 'SurfaceFrame',
      foundations: {
        color: ['content.primary.background.default'],
        elevation: ['elevation.modal'],
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Basic modal with title, description, body, and footer. */
export const Default: Story = {
  render: () => {
    return (
      <Dialog.Root>
        <Dialog.Trigger>
          <Button>Open Dialog</Button>
        </Dialog.Trigger>
        <Dialog.Content
          title="Confirm action"
          description="Are you sure you want to proceed?"
        >
          <Dialog.Body>
            <p>Your changes will be saved permanently.</p>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="ghost">Cancel</Button>
            <Button variant="solid">Confirm</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
};

/** Dialog with longer body content. */
export const WithLongContent: Story = {
  render: () => {
    return (
      <Dialog.Root>
        <Dialog.Trigger>
          <Button variant="outline">Terms &amp; Conditions</Button>
        </Dialog.Trigger>
        <Dialog.Content title="Terms of Service">
          <Dialog.Body>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident.
            </p>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline">Decline</Button>
            <Button variant="solid">Accept</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
};

/** ActionSet pattern — three distinct roles. */
export const ActionSetPattern: Story = {
  render: () => {
    return (
      <Dialog.Root>
        <Dialog.Trigger>
          <Button>Save Changes</Button>
        </Dialog.Trigger>
        <Dialog.Content
          title="Unsaved changes"
          description="You have unsaved changes. What would you like to do?"
        >
          <Dialog.Body>
            <p>Choose an action below.</p>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="ghost">Discard</Button>
            <Button variant="outline">Go back</Button>
            <Button variant="solid">Save</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    );
  },
};
