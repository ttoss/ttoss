import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { LockedOverlay } from '@ttoss/components/LockedOverlay';
import { Layout, SidebarCollapseLayout } from '@ttoss/layouts';
import { Icon } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta<typeof LockedOverlay> = {
  title: 'Components/LockedOverlay',
  component: LockedOverlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "A component for blocking and displaying locked features or restricted content within a specific container. Renders as an absolutely positioned overlay that blocks the parent container's content. The parent container must have `position: relative` for proper positioning.",
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls the overlay visibility',
    },
    onRequestClose: {
      description: 'Optional close handler',
    },
    header: {
      control: 'object',
      description: 'Header configuration for the SpotlightCard',
    },
    children: {
      control: false,
      description: 'Content to be rendered in the overlay body',
    },
    actions: {
      control: 'object',
      description:
        'Optional list of actions to render as buttons in the footer',
    },
    zIndex: {
      control: 'number',
      description: 'Optional z-index value (default: 1)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LockedOverlay>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LockedOverlayWrapper = (args: any) => {
  const [isOpen, setIsOpen] = React.useState(args.isOpen);

  return (
    <Box sx={{ position: 'relative', width: '1200px', height: '800px' }}>
      <button
        onClick={() => {
          return setIsOpen(true);
        }}
      >
        Open Overlay
      </button>
      <LockedOverlay
        {...args}
        isOpen={isOpen}
        onRequestClose={() => {
          // Close the overlay when requested
          return setIsOpen(false);
        }}
      />
    </Box>
  );
};

/**
 * Default example showing a feature locked behind a plan upgrade
 */
export const Default: Story = {
  render: (args) => {
    return <LockedOverlayWrapper {...args} />;
  },
  args: {
    isOpen: false,
    header: {
      icon: 'fluent:lock-closed-24-filled',
      title: 'Premium Feature',
      description: 'Available in Pro plan only',
      variant: 'primary',
    },
    children: (
      <Stack sx={{ gap: '6', alignItems: 'center', width: 'full' }}>
        <Flex sx={{ textAlign: 'center' }}>
          <Text sx={{ color: 'display.text.secondary.default' }}>
            Upgrade to access advanced features and unlock your full potential.
          </Text>
        </Flex>
      </Stack>
    ),
    actions: [
      {
        label: 'Upgrade Now',
        icon: 'fluent-emoji-high-contrast:sparkles',
        variant: 'primary',
        onClick: () => {
          return alert('Upgrade clicked!');
        },
      },
      {
        label: 'Learn More',
        icon: 'fluent:arrow-right-16-regular',
        variant: 'accent',
        onClick: () => {
          return alert('Learn more clicked!');
        },
      },
    ],
  },
};

/**
 * Example with detailed feature list and plan information
 */
export const WithFeatureList: Story = {
  render: (args) => {
    return <LockedOverlayWrapper {...args} />;
  },
  args: {
    isOpen: false,
    header: {
      icon: 'fluent:lock-closed-24-filled',
      title: 'Campaign Optimization',
      description: 'Available in Business plans and above',
      variant: 'primary',
    },
    children: (
      <Stack
        sx={{
          gap: '6',
          justifyContent: 'center',
          alignItems: 'center',
          width: 'full',
        }}
      >
        <Flex sx={{ textAlign: 'center' }}>
          <Text sx={{ color: 'display.text.secondary.default' }}>
            You are on the{' '}
            <Text as="span" sx={{ fontWeight: 'semibold' }}>
              Starter
            </Text>{' '}
            plan which includes basic tracking features only.
          </Text>
        </Flex>

        <Card
          as="section"
          sx={{
            px: ['6', '8'],
            py: ['4', '6'],
            width: 'full',
          }}
        >
          <Text
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              fontWeight: 'semibold',
              mb: '3',
            }}
          >
            <Icon icon="fluent:magic-wand-16-regular" /> Unlock with Upgrade
          </Text>
          <Box as="ul" sx={{ pl: '4', display: 'grid', gap: '2' }}>
            <Text as="li" sx={{ color: 'display.text.secondary.default' }}>
              Automatic optimization based on advanced algorithms
            </Text>
            <Text as="li" sx={{ color: 'display.text.secondary.default' }}>
              Custom optimization profiles
            </Text>
            <Text as="li" sx={{ color: 'display.text.secondary.default' }}>
              Smart budget control
            </Text>
            <Text as="li" sx={{ color: 'display.text.secondary.default' }}>
              Pause low-performing ads automatically
            </Text>
          </Box>
        </Card>
      </Stack>
    ),
    actions: [
      {
        label: 'Upgrade Now',
        icon: 'fluent-emoji-high-contrast:sparkles',
        variant: 'primary',
        onClick: () => {
          return alert('Upgrade clicked!');
        },
      },
      {
        label: 'Go to Tracking',
        icon: 'fluent:arrow-right-16-regular',
        variant: 'accent',
        onClick: () => {
          return alert('Go to tracking clicked!');
        },
      },
    ],
  },
};

/**
 * Example with accent variant header
 */
export const AccentVariant: Story = {
  render: (args) => {
    return <LockedOverlayWrapper {...args} />;
  },
  args: {
    isOpen: false,
    header: {
      icon: 'fluent:premium-16-filled',
      title: 'Advanced Analytics',
      description: 'Exclusive for Enterprise customers',
      variant: 'accent',
    },
    children: (
      <Stack sx={{ gap: '4', alignItems: 'center', width: 'full' }}>
        <Text
          sx={{
            textAlign: 'center',
            color: 'display.text.secondary.default',
          }}
        >
          Get deeper insights with custom reports, real-time dashboards, and
          AI-powered recommendations.
        </Text>
      </Stack>
    ),
    actions: [
      {
        label: 'Contact Sales',
        icon: 'fluent:call-16-regular',
        variant: 'primary',
        onClick: () => {
          return alert('Contact sales clicked!');
        },
      },
    ],
  },
};

