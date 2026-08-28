import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ActionButton,
  ActionMenu,
  Icon,
  MenuItem,
  Stack,
  Surface,
  Text,
  Toolbar,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof ActionMenu> = {
  title: 'Overlay/ActionMenu',
  component: ActionMenu,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ActionMenu>;

const items = (
  <>
    <MenuItem id="duplicate">Duplicate</MenuItem>
    <MenuItem id="archive">Archive</MenuItem>
    {/* `consequence` is what a confirm wrapper dispatches on, and on the quiet
        rung it also tints the row's ink (CONTRACT §3.3). `evaluation="negative"`
        is the other shape — it fills the whole row red, which is the filled
        destructive command rather than a peer among three (F-029). */}
    <MenuItem id="delete" consequence="destructive">
      Delete
    </MenuItem>
  </>
);

/**
 * The overflow affordance: actions that exist but do not deserve permanent
 * space. The trigger is an icon-only `ActionButton` wearing the utility
 * silhouette, and its accessible name is required — there is no i18n runtime to
 * default it (ADR-001).
 */
export const Default: Story = {
  render: () => {
    return <ActionMenu aria-label="More actions">{items}</ActionMenu>;
  },
};

export const Open: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <ActionMenu aria-label="More actions" defaultOpen>
        {items}
      </ActionMenu>
    );
  },
};

/**
 * A toolbar's answer to running out of room: the tail of the bar moves in here.
 * That is the difference from `ButtonGroup`, which collapses its row to a column
 * — a command row and a tool strip fail differently.
 */
export const ToolbarOverflow: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Toolbar aria-label="Record controls">
        <ActionButton
          icon={<Icon intent="action.search" />}
          aria-label="Find"
        />
        <ActionButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Sort"
        />
        <ActionMenu aria-label="More actions" placement="bottom end">
          {items}
        </ActionMenu>
      </Toolbar>
    );
  },
};

/**
 * Emphasis is the trigger's, like any other utility action. `muted` is the quiet
 * posture — note the caveat it exposes on a raised surface: the quiet rung's
 * resting fill is the *page* colour, so instead of borrowing the card underneath
 * it shows as a patch of page (F-024). On the page itself it is invisible until
 * hovered, which is the intent.
 */
export const Emphasis: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="lg">
        <Stack direction="horizontal" gap="md" align="center">
          <Text>On the page</Text>
          <ActionMenu aria-label="More actions">{items}</ActionMenu>
          <ActionMenu aria-label="More actions, quiet" evaluation="muted">
            {items}
          </ActionMenu>
        </Stack>

        <Surface level="raised">
          <Stack direction="horizontal" gap="md" align="center">
            <Text>On a raised surface</Text>
            <ActionMenu aria-label="More actions">{items}</ActionMenu>
            <ActionMenu aria-label="More actions, quiet" evaluation="muted">
              {items}
            </ActionMenu>
          </Stack>
        </Surface>
      </Stack>
    );
  },
};
