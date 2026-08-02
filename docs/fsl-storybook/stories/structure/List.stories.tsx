import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem, Stack, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof List> = {
  title: 'Structure/List',
  component: List,
};

export default meta;

type Story = StoryObj<typeof List>;

export const Default: Story = {
  render: () => {
    return (
      <List>
        <ListItem>Unlimited projects</ListItem>
        <ListItem>Priority support</ListItem>
        <ListItem>Audit log retention</ListItem>
      </List>
    );
  },
};

/**
 * `plain` keeps `<ul>` semantics and hides the marker — the shape most product
 * lists want, and the one that otherwise gets hand-rolled with
 * `list-style: none` on a `div` that announces nothing.
 */
export const Variants: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="xl">
        {(['plain', 'unordered', 'ordered'] as const).map((variant) => {
          return (
            <Stack key={variant} gap="sm">
              <Text variant="label-sm" tone="muted">
                {variant}
              </Text>
              <List variant={variant}>
                <ListItem>Install the CLI</ListItem>
                <ListItem>Authenticate</ListItem>
                <ListItem>Deploy</ListItem>
              </List>
            </Stack>
          );
        })}
      </Stack>
    );
  },
};

export const Gap: Story = {
  render: () => {
    return (
      <Stack direction="horizontal" gap="xl">
        {(['xs', 'sm', 'md', 'lg'] as const).map((gap) => {
          return (
            <Stack key={gap} gap="sm">
              <Text variant="label-sm" tone="muted">
                {gap}
              </Text>
              <List gap={gap}>
                <ListItem>One</ListItem>
                <ListItem>Two</ListItem>
                <ListItem>Three</ListItem>
              </List>
            </Stack>
          );
        })}
      </Stack>
    );
  },
};
