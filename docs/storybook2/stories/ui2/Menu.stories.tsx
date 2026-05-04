import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Menu, MenuItem, MenuTrigger } from '@ttoss/ui2';

const meta: Meta<typeof Menu> = {
  title: 'ui2/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    evaluation: {
      description:
        'Surface color role for the overlay — maps to `informational.*` tokens. Controls the **surface** palette; items carry their own evaluations.',
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'muted'],
    },
    placement: {
      description: 'Popover placement relative to the trigger.',
      control: 'select',
      options: [
        'top',
        'top start',
        'top end',
        'bottom',
        'bottom start',
        'bottom end',
        'left',
        'right',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

/**
 * Standard action menu.
 *
 * The surface is neutral (`primary`). Each `MenuItem` has its own evaluation
 * and consequence. A destructive item (`consequence="destructive"`) emits
 * `data-consequence="destructive"` on the DOM so host integrations
 * (confirmation wrappers, telemetry) can observe the contract without
 * inspecting the label.
 */
export const Standard: Story = {
  render: () => {
    return (
      <MenuTrigger>
        <Button>Open menu</Button>
        <Menu>
          <MenuItem
            onAction={() => {
              return alert('Edit');
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            onAction={() => {
              return alert('Duplicate');
            }}
          >
            Duplicate
          </MenuItem>
          <MenuItem
            onAction={() => {
              return alert('Archive');
            }}
          >
            Archive
          </MenuItem>
          <MenuItem
            consequence="destructive"
            onAction={() => {
              return alert('Delete');
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};

/**
 * Consequence dimension — first real callsite in `@ttoss/ui2`.
 *
 * Two visually similar items that differ only in their **contract**, not their
 * paint. `Delete` declares `consequence="destructive"`; `Report issue` does
 * not. Both use the default `evaluation="primary"` palette.
 *
 * Consequence governs behavior contracts (confirmation flows, Enter-to-submit
 * suppression, telemetry), not color. Visual distinction — if desired — is a
 * host CSS concern via `[data-consequence="destructive"]` selectors.
 */
export const DestructiveItem: Story = {
  render: () => {
    return (
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu>
          <MenuItem
            onAction={() => {
              return alert('Report issue');
            }}
          >
            Report issue
          </MenuItem>
          <MenuItem
            consequence="destructive"
            onAction={() => {
              return alert('Delete account');
            }}
          >
            Delete account
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};

/**
 * Composition roles — slot tagging for layout drivers.
 *
 * `primaryAction` / `secondaryAction` / `dismissAction` are emitted as
 * `data-composition` attributes. The Menu itself does not react to them (a
 * flat action list has no slots), but host CSS or tests can target them.
 * The value of `composition` grows with non-flat composites — recorded here
 * for contract completeness.
 */
export const CompositionSlots: Story = {
  render: () => {
    return (
      <MenuTrigger>
        <Button>File</Button>
        <Menu>
          <MenuItem
            composition="primaryAction"
            onAction={() => {
              return alert('Save');
            }}
          >
            Save
          </MenuItem>
          <MenuItem
            composition="secondaryAction"
            onAction={() => {
              return alert('Save As…');
            }}
          >
            Save as…
          </MenuItem>
          <MenuItem
            composition="dismissAction"
            onAction={() => {
              return alert('Close');
            }}
          >
            Close
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};

/** Disabled item — applies `disabled` state tokens via the state cascade. */
export const DisabledItem: Story = {
  render: () => {
    return (
      <MenuTrigger>
        <Button>Open menu</Button>
        <Menu>
          <MenuItem
            onAction={() => {
              return alert('Edit');
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            isDisabled
            onAction={() => {
              return alert('Archive');
            }}
          >
            Archive (unavailable)
          </MenuItem>
          <MenuItem
            consequence="destructive"
            onAction={() => {
              return alert('Delete');
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};

/** Different surface emphasis on the overlay itself. */
export const MutedSurface: Story = {
  render: () => {
    return (
      <MenuTrigger>
        <Button evaluation="muted">More options</Button>
        <Menu evaluation="muted">
          <MenuItem
            onAction={() => {
              return alert('Option A');
            }}
          >
            Option A
          </MenuItem>
          <MenuItem
            onAction={() => {
              return alert('Option B');
            }}
          >
            Option B
          </MenuItem>
          <MenuItem
            onAction={() => {
              return alert('Option C');
            }}
          >
            Option C
          </MenuItem>
        </Menu>
      </MenuTrigger>
    );
  },
};
