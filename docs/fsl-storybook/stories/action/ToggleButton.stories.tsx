import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, Stack, ToggleButton } from '@ttoss/fsl-ui';

const meta: Meta<typeof ToggleButton> = {
  title: 'Action/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = {
  args: { children: 'Bold' },
};

export const Selected: Story = {
  args: { children: 'Bold', defaultSelected: true },
};

export const Evaluations: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="md" align="center">
        <ToggleButton evaluation="primary" defaultSelected>
          Primary
        </ToggleButton>
        <ToggleButton evaluation="muted" defaultSelected>
          Muted
        </ToggleButton>
      </Stack>
    );
  },
};

/**
 * A toolbar toggle is usually icon-only: a square at the utility height, with
 * the engaged state rendering the persistent `pressed` colour.
 */
export const IconOnly: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm" align="center">
        <ToggleButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Sort ascending"
        />
        <ToggleButton
          icon={<Icon intent="selection.checked" />}
          aria-label="Show completed"
          defaultSelected
        />
        <ToggleButton
          icon={<Icon intent="action.search" />}
          aria-label="Find in page"
          evaluation="muted"
        />
      </Stack>
    );
  },
};
