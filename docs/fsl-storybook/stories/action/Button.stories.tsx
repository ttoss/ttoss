import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Icon, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof Button> = {
  title: 'Action/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Save changes' },
};

export const Evaluations: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Button evaluation="primary">Primary</Button>
        <Button evaluation="secondary">Secondary</Button>
        <Button evaluation="accent">Accent</Button>
        <Button evaluation="muted">Muted</Button>
        <Button evaluation="negative">Negative</Button>
      </Stack>
    );
  },
};

/**
 * A glyph may reinforce the command (`leading`, the default) or announce what
 * follows the press (`trailing` — a disclosure chevron, a next step).
 */
export const WithIcon: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Button icon={<Icon intent="action.search" />}>Search</Button>
        <Button icon={<Icon intent="status.success" />} evaluation="accent">
          Approve
        </Button>
        <Button
          icon={<Icon intent="disclosure.expand" />}
          iconPlacement="trailing"
        >
          More options
        </Button>
      </Stack>
    );
  },
};

/**
 * Omit `children` for the icon-only form: the control collapses to a square at
 * the `hit` floor and `aria-label` becomes required by the type system.
 */
export const IconOnly: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Button icon={<Icon intent="action.close" />} aria-label="Dismiss" />
        <Button
          icon={<Icon intent="action.search" />}
          aria-label="Search"
          evaluation="secondary"
        />
        <Button
          icon={<Icon intent="action.close" />}
          aria-label="Delete"
          evaluation="negative"
          consequence="destructive"
        />
      </Stack>
    );
  },
};

/**
 * The `hit` floor applies to both axes, so short labels stay balanced instead
 * of collapsing to their content width.
 */
export const ShortLabels: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <Button>OK</Button>
        <Button evaluation="secondary">No</Button>
        <Button evaluation="accent">Go</Button>
      </Stack>
    );
  },
};

export const Disabled: Story = {
  args: { children: 'Unavailable', isDisabled: true },
};
