import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ActionButton,
  Icon,
  Select,
  SelectItem,
  Separator,
  Stack,
  Surface,
  Text,
  ToggleButton,
  Toolbar,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof Toolbar> = {
  title: 'Structure/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

/**
 * The utility group of the Action family: controls that operate on content,
 * gathered into a named region the arrow keys can walk. It paints nothing — the
 * controls carry all the emphasis.
 */
export const Default: Story = {
  render: () => {
    return (
      <Toolbar aria-label="Table controls">
        <ToggleButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Sort ascending"
        />
        <ActionButton icon={<Icon intent="action.search" />}>Find</ActionButton>
        <ActionButton
          icon={<Icon intent="action.close" />}
          aria-label="Clear filters"
          evaluation="muted"
        />
      </Toolbar>
    );
  },
};

/**
 * Mixed controls are welcome — what makes it a toolbar is the region and its
 * keyboard model, not the kind of control inside. A `Separator` marks the break
 * between clusters, and every control lands on the same field row.
 */
export const MixedControls: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Toolbar aria-label="Record controls">
        <Select defaultSelectedKey="all">
          <SelectItem id="all">All records</SelectItem>
          <SelectItem id="mine">Mine</SelectItem>
        </Select>
        <Separator orientation="vertical" />
        <ToggleButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Sort ascending"
        />
        <ActionButton
          icon={<Icon intent="action.search" />}
          aria-label="Find"
          evaluation="muted"
        />
      </Toolbar>
    );
  },
};

/**
 * F-028 investigation scaffold: a plain host `<button>` sits between fsl-ui
 * controls, with focusable siblings before and after the toolbar itself, so
 * Tab-in / Tab-out / arrow-key behaviour can be checked in a real browser for
 * a child that does not participate in any fsl-ui mechanism.
 */
export const KeyboardInvestigation: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="md">
        <button type="button">before</button>
        <Toolbar aria-label="Investigation">
          <ActionButton
            icon={<Icon intent="action.search" />}
            aria-label="Find"
          />
          <button type="button">plain host button</button>
          <Select defaultSelectedKey="all">
            <SelectItem id="all">All records</SelectItem>
            <SelectItem id="mine">Mine</SelectItem>
          </Select>
          <ToggleButton
            icon={<Icon intent="action.sortAscending" />}
            aria-label="Sort ascending"
          />
        </Toolbar>
        <button type="button">after</button>
      </Stack>
    );
  },
};

/**
 * `align` acts on whichever axis has free space, the same vocabulary
 * `ButtonGroup` uses — a bar pinned to the end of a header wants `end`.
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
                <Toolbar aria-label={`Actions ${align}`} align={align}>
                  <ActionButton
                    icon={<Icon intent="action.search" />}
                    aria-label="Find"
                  />
                  <ActionButton
                    icon={<Icon intent="action.sortAscending" />}
                    aria-label="Sort"
                  />
                </Toolbar>
              </Stack>
            </Surface>
          );
        })}
      </Stack>
    );
  },
};

/**
 * A vertical toolbar navigates with Up/Down instead of Left/Right — the prop
 * drives the keyboard model, not only the layout.
 */
export const Vertical: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Toolbar aria-label="Canvas tools" orientation="vertical">
        <ToggleButton
          icon={<Icon intent="action.search" />}
          aria-label="Zoom"
        />
        <ToggleButton
          icon={<Icon intent="action.sortAscending" />}
          aria-label="Reorder"
        />
        <ActionButton
          icon={<Icon intent="action.close" />}
          aria-label="Clear"
          evaluation="muted"
        />
      </Toolbar>
    );
  },
};

/**
 * Chrome is composed, not built in: whether a bar has a background depends on
 * the surface it sits on, so wrap it in a `Surface` when it needs one — a bar
 * floating above content, for instance. On the page itself it needs none. The
 * component used to paint its own bar and measured 80px around 34px controls
 * (ADR-014).
 */
export const WithChrome: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack direction="horizontal" gap="lg" align="center">
        <Toolbar aria-label="Bare">
          <ActionButton
            icon={<Icon intent="action.search" />}
            aria-label="Find"
          />
          <ActionButton
            icon={<Icon intent="action.sortAscending" />}
            aria-label="Sort"
          />
        </Toolbar>

        <Surface level="overlay" padding="sm">
          <Toolbar aria-label="Floating">
            <ActionButton
              icon={<Icon intent="action.search" />}
              aria-label="Find"
            />
            <ActionButton
              icon={<Icon intent="action.sortAscending" />}
              aria-label="Sort"
            />
          </Toolbar>
        </Surface>
      </Stack>
    );
  },
};
