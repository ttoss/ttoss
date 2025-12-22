import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { LockedModal } from '@ttoss/components/LockedModal';
import { Icon } from '@ttoss/react-icons';
import { Box, Card, Flex, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta<typeof LockedModal> = {
  title: 'Components/LockedModal',
  component: LockedModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A generic modal component for displaying locked features or restricted content. Provides a consistent UI for showing users content that requires additional permissions, plan upgrades, or other conditions to access.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls the modal visibility',
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
      description: 'Content to be rendered in the modal body',
    },
    actions: {
      control: 'object',
      description:
        'Optional list of actions to render as buttons in the footer',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LockedModal>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LockedModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = React.useState(args.isOpen);

  return (
    <>
      <button
        onClick={() => {
          return setIsOpen(true);
        }}
      >
        Open Modal
      </button>
      <LockedModal
        {...args}
        isOpen={isOpen}
        onRequestClose={() => {
          // Close the modal when requested
          return setIsOpen(false);
        }}
      />
    </>
  );
};

/**
 * Default example showing a feature locked behind a plan upgrade
 */
export const Default: Story = {
  render: (args) => {
    return <LockedModalWrapper {...args} />;
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
    return <LockedModalWrapper {...args} />;
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
    return <LockedModalWrapper {...args} />;
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
    return <LockedModalWrapper {...args} />;
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
    return <LockedModalWrapper {...args} />;
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
