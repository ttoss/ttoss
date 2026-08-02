import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Drawer,
  type DrawerPlacement,
  Heading,
  Stack,
  Text,
} from '@ttoss/fsl-ui';
import * as React from 'react';

const meta: Meta<typeof Drawer> = {
  title: 'Overlay/Drawer',
  component: Drawer,
};

export default meta;

type Story = StoryObj<typeof Drawer>;

/** Opens a drawer from a button — the shape every story here reuses. */
const DrawerDemo = ({
  placement = 'start',
  width = 'sm',
  label,
}: {
  placement?: DrawerPlacement;
  width?: 'sm' | 'md' | 'lg';
  label: string;
}) => {
  const [isOpen, setOpen] = React.useState(false);

  return (
    <>
      <Button
        onPress={() => {
          return setOpen(true);
        }}
      >
        {label}
      </Button>
      <Drawer
        aria-label={label}
        isOpen={isOpen}
        onOpenChange={setOpen}
        placement={placement}
        width={width}
      >
        <Stack gap="md">
          <Heading level={2} size="md">
            {label}
          </Heading>
          <Text>
            A drawer is a region of the app brought temporarily into view.
            Escape and an outside press dismiss it, and focus is contained while
            it is open.
          </Text>
          <Button
            evaluation="secondary"
            onPress={() => {
              return setOpen(false);
            }}
          >
            Close
          </Button>
        </Stack>
      </Drawer>
    </>
  );
};

export const Default: Story = {
  render: () => {
    return <DrawerDemo label="Open panel" />;
  },
};

/**
 * `start` and `end` are logical, so a `start` drawer anchors on the right in an
 * RTL document. `top` and `bottom` span the inline axis and are sized by their
 * content.
 */
export const Placement: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm">
        {(['start', 'end', 'top', 'bottom'] as const).map((placement) => {
          return (
            <DrawerDemo
              key={placement}
              placement={placement}
              label={placement}
            />
          );
        })}
      </Stack>
    );
  },
};

/**
 * The measure comes from the scale `AppShell`'s side regions use, which is what
 * lets a sidebar become a drawer without changing width.
 */
export const Width: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="sm">
        {(['sm', 'md', 'lg'] as const).map((width) => {
          return <DrawerDemo key={width} width={width} label={width} />;
        })}
      </Stack>
    );
  },
};
