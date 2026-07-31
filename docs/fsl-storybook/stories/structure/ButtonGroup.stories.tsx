import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ActionButton,
  Button,
  ButtonGroup,
  Icon,
  Stack,
  Surface,
  Text,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Structure/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => {
    return (
      <ButtonGroup>
        <Button evaluation="secondary">Cancel</Button>
        <Button evaluation="primary">Save changes</Button>
      </ButtonGroup>
    );
  },
};

/**
 * `align` acts on whichever axis has free space — the main axis in a row. A form
 * footer usually wants `end`; a page header's action cluster wants `start`.
 */
export const Alignment: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="lg">
        {(['start', 'center', 'end'] as const).map((align) => {
          return (
            <Surface key={align}>
              <Stack gap="sm">
                <Text>align=&quot;{align}&quot;</Text>
                <ButtonGroup align={align}>
                  <Button evaluation="secondary">Cancel</Button>
                  <Button evaluation="primary">Save changes</Button>
                </ButtonGroup>
              </Stack>
            </Surface>
          );
        })}
      </Stack>
    );
  },
};

/**
 * The row is adaptive: when the actions no longer fit their container the group
 * lays them out in a column instead, so a pair of commands stays readable and
 * tappable rather than clipping. The narrow frame below is 220px wide — the same
 * group, the same props.
 *
 * The rendered axis is published as `data-orientation`, and a horizontal request
 * that had to give way is marked `data-collapsed="true"`.
 */
export const CollapsesWhenItDoesNotFit: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="lg" align="start">
        <div style={{ inlineSize: '360px' }}>
          <Surface>
            <Stack gap="sm">
              <Text>360px — fits</Text>
              <ButtonGroup align="end">
                <Button evaluation="secondary">Cancel</Button>
                <Button evaluation="primary">Save changes</Button>
              </ButtonGroup>
            </Stack>
          </Surface>
        </div>

        <div style={{ inlineSize: '220px' }}>
          <Surface>
            <Stack gap="sm">
              <Text>220px — collapses</Text>
              <ButtonGroup align="end">
                <Button evaluation="secondary">Cancel</Button>
                <Button evaluation="primary">Save changes</Button>
              </ButtonGroup>
            </Stack>
          </Surface>
        </div>
      </Stack>
    );
  },
};

/**
 * `orientation="vertical"` pins the column and opts out of the measurement
 * entirely — use it when the stack is the intent, not a fallback.
 */
export const Vertical: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <ButtonGroup orientation="vertical" align="start">
        <Button evaluation="secondary">Duplicate</Button>
        <Button evaluation="secondary">Move to…</Button>
        <Button evaluation="negative" consequence="destructive">
          Delete permanently
        </Button>
      </ButtonGroup>
    );
  },
};

/**
 * The group is silhouette-agnostic: it arranges Action triggers, whichever
 * posture they wear. A utility cluster keeps the same rhythm as a command pair.
 */
export const UtilityActions: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <ButtonGroup>
        <ActionButton icon={<Icon intent="action.search" />}>Find</ActionButton>
        <ActionButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Sort ascending"
        />
        <ActionButton evaluation="muted">Reset</ActionButton>
      </ButtonGroup>
    );
  },
};
