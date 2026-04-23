/* eslint-disable formatjs/no-literal-string-in-jsx */
import { Button } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Box, Flex } from '@ttoss/ui';

const meta: Meta<typeof Button> = {
  title: 'Chakra UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Chakra UI Button component styled with ttoss semantic color tokens through custom recipes. Supports multiple variants (solid, outline, ghost, plain) and automatically applies theme colors.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'plain'],
      description: 'Button variant style',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size (using Chakra default tokens)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * Default solid button with primary action colors.
 */
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

/**
 * Solid variant with filled background and primary action colors.
 */
export const Solid: Story = {
  args: {
    variant: 'solid',
    children: 'Solid Button',
  },
};

/**
 * Outline variant with border and transparent background.
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Ghost variant with transparent background and hover effect.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Plain variant with accent text color and no background.
 */
export const Plain: Story = {
  args: {
    variant: 'plain',
    children: 'Plain Button',
  },
};

/**
 * Buttons in different sizes using Chakra default sizing tokens.
 */
export const Sizes: Story = {
  render: () => {
    return (
      <Flex sx={{ gap: 4, alignItems: 'center' }}>
        <Button size="xs">Extra Small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="xl">Extra Large</Button>
      </Flex>
    );
  },
};

/**
 * Disabled button states across different variants.
 */
export const Disabled: Story = {
  render: () => {
    return (
      <Flex sx={{ gap: 4, flexDirection: 'column' }}>
        <Flex sx={{ gap: 4 }}>
          <Button variant="solid" disabled>
            Solid Disabled
          </Button>
          <Button variant="outline" disabled>
            Outline Disabled
          </Button>
          <Button variant="ghost" disabled>
            Ghost Disabled
          </Button>
          <Button variant="plain" disabled>
            Plain Disabled
          </Button>
        </Flex>
      </Flex>
    );
  },
};

/**
 * All button variants displayed together for comparison.
 */
export const AllVariants: Story = {
  render: () => {
    return (
      <Box sx={{ p: 4 }}>
        <Flex sx={{ gap: 4, flexDirection: 'column' }}>
          <Box>
            <Flex sx={{ gap: 4, mb: 2 }}>
              <Button variant="solid">Solid</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="plain">Plain</Button>
            </Flex>
          </Box>
          <Box>
            <Flex sx={{ gap: 4 }}>
              <Button variant="solid" disabled>
                Solid Disabled
              </Button>
              <Button variant="outline" disabled>
                Outline Disabled
              </Button>
              <Button variant="ghost" disabled>
                Ghost Disabled
              </Button>
              <Button variant="plain" disabled>
                Plain Disabled
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  },
};

/**
 * Button with loading state.
 */
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading Button',
  },
};

/**
 * Buttons with icons.
 */
export const WithIcons: Story = {
  render: () => {
    return (
      <Flex sx={{ gap: 4 }}>
        <Button variant="solid">📧 Send Email</Button>
        <Button variant="outline">💾 Save</Button>
        <Button variant="ghost">⚙️ Settings</Button>
      </Flex>
    );
  },
};

/**
 * Full width button.
 */
export const FullWidth: Story = {
  render: () => {
    return (
      <Box sx={{ width: '100%' }}>
        <Button width="100%" variant="solid">
          Full Width Button
        </Button>
      </Box>
    );
  },
};

/**
 * Interactive example showing hover and active states.
 */
export const InteractiveStates: Story = {
  render: () => {
    return (
      <Flex sx={{ gap: 4, flexDirection: 'column' }}>
        <Box>
          <p style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
            Hover over these buttons to see the hover state:
          </p>
          <Flex sx={{ gap: 4 }}>
            <Button variant="solid">Hover me (Solid)</Button>
            <Button variant="outline">Hover me (Outline)</Button>
            <Button variant="ghost">Hover me (Ghost)</Button>
          </Flex>
        </Box>
        <Box>
          <p style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
            Click and hold to see the active state:
          </p>
          <Flex sx={{ gap: 4 }}>
            <Button variant="solid">Click me (Solid)</Button>
            <Button variant="outline">Click me (Outline)</Button>
            <Button variant="ghost">Click me (Ghost)</Button>
          </Flex>
        </Box>
      </Flex>
    );
  },
};
