import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Accordion } from '@ttoss/components/Accordion';
import { Badge, Box, Button, Flex, IconButton, Text } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Accessible accordion component with collapsible content sections. Uses simplified data-driven API with design tokens for consistent styling. Supports single or multiple expanded items and follows WAI-ARIA accordion pattern.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

/**
 * Default accordion with simple items.
 * Only one item can be expanded at a time (default behavior).
 */
export const Default: Story = {
  args: {
    items: [
      {
        id: 'item-1',
        title: 'What harsh truths do you prefer to ignore?',
        content:
          'Exercitation in fugiat est ut ad ea cupidatat ut in cupidatat occaecat ut occaecat consequat est minim minim esse tempor laborum consequat esse adipisicing eu reprehenderit enim.',
      },
      {
        id: 'item-2',
        title: 'Is free will real or just an illusion?',
        content:
          'In ad velit in ex nostrud dolore cupidatat consectetur ea in ut nostrud velit in irure cillum tempor laboris sed adipisicing eu esse duis nulla non.',
      },
    ],
  },
};

/**
 * Accordion allowing multiple items to be expanded simultaneously.
 */
export const MultipleExpanded: Story = {
  args: {
    multiple: true,
    items: [
      {
        id: 'section-1',
        title: 'Section 1',
        content:
          'Content for section 1. You can expand multiple sections at once.',
      },
      {
        id: 'section-2',
        title: 'Section 2',
        content:
          'Content for section 2. This can be expanded while section 1 is also expanded.',
      },
      {
        id: 'section-3',
        title: 'Section 3',
        content: 'Content for section 3. All three can be expanded together.',
      },
    ],
  },
};

/**
 * Accordion with pre-expanded items using defaultExpanded prop.
 */
export const PreExpanded: Story = {
  args: {
    defaultExpanded: 0,
    items: [
      {
        id: 'pre-expanded',
        title: 'Pre-expanded Section',
        content: 'This section is expanded by default.',
      },
      {
        id: 'collapsed',
        title: 'Collapsed Section',
        content: 'This section starts collapsed.',
      },
    ],
  },
};

/**
 * Accordion with multiple pre-expanded items.
 */
export const MultiplePreExpanded: Story = {
  args: {
    multiple: true,
    defaultExpanded: [0, 2],
    items: [
      {
        id: 'first',
        title: 'First Section (Expanded)',
        content: 'This section is expanded by default.',
      },
      {
        id: 'second',
        title: 'Second Section (Collapsed)',
        content: 'This section starts collapsed.',
      },
      {
        id: 'third',
        title: 'Third Section (Expanded)',
        content: 'This section is also expanded by default.',
      },
    ],
  },
};

/**
 * Accordion with disabled items that cannot be toggled.
 */
export const WithDisabledItems: Story = {
  args: {
    items: [
      {
        id: 'enabled',
        title: 'Enabled Section',
        content: 'This section can be expanded and collapsed.',
      },
      {
        id: 'disabled',
        title: 'Disabled Section',
        content: 'This content cannot be accessed.',
        disabled: true,
      },
      {
        id: 'another-enabled',
        title: 'Another Enabled Section',
        content: 'This section is also interactive.',
      },
    ],
  },
};

/**
 * Accordion with rich React nodes as title and content.
 */
export const WithRichContent: Story = {
  args: {
    items: [
      {
        id: 'rich-1',
        title: (
          <Flex sx={{ alignItems: 'center', gap: 2 }}>
            <IconButton icon="fluent:person-24-regular" />
            <Text>User Profile</Text>
            <Badge variant="accent">New</Badge>
          </Flex>
        ),
        content: (
          <Box>
            <Text sx={{ fontWeight: 'bold', marginBottom: 2 }}>
              Profile Details
            </Text>
            <Text>Name: John Doe</Text>
            <Text>Email: john@example.com</Text>
          </Box>
        ),
      },
      {
        id: 'rich-2',
        title: (
          <Flex sx={{ alignItems: 'center', gap: 2 }}>
            <IconButton icon="fluent:settings-24-regular" />
            <Text>Settings</Text>
          </Flex>
        ),
        content: (
          <Box>
            <Text>Configure your application settings here.</Text>
          </Box>
        ),
      },
    ],
  },
};

const WithOnChangeComponent = () => {
  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);

  return (
    <Box>
      <Text sx={{ marginBottom: 3, fontWeight: 'bold' }}>
        Expanded items:{' '}
        {expandedItems.length > 0 ? expandedItems.join(', ') : 'None'}
      </Text>
      <Accordion
        multiple
        onAccordionChange={setExpandedItems}
        items={[
          {
            id: 'first',
            title: 'First Item',
            content: 'Content of first item.',
          },
          {
            id: 'second',
            title: 'Second Item',
            content: 'Content of second item.',
          },
          {
            id: 'third',
            title: 'Third Item',
            content: 'Content of third item.',
          },
        ]}
      />
    </Box>
  );
};

/**
 * Accordion with onChange callback to track expanded items.
 */
export const WithOnChange: Story = {
  render: () => {
    return <WithOnChangeComponent />;
  },
};

/**
 * Accordion with custom renderItem for complete control over rendering.
 * This example shows how to create a custom accordion item with custom styling.
 */
export const CustomRenderItem: Story = {
  args: {
    multiple: true,
    items: [
      {
        id: 'custom-1',
        title: 'Custom Item 1',
        content: 'Custom content for item 1',
      },
      {
        id: 'custom-2',
        title: 'Custom Item 2',
        content: 'Custom content for item 2',
      },
    ],
    renderItem: ({ item, isExpanded, toggle, ids }) => {
      return (
        <Box
          key={ids.itemId}
          sx={{
            border: 'md',
            borderColor: isExpanded ? 'action.border.accent.default' : 'black',
            borderRadius: 'lg',
            overflow: 'hidden',
            marginBottom: 2,
          }}
        >
          <Button
            type="button"
            onClick={toggle}
            aria-expanded={isExpanded}
            aria-controls={ids.panelId}
            sx={{
              width: '100%',
              padding: 4,
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isExpanded
                ? 'action.background.accent.default'
                : 'display.background.secondary.default',
              color: isExpanded ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: isExpanded
                  ? 'action.background.accent.default'
                  : 'display.background.muted.default',
              },
            }}
          >
            <span>{item.title}</span>
            <IconButton icon={isExpanded ? 'minus' : 'plus'} />
          </Button>
          {isExpanded && (
            <Box
              id={ids.panelId}
              role="region"
              aria-labelledby={ids.headingId}
              sx={{
                padding: 4,
                backgroundColor: 'display.background.primary.default',
              }}
            >
              {item.content}
            </Box>
          )}
        </Box>
      );
    },
  },
};