/**
 * Example without footer actions
 */
export const WithoutActions: Story = {
  render: (args) => {
    return <LockedOverlayWrapper {...args} />;
  },
  args: {
    isOpen: false,
    header: {
      icon: 'fluent:lock-closed-24-filled',
      title: 'Coming Soon',
      description: 'This feature is under development',
      variant: 'primary',
    },
    children: (
      <Stack sx={{ gap: '4', alignItems: 'center', width: 'full' }}>
        <Text
          sx={{
            textAlign: 'center',
            color: 'display.text.secondary.default',
          }}
        >
          We&apos;re working hard to bring you this feature. Stay tuned for
          updates!
        </Text>
      </Stack>
    ),
  },
};

/**
 * Example with single action button
 */
export const SingleAction: Story = {
  render: (args) => {
    return <LockedOverlayWrapper {...args} />;
  },
  args: {
    isOpen: false,
    header: {
      icon: 'fluent:shield-lock-16-filled',
      title: 'Admin Access Required',
      description: 'This section is restricted to administrators',
      variant: 'primary',
    },
    children: (
      <Stack sx={{ gap: '4', alignItems: 'center', width: 'full' }}>
        <Text
          sx={{
            textAlign: 'center',
            color: 'display.text.secondary.default',
          }}
        >
          Please contact your workspace administrator to request access to this
          feature.
        </Text>
      </Stack>
    ),
    actions: [
      {
        label: 'Contact Admin',
        icon: 'fluent:mail-16-regular',
        variant: 'primary',
        onClick: () => {
          return alert('Contact admin clicked!');
        },
      },
    ],
  },
};

/**
 * Example inside SidebarCollapseLayout with custom zIndex
 * to prevent overlay from covering header/sidebar
 */

const LayoutWithOverlayExample = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SidebarCollapseLayout>
      <Layout.Header showSidebarButton={true}>
        <Text sx={{ fontWeight: 'bold' }}>Application Header</Text>
      </Layout.Header>

      <Layout.Sidebar showSidebarButtonInDrawer={true}>
        <Stack sx={{ gap: '4' }}>
          <Text sx={{ fontWeight: 'semibold' }}>Menu Items</Text>
          <Box>Dashboard</Box>
          <Box>Analytics</Box>
          <Box>Settings</Box>
          <Box>Profile</Box>
        </Stack>
      </Layout.Sidebar>

      <Layout.Main>
        <Layout.Main.Header sx={{ borderBottom: '1px solid gray' }}>
          <Text sx={{ fontWeight: 'semibold' }}>Page Content</Text>
        </Layout.Main.Header>

        <Layout.Main.Body sx={{ position: 'relative' }}>
          <Stack sx={{ gap: '6', padding: '6', minHeight: '675px' }}>
            <Text>
              This overlay uses <code>position: absolute</code> with{' '}
              <code>top: 0, left: 0</code> to cover only the Main.Body.
            </Text>
            <Text>
              The Layout.Main.Body has <code>position: relative</code> to serve
              as the positioning container.
            </Text>
            <Button
              variant="primary"
              onClick={() => {
                return setIsOpen(true);
              }}
              sx={{ maxWidth: '200px' }}
            >
              Open Overlay in Body
            </Button>
          </Stack>
          <LockedOverlay
            isOpen={isOpen}
            onRequestClose={() => {
              return setIsOpen(false);
            }}
            zIndex={1}
            header={{
              icon: 'fluent:lock-closed-24-filled',
              title: 'Feature Locked',
              description: 'Overlay centered in Main.Body content',
              variant: 'primary',
            }}
            actions={[
              {
                label: 'Close Overlay',
                icon: 'fluent:dismiss-16-regular',
                variant: 'accent',
                onClick: () => {
                  return setIsOpen(false);
                },
              },
            ]}
          >
            <Stack sx={{ gap: '4', alignItems: 'center', width: 'full' }}>
              <Text
                sx={{
                  textAlign: 'center',
                  color: 'display.text.secondary.default',
                }}
              >
                Notice how the overlay covers only the Main.Body content area,
                not the header or sidebar.
              </Text>
              <Box
                sx={{
                  backgroundColor: 'display.background.secondary.default',
                  padding: '4',
                  borderRadius: 'md',
                  width: 'full',
                }}
              >
                <Text
                  sx={{
                    fontSize: 'xs',
                    fontFamily: 'monospace',
                  }}
                >
                  Layout.Main.Body: position relative
                  <br />
                  Overlay: position absolute, top: 0, left: 0
                  <br />
                  Overlay zIndex: 1
                  <br />
                  Header/Sidebar zIndex: overlay (1300)
                </Text>
              </Box>
            </Stack>
          </LockedOverlay>
        </Layout.Main.Body>

        <Layout.Main.Footer
          sx={{
            borderTop: '1px solid gray',
            position: 'relative',
          }}
        >
          <Text>Footer Content</Text>
        </Layout.Main.Footer>
      </Layout.Main>
    </SidebarCollapseLayout>
  );
};

export const InsideLayoutWithCustomZIndex: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    return <LayoutWithOverlayExample />;
  },
};
