import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ActionButton,
  Button,
  Icon,
  Select,
  SelectItem,
  Stack,
  TextField,
  TextFieldControl,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof ActionButton> = {
  title: 'Action/ActionButton',
  component: ActionButton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ActionButton>;

export const Default: Story = {
  args: { children: 'Edit' },
};

/**
 * The utility silhouette exists to recede next to a command. Side by side, the
 * difference is the radius, the type weight and the inset — the same
 * distinction between "commit to this" and "operate on that".
 */
export const AgainstACommand: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Button evaluation="primary">Save changes</Button>
        <ActionButton>Edit</ActionButton>
      </Stack>
    );
  },
};

export const Evaluations: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <ActionButton evaluation="secondary">Secondary</ActionButton>
        <ActionButton evaluation="muted">Muted (quiet)</ActionButton>
        <ActionButton evaluation="primary">Primary</ActionButton>
        <ActionButton evaluation="accent">Accent</ActionButton>
        <ActionButton evaluation="negative" consequence="destructive">
          Delete
        </ActionButton>
      </Stack>
    );
  },
};

/**
 * Icon-only is the dominant toolbar shape: a square at the utility height,
 * with `aria-label` required by the type system.
 */
export const IconOnly: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <ActionButton
          icon={<Icon intent="action.search" />}
          aria-label="Search"
        />
        <ActionButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Sort ascending"
        />
        <ActionButton
          icon={<Icon intent="action.close" />}
          aria-label="Remove"
          evaluation="muted"
        />
        <ActionButton
          icon={<Icon intent="action.close" />}
          aria-label="Delete"
          evaluation="negative"
          consequence="destructive"
        />
      </Stack>
    );
  },
};

export const WithIcon: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <ActionButton icon={<Icon intent="action.search" />}>Find</ActionButton>
        <ActionButton
          icon={<Icon intent="disclosure.expand" />}
          iconPlacement="trailing"
        >
          More
        </ActionButton>
      </Stack>
    );
  },
};

export const Disabled: Story = {
  args: { children: 'Unavailable', isDisabled: true },
};

/**
 * Why the utility silhouette is the size it is: those dimensions are the
 * **field row's**, not a tuning of its own. `ActionButton` declares the same
 * `sizing.hit` + `inset.control` + `label.md` as `TextField` and `Select`, so
 * it lands at the same height (34px on the desktop in the base theme) as the
 * fields it stands beside in a toolbar or filter bar.
 *
 * That is also why its type is not a step *smaller* than a command's — only its
 * weight is. A command (`Button`, second row) is the deliberate exception: it
 * leaves the row for the CTA height and semibold weight, while keeping the same
 * font size, so nothing on the row visibly steps.
 */
export const OnTheFieldRow: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="lg">
        <Stack direction="horizontal" gap="sm" align="center">
          <TextField aria-label="Filter" defaultValue="Filter">
            <TextFieldControl />
          </TextField>
          <Select defaultSelectedKey="editor">
            <SelectItem id="admin">Admin</SelectItem>
            <SelectItem id="editor">Editor</SelectItem>
          </Select>
          <ActionButton icon={<Icon intent="action.search" />}>
            Search
          </ActionButton>
          <ActionButton
            icon={<Icon intent="action.sortAscending" />}
            aria-label="Sort ascending"
          />
        </Stack>

        <Stack direction="horizontal" gap="sm" align="center">
          <ActionButton>Utility</ActionButton>
          <Button>Command</Button>
        </Stack>
      </Stack>
    );
  },
};
