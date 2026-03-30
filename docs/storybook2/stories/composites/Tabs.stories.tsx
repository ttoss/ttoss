import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@ttoss/ui2';

/**
 * Accessible tabs built on Ark UI.
 *
 * **Responsibility**: Navigation — movement across views.
 *
 * **Tokens**: navigation.primary
 */
const meta: Meta = {
  title: 'Composites/Tabs',
  tags: ['autodocs'],
  parameters: {
    ttoss: {
      responsibility: 'Navigation',
      foundations: {
        color: ['navigation.primary.text.default'],
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Basic tab navigation. */
export const Default: Story = {
  render: () => {
    return (
      <Tabs.Root defaultValue="account">
        <Tabs.List>
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
          <Tabs.Trigger value="security">Security</Tabs.Trigger>
          <Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="account">
          <p>Manage your account settings and preferences.</p>
        </Tabs.Content>
        <Tabs.Content value="security">
          <p>Update your password and security settings.</p>
        </Tabs.Content>
        <Tabs.Content value="notifications">
          <p>Configure notification preferences.</p>
        </Tabs.Content>
      </Tabs.Root>
    );
  },
};

/** Two tabs only. */
export const TwoTabs: Story = {
  render: () => {
    return (
      <Tabs.Root defaultValue="overview">
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="details">Details</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="overview">
          <p>High-level summary of the item.</p>
        </Tabs.Content>
        <Tabs.Content value="details">
          <p>Detailed information and metadata.</p>
        </Tabs.Content>
      </Tabs.Root>
    );
  },
};

/** Many tabs. */
export const ManyTabs: Story = {
  render: () => {
    return (
      <Tabs.Root defaultValue="tab1">
        <Tabs.List>
          {Array.from({ length: 6 }, (_, i) => {
            return (
              <Tabs.Trigger key={i} value={`tab${i + 1}`}>
                Tab {i + 1}
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
        {Array.from({ length: 6 }, (_, i) => {
          return (
            <Tabs.Content key={i} value={`tab${i + 1}`}>
              <p>Content for tab {i + 1}.</p>
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    );
  },
};
